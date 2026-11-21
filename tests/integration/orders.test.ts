import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { createOrder } from "@/server/services/orders";
import { cleanup, createEvent, createUser, orderInput } from "./helpers";

describe("createOrder (PostgreSQL)", () => {
  const users: string[] = [];
  let organizerId: string;
  let buyerId: string;

  beforeAll(async () => {
    organizerId = (await createUser("ORGANIZER")).id;
    buyerId = (await createUser("VISITOR")).id;
    users.push(organizerId, buyerId);
  });
  afterAll(async () => {
    await cleanup(users);
    await prisma.$disconnect();
  });

  it("creates a paid order with one ticket per seat and server-side prices", async () => {
    const event = await createEvent(organizerId);
    const tt = event.ticketTypes[0]!;
    const { number, replayed } = await createOrder(buyerId, orderInput(event.id, tt.id, 3));
    expect(replayed).toBe(false);

    const order = await prisma.order.findUniqueOrThrow({
      where: { number },
      include: { tickets: true },
    });
    expect(order.subtotal).toBe(15000);
    expect(order.serviceFee).toBe(600);
    expect(order.total).toBe(15600);
    expect(order.cardLast4).toBe("4242");
    expect(order.tickets).toHaveLength(3);
    // QR codes are opaque random strings, no personal data
    for (const t of order.tickets) expect(t.code).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect((await prisma.ticketType.findUniqueOrThrow({ where: { id: tt.id } })).sold).toBe(3);
  });

  it("returns the same order for a repeated idempotency key (double submit)", async () => {
    const event = await createEvent(organizerId);
    const tt = event.ticketTypes[0]!;
    const input = orderInput(event.id, tt.id, 2);
    const results = await Promise.all([
      createOrder(buyerId, input),
      createOrder(buyerId, input),
      createOrder(buyerId, input),
    ]);

    expect(new Set(results.map((r) => r.number)).size).toBe(1);
    expect(await prisma.order.count({ where: { eventId: event.id } })).toBe(1);
    expect((await prisma.ticketType.findUniqueOrThrow({ where: { id: tt.id } })).sold).toBe(2);
  });

  it("never oversells under concurrent purchases", async () => {
    const event = await createEvent(organizerId, { quantity: 5, maxPerOrder: 5 });
    const tt = event.ticketTypes[0]!;
    // 8 buyers race for 5 seats, 2 tickets each → at most 2 orders can succeed.
    const attempts = await Promise.allSettled(
      Array.from({ length: 8 }, () => createOrder(buyerId, orderInput(event.id, tt.id, 2))),
    );
    const ok = attempts.filter((a) => a.status === "fulfilled");
    const failed = attempts.filter((a): a is PromiseRejectedResult => a.status === "rejected");

    expect(ok).toHaveLength(2);
    for (const f of failed) expect(f.reason).toBeInstanceOf(HttpError);
    const fresh = await prisma.ticketType.findUniqueOrThrow({ where: { id: tt.id } });
    expect(fresh.sold).toBe(4);
    expect(await prisma.ticket.count({ where: { eventId: event.id } })).toBe(4);
  });

  it("rejects quantities above what's left", async () => {
    const event = await createEvent(organizerId, { quantity: 1 });
    await expect(
      createOrder(buyerId, orderInput(event.id, event.ticketTypes[0]!.id, 2)),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("rolls back inventory when the test card is declined", async () => {
    const event = await createEvent(organizerId);
    const tt = event.ticketTypes[0]!;
    const input = {
      ...orderInput(event.id, tt.id, 2),
      payment: { cardNumber: "4000 0000 0000 0002", expiry: "12/30", cvc: "123" },
    };
    await expect(createOrder(buyerId, input)).rejects.toMatchObject({
      status: 402,
      code: "PAYMENT_DECLINED",
    });
    expect((await prisma.ticketType.findUniqueOrThrow({ where: { id: tt.id } })).sold).toBe(0);
    expect(await prisma.order.count({ where: { eventId: event.id } })).toBe(0);
  });

  it("does not sell tickets for drafts", async () => {
    const event = await createEvent(organizerId, { status: "DRAFT" });
    await expect(
      createOrder(buyerId, orderInput(event.id, event.ticketTypes[0]!.id, 1)),
    ).rejects.toMatchObject({ status: 404 });
  });
});
