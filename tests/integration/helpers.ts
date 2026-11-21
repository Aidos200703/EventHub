import { randomBytes, randomUUID } from "node:crypto";
import { prisma } from "@/server/db";

const uid = () => randomBytes(8).toString("hex");

/** Creates an isolated user; everything created for a test is tagged with a unique suffix. */
export async function createUser(role: "VISITOR" | "ORGANIZER") {
  const id = uid();
  return prisma.user.create({
    data: { id, name: `Test ${role} ${id}`, email: `${id}@test.eventhub.kz`, role },
  });
}

export async function createEvent(
  organizerId: string,
  opts: { quantity?: number; maxPerOrder?: number; status?: "DRAFT" | "PUBLISHED" } = {},
) {
  const id = uid();
  return prisma.event.create({
    data: {
      slug: `test-${id}`,
      title: `Integration test ${id}`,
      summary: "Integration test event",
      description: "Integration test event description that is long enough.",
      category: "CONCERT",
      city: "almaty",
      venueName: "Test Hall",
      venueAddress: "Test St 1, Almaty",
      startsAt: new Date(Date.now() + 7 * 86_400_000),
      endsAt: new Date(Date.now() + 7 * 86_400_000 + 3 * 3_600_000),
      coverUrl: "/covers/steppe-echoes-festival.webp",
      status: opts.status ?? "PUBLISHED",
      minPrice: 5000,
      organizerId,
      ticketTypes: {
        create: [
          {
            name: "Standard",
            price: 5000,
            quantity: opts.quantity ?? 10,
            maxPerOrder: opts.maxPerOrder ?? 10,
          },
        ],
      },
    },
    include: { ticketTypes: true },
  });
}

export function orderInput(
  eventId: string,
  ticketTypeId: string,
  quantity: number,
  idempotencyKey = randomUUID(),
) {
  return {
    eventId,
    idempotencyKey,
    selection: { [ticketTypeId]: quantity },
    buyer: { name: "Test Buyer", email: "buyer@test.eventhub.kz", phone: "+77010000000" },
    payment: { cardNumber: "4242 4242 4242 4242", expiry: "12/30", cvc: "123" },
  };
}

export async function cleanup(userIds: string[]) {
  // Cascades remove events, ticket types, orders and tickets.
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}
