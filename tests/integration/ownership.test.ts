import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { createOrder } from "@/server/services/orders";
import {
  checkInTicket,
  deleteEvent,
  getOrganizerEvent,
  listOrganizerOrders,
  setEventStatus,
  updateEvent,
} from "@/server/services/organizer";
import { cleanup, createEvent, createUser, orderInput } from "./helpers";

/** An organizer must never read or change another organizer's data. */
describe("organizer ownership checks (PostgreSQL)", () => {
  const users: string[] = [];
  let owner: string;
  let intruder: string;
  let eventId: string;
  let ticketCode: string;

  beforeAll(async () => {
    owner = (await createUser("ORGANIZER")).id;
    intruder = (await createUser("ORGANIZER")).id;
    const buyer = (await createUser("VISITOR")).id;
    users.push(owner, intruder, buyer);
    const event = await createEvent(owner);
    eventId = event.id;
    const { number } = await createOrder(buyer, orderInput(event.id, event.ticketTypes[0]!.id, 1));
    ticketCode = (await prisma.ticket.findFirstOrThrow({ where: { order: { number } } })).code;
  });
  afterAll(async () => {
    await cleanup(users);
    await prisma.$disconnect();
  });

  const formValues = () => ({
    title: "Hijacked",
    summary: "Trying to edit someone else's event",
    description: "This update must be rejected by the ownership check on the server.",
    category: "CONCERT",
    city: "almaty",
    venueName: "Somewhere",
    venueAddress: "Somewhere St 1",
    startsAt: "2030-01-01T19:00",
    endsAt: "2030-01-01T22:00",
    coverUrl: "/covers/steppe-echoes-festival.webp",
    ticketTypes: [{ name: "Free", price: 100, quantity: 1, maxPerOrder: 1 }],
    program: [],
  });

  it("can't read another organizer's event", async () => {
    await expect(getOrganizerEvent(intruder, eventId)).rejects.toMatchObject({ status: 404 });
    await expect(getOrganizerEvent(owner, eventId)).resolves.toMatchObject({ id: eventId });
  });

  it("can't edit, unpublish or delete it", async () => {
    await expect(updateEvent(intruder, eventId, formValues())).rejects.toMatchObject({
      status: 404,
    });
    await expect(setEventStatus(intruder, eventId, { status: "DRAFT" })).rejects.toMatchObject({
      status: 404,
    });
    await expect(deleteEvent(intruder, eventId)).rejects.toMatchObject({ status: 404 });

    const unchanged = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
    expect(unchanged.title).not.toBe("Hijacked");
    expect(unchanged.status).toBe("PUBLISHED");
  });

  it("doesn't see its orders, even when filtering by its id", async () => {
    const page = await listOrganizerOrders(intruder, { eventId });
    expect(page.total).toBe(0);
    expect((await listOrganizerOrders(owner, { eventId })).total).toBe(1);
  });

  it("can't check in its tickets", async () => {
    await expect(checkInTicket(intruder, { code: ticketCode })).rejects.toMatchObject({
      status: 404,
      code: "TICKET_NOT_FOUND",
    });
    const res = await checkInTicket(owner, { code: ticketCode });
    expect(res.alreadyUsed).toBe(false);
    expect(res.ticket.status).toBe("USED");
    // A second scan is reported, not double-counted.
    expect((await checkInTicket(owner, { code: ticketCode })).alreadyUsed).toBe(true);
  });

  it("protects sold inventory when the owner edits ticket types", async () => {
    // Removing a ticket type that already has sales is refused.
    const replaceSold = {
      ...formValues(),
      ticketTypes: [{ name: "Another", price: 1000, quantity: 10, maxPerOrder: 5 }],
    };
    await expect(updateEvent(owner, eventId, replaceSold)).rejects.toMatchObject({
      status: 409,
      code: "TICKET_TYPE_HAS_SALES",
    });

    // Editing it in place works, and the sold counter is preserved.
    const event = await getOrganizerEvent(owner, eventId);
    const tt = event.ticketTypes[0]!;
    const rename = {
      ...formValues(),
      title: "Renamed by owner",
      ticketTypes: [{ id: tt.id, name: "Standard+", price: 6000, quantity: 20, maxPerOrder: 5 }],
    };
    await updateEvent(owner, eventId, rename);
    const fresh = await prisma.ticketType.findUniqueOrThrow({ where: { id: tt.id } });
    expect(fresh).toMatchObject({ name: "Standard+", quantity: 20, sold: 1 });
  });
});
