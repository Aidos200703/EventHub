import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import {
  calculateQuote,
  describeIssue,
  validateSelection,
  type PricedTicketType,
} from "@/lib/pricing";
import { createOrderSchema, TEST_CARDS } from "@/lib/validation/checkout";
import { prisma } from "../db";
import { HttpError } from "../http";

const ORDER_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O/1/I

export function generateOrderNumber() {
  let out = "EH-";
  for (let i = 0; i < 6; i++) out += ORDER_ALPHABET[randomInt(ORDER_ALPHABET.length)];
  return out;
}

/** 128 bits of randomness, URL-safe. This is the only thing encoded in a ticket QR. */
export function generateTicketCode() {
  return randomBytes(16).toString("base64url");
}

/** Simulated payment provider. No network calls, no real money. */
function chargeTestCard(cardNumber: string) {
  if (cardNumber === TEST_CARDS.declined.replace(/\s/g, "")) {
    throw new HttpError(
      402,
      "PAYMENT_DECLINED",
      "The test card was declined. Use 4242 4242 4242 4242 to simulate a successful payment.",
    );
  }
}

export type CreatedOrder = { number: string; replayed: boolean };

/**
 * Creates a paid order.
 *
 * Guarantees:
 * - Prices and availability come from the database, never from the client.
 * - Inventory is reserved with a conditional UPDATE (`sold + n <= quantity`) inside the
 *   transaction, so concurrent buyers cannot oversell (plus a CHECK constraint as a backstop).
 * - The idempotency key is unique: double submits return the same order instead of a second one.
 */
export async function createOrder(userId: string, rawInput: unknown): Promise<CreatedOrder> {
  const input = createOrderSchema.parse(rawInput);

  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: { number: true, userId: true },
  });
  if (existing) {
    if (existing.userId !== userId)
      throw new HttpError(409, "IDEMPOTENCY_CONFLICT", "This checkout session is no longer valid");
    return { number: existing.number, replayed: true };
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const number = await prisma.$transaction(async (tx) => {
        const event = await tx.event.findFirst({
          where: { id: input.eventId, status: "PUBLISHED" },
          include: { ticketTypes: true },
        });
        if (!event)
          throw new HttpError(404, "EVENT_NOT_FOUND", "This event is not available for booking");
        if (event.startsAt <= new Date())
          throw new HttpError(409, "SALES_CLOSED", "Ticket sales for this event have ended");

        const priced: PricedTicketType[] = event.ticketTypes.map((t) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          available: t.quantity - t.sold,
          maxPerOrder: t.maxPerOrder,
        }));
        const issues = validateSelection(priced, input.selection);
        if (issues.length > 0) throw new HttpError(409, issues[0]!.code, describeIssue(issues[0]!));

        const quote = calculateQuote(priced, input.selection);
        const orderNumber = generateOrderNumber();

        // Insert first: a duplicate idempotency key aborts before inventory is touched.
        const order = await tx.order.create({
          data: {
            number: orderNumber,
            idempotencyKey: input.idempotencyKey,
            userId,
            eventId: event.id,
            buyerName: input.buyer.name,
            buyerEmail: input.buyer.email,
            buyerPhone: input.buyer.phone,
            subtotal: quote.subtotal,
            serviceFee: quote.serviceFee,
            total: quote.total,
            cardLast4: input.payment.cardNumber.slice(-4),
            items: {
              create: quote.lines.map((l) => ({
                ticketTypeId: l.ticketTypeId,
                name: l.name,
                unitPrice: l.unitPrice,
                quantity: l.quantity,
              })),
            },
          },
          select: { id: true },
        });

        for (const line of quote.lines) {
          const updated = await tx.$executeRaw`
            UPDATE "TicketType"
            SET "sold" = "sold" + ${line.quantity}, "updatedAt" = NOW()
            WHERE "id" = ${line.ticketTypeId} AND "eventId" = ${event.id} AND "sold" + ${line.quantity} <= "quantity"`;
          if (updated !== 1) {
            throw new HttpError(
              409,
              "NOT_ENOUGH_AVAILABLE",
              `Not enough "${line.name}" tickets left. Please adjust your selection.`,
            );
          }
        }

        chargeTestCard(input.payment.cardNumber);

        await tx.ticket.createMany({
          data: quote.lines.flatMap((l) =>
            Array.from({ length: l.quantity }, () => ({
              code: generateTicketCode(),
              orderId: order.id,
              eventId: event.id,
              ticketTypeId: l.ticketTypeId,
            })),
          ),
        });
        await tx.order.update({ where: { id: order.id }, data: { paidAt: new Date() } });
        return orderNumber;
      });
      return { number, replayed: false };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        // Either a concurrent request with the same idempotency key won the race,
        // or (astronomically unlikely) the order number collided — then retry.
        const winner = await prisma.order.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          select: { number: true, userId: true },
        });
        if (winner) {
          if (winner.userId !== userId)
            throw new HttpError(
              409,
              "IDEMPOTENCY_CONFLICT",
              "This checkout session is no longer valid",
            );
          return { number: winner.number, replayed: true };
        }
        continue;
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") continue; // serialization retry
      throw err;
    }
  }
  throw new HttpError(503, "TRY_AGAIN", "We could not complete your order. Please try again.");
}

/** Full order with tickets — only for its owner. */
export async function getOrderForUser(userId: string, number: string) {
  return prisma.order.findFirst({
    where: { number, userId },
    include: {
      event: {
        select: {
          slug: true,
          title: true,
          coverUrl: true,
          startsAt: true,
          endsAt: true,
          venueName: true,
          venueAddress: true,
          city: true,
          category: true,
        },
      },
      items: true,
      tickets: {
        orderBy: [{ ticketType: { position: "asc" } }, { createdAt: "asc" }],
        include: { ticketType: { select: { name: true } } },
      },
    },
  });
}

export async function getUserBookings(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId, status: "PAID" },
    orderBy: { createdAt: "desc" },
    include: {
      event: {
        select: {
          slug: true,
          title: true,
          coverUrl: true,
          startsAt: true,
          endsAt: true,
          venueName: true,
          city: true,
        },
      },
      _count: { select: { tickets: true } },
      tickets: { where: { status: "USED" }, select: { id: true } },
    },
  });
  const now = new Date();
  const map = (o: (typeof orders)[number]) => ({
    id: o.id,
    number: o.number,
    total: o.total,
    createdAt: o.createdAt,
    ticketCount: o._count.tickets,
    usedCount: o.tickets.length,
    event: o.event,
  });
  const upcoming = orders
    .filter((o) => o.event.endsAt >= now)
    .map(map)
    .sort((a, b) => +a.event.startsAt - +b.event.startsAt);
  const past = orders
    .filter((o) => o.event.endsAt < now)
    .map(map)
    .sort((a, b) => +b.event.startsAt - +a.event.startsAt);
  return { upcoming, past };
}

export type Booking = Awaited<ReturnType<typeof getUserBookings>>["upcoming"][number];
