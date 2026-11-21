import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { kzLocalInputToUtc } from "@/lib/dates";
import { eventFormSchema, publishBlockers, type EventFormValues } from "@/lib/validation/event";
import { prisma } from "../db";
import { HttpError, notFound } from "../http";

export function slugify(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "event"}-${randomBytes(3).toString("hex")}`;
}

/**
 * Ownership guard. Every organizer query is scoped by organizerId; events owned by
 * someone else produce 404 (not 403) so organizers can't probe which ids exist.
 */
async function assertOwnership(organizerId: string, eventId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId },
    select: { id: true },
  });
  if (!event) throw notFound("Event");
}

export async function getOrganizerEvent(organizerId: string, eventId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId },
    include: {
      ticketTypes: { orderBy: { position: "asc" } },
      program: { orderBy: { position: "asc" } },
      _count: { select: { orders: true } },
    },
  });
  if (!event) throw notFound("Event");
  return event;
}

export async function listOrganizerEvents(organizerId: string) {
  const [events, revenue] = await Promise.all([
    prisma.event.findMany({
      where: { organizerId },
      orderBy: [{ startsAt: "asc" }],
      include: {
        ticketTypes: { select: { quantity: true, sold: true } },
        _count: { select: { orders: true, tickets: { where: { status: "USED" } } } },
      },
    }),
    prisma.order.groupBy({
      by: ["eventId"],
      where: { event: { organizerId }, status: "PAID" },
      _sum: { subtotal: true },
    }),
  ]);
  const revenueByEvent = new Map(revenue.map((r) => [r.eventId, r._sum.subtotal ?? 0]));
  const now = new Date();
  return events.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    status: e.status,
    city: e.city,
    category: e.category,
    coverUrl: e.coverUrl,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt.toISOString(),
    isPast: e.endsAt < now,
    capacity: e.ticketTypes.reduce((s, t) => s + t.quantity, 0),
    sold: e.ticketTypes.reduce((s, t) => s + t.sold, 0),
    checkedIn: e._count.tickets,
    orders: e._count.orders,
    revenue: revenueByEvent.get(e.id) ?? 0,
  }));
}

export type OrganizerEventRow = Awaited<ReturnType<typeof listOrganizerEvents>>[number];

function eventData(values: EventFormValues) {
  return {
    title: values.title,
    summary: values.summary,
    description: values.description,
    category: values.category,
    city: values.city,
    venueName: values.venueName,
    venueAddress: values.venueAddress,
    startsAt: kzLocalInputToUtc(values.startsAt),
    endsAt: kzLocalInputToUtc(values.endsAt),
    coverUrl: values.coverUrl,
    minPrice: Math.min(...values.ticketTypes.map((t) => t.price)),
  } satisfies Partial<Prisma.EventUncheckedCreateInput>;
}

/** Uploaded covers can only be attached by the organizer who uploaded them. */
async function assertCoverOwned(organizerId: string, coverUrl: string | null) {
  const match = coverUrl?.match(/^\/api\/uploads\/([a-z0-9]+)$/i);
  if (!match) return;
  const upload = await prisma.upload.findFirst({
    where: { id: match[1], ownerId: organizerId },
    select: { id: true },
  });
  if (!upload)
    throw new HttpError(
      422,
      "VALIDATION_FAILED",
      "Cover image not found. Please upload it again.",
      { coverUrl: ["Upload the cover again"] },
    );
}

export async function createEvent(organizerId: string, raw: unknown) {
  const values = eventFormSchema.parse(raw);
  await assertCoverOwned(organizerId, values.coverUrl);
  return prisma.event.create({
    data: {
      ...eventData(values),
      slug: slugify(values.title),
      organizerId,
      status: "DRAFT",
      ticketTypes: {
        create: values.ticketTypes.map((t, i) => ({
          name: t.name,
          description: t.description || null,
          price: t.price,
          quantity: t.quantity,
          maxPerOrder: t.maxPerOrder,
          position: i,
        })),
      },
      program: {
        create: values.program.map((p, i) => ({
          time: p.time,
          title: p.title,
          description: p.description || null,
          position: i,
        })),
      },
    },
    select: { id: true, slug: true },
  });
}

export async function updateEvent(organizerId: string, eventId: string, raw: unknown) {
  const values = eventFormSchema.parse(raw);
  await assertOwnership(organizerId, eventId);
  await assertCoverOwned(organizerId, values.coverUrl);

  return prisma.$transaction(async (tx) => {
    const current = await tx.ticketType.findMany({
      where: { eventId },
      select: { id: true, name: true, sold: true },
    });
    const currentIds = new Set(current.map((t) => t.id));
    const incomingIds = new Set(values.ticketTypes.flatMap((t) => (t.id ? [t.id] : [])));

    for (const id of incomingIds) {
      if (!currentIds.has(id))
        throw new HttpError(
          422,
          "VALIDATION_FAILED",
          "A ticket type does not belong to this event",
        );
    }

    const removed = current.filter((t) => !incomingIds.has(t.id));
    const blocked = removed.find((t) => t.sold > 0);
    if (blocked) {
      throw new HttpError(
        409,
        "TICKET_TYPE_HAS_SALES",
        `"${blocked.name}" already has ${blocked.sold} sold tickets and can't be removed. Set its quantity to ${blocked.sold} to stop sales.`,
      );
    }
    if (removed.length)
      await tx.ticketType.deleteMany({ where: { id: { in: removed.map((t) => t.id) }, sold: 0 } });

    for (const [position, t] of values.ticketTypes.entries()) {
      const data = {
        name: t.name,
        description: t.description || null,
        price: t.price,
        quantity: t.quantity,
        maxPerOrder: t.maxPerOrder,
        position,
      };
      if (t.id) {
        // Conditional update: capacity can never drop below what's already sold (race-safe).
        const res = await tx.ticketType.updateMany({
          where: { id: t.id, eventId, sold: { lte: t.quantity } },
          data,
        });
        if (res.count !== 1) {
          const sold = current.find((c) => c.id === t.id)?.sold ?? 0;
          throw new HttpError(
            409,
            "QUANTITY_BELOW_SOLD",
            `"${t.name}" quantity can't be lower than ${sold} (already sold).`,
            {
              [`ticketTypes.${position}.quantity`]: [`At least ${sold}`],
            },
          );
        }
      } else {
        await tx.ticketType.create({ data: { ...data, eventId } });
      }
    }

    await tx.programItem.deleteMany({ where: { eventId } });
    if (values.program.length) {
      await tx.programItem.createMany({
        data: values.program.map((p, i) => ({
          eventId,
          time: p.time,
          title: p.title,
          description: p.description || null,
          position: i,
        })),
      });
    }

    const event = await tx.event.update({
      where: { id: eventId },
      data: eventData(values),
      select: { id: true, slug: true, status: true },
    });
    if (event.status === "PUBLISHED" && !values.coverUrl) {
      throw new HttpError(422, "VALIDATION_FAILED", "Published events need a cover image", {
        coverUrl: ["Required for published events"],
      });
    }
    return event;
  });
}

export const statusSchema = z.object({ status: z.enum(["DRAFT", "PUBLISHED"]) });

export async function setEventStatus(organizerId: string, eventId: string, raw: unknown) {
  const { status } = statusSchema.parse(raw);
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId },
    select: {
      coverUrl: true,
      startsAt: true,
      publishedAt: true,
      _count: { select: { ticketTypes: true } },
    },
  });
  if (!event) throw notFound("Event");
  if (status === "PUBLISHED") {
    const blockers = publishBlockers({
      coverUrl: event.coverUrl,
      startsAt: event.startsAt,
      ticketTypeCount: event._count.ticketTypes,
    });
    if (blockers.length)
      throw new HttpError(
        422,
        "CANNOT_PUBLISH",
        `Can't publish yet: ${blockers.join(", ").toLowerCase()}.`,
      );
  }
  return prisma.event.update({
    where: { id: eventId },
    data: {
      status,
      publishedAt: status === "PUBLISHED" ? (event.publishedAt ?? new Date()) : event.publishedAt,
    },
    select: { id: true, status: true },
  });
}

export async function deleteEvent(organizerId: string, eventId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId },
    select: { _count: { select: { orders: true } } },
  });
  if (!event) throw notFound("Event");
  if (event._count.orders > 0) {
    throw new HttpError(
      409,
      "EVENT_HAS_ORDERS",
      "This event has orders and can't be deleted. Move it back to draft to stop sales.",
    );
  }
  await prisma.event.delete({ where: { id: eventId } });
}

// ───────────────────────────── Stats ─────────────────────────────

export async function getOrganizerStats(organizerId: string, days = 14) {
  const where: Prisma.OrderWhereInput = { event: { organizerId }, status: "PAID" };
  const [agg, tickets, checkedIn, events] = await Promise.all([
    prisma.order.aggregate({ where, _count: { _all: true }, _sum: { subtotal: true } }),
    prisma.ticket.count({ where: { event: { organizerId }, order: { status: "PAID" } } }),
    prisma.ticket.count({ where: { event: { organizerId }, status: "USED" } }),
    prisma.event.groupBy({ by: ["status"], where: { organizerId }, _count: { _all: true } }),
  ]);

  // Daily sales bucketed by Kazakhstan calendar day (UTC+5).
  const DAY = 86_400_000;
  const OFFSET = 5 * 3_600_000;
  const todayKz = Math.floor((Date.now() + OFFSET) / DAY) * DAY; // midnight KZ expressed as "local" ms
  const since = new Date(todayKz - (days - 1) * DAY - OFFSET);
  const recent = await prisma.order.findMany({
    where: { ...where, createdAt: { gte: since } },
    select: { createdAt: true, subtotal: true },
  });
  const buckets = new Map<string, { orders: number; revenue: number }>();
  for (const o of recent) {
    const day = new Date(o.createdAt.getTime() + OFFSET).toISOString().slice(0, 10);
    const b = buckets.get(day) ?? { orders: 0, revenue: 0 };
    b.orders += 1;
    b.revenue += o.subtotal;
    buckets.set(day, b);
  }
  const series = Array.from({ length: days }, (_, i) => {
    const day = new Date(todayKz - (days - 1 - i) * DAY).toISOString().slice(0, 10);
    return { day, ...(buckets.get(day) ?? { orders: 0, revenue: 0 }) };
  });

  return {
    orders: agg._count._all,
    revenue: agg._sum.subtotal ?? 0,
    ticketsSold: tickets,
    checkedIn,
    published: events.find((e) => e.status === "PUBLISHED")?._count._all ?? 0,
    drafts: events.find((e) => e.status === "DRAFT")?._count._all ?? 0,
    series,
  };
}

export type OrganizerStats = Awaited<ReturnType<typeof getOrganizerStats>>;

// ───────────────────────────── Orders ─────────────────────────────

export const ordersQuerySchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  eventId: z.string().max(40).optional().catch(undefined),
  attendance: z.enum(["all", "attended", "not-attended"]).catch("all").default("all"),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).catch(10).default(10),
});

export async function listOrganizerOrders(organizerId: string, raw: unknown) {
  const query = ordersQuerySchema.parse(raw);
  const and: Prisma.OrderWhereInput[] = [{ event: { organizerId } }];
  if (query.eventId) and.push({ eventId: query.eventId });
  if (query.q) {
    and.push({
      OR: [
        { number: { contains: query.q, mode: "insensitive" } },
        { buyerName: { contains: query.q, mode: "insensitive" } },
        { buyerEmail: { contains: query.q, mode: "insensitive" } },
      ],
    });
  }
  if (query.attendance === "attended") and.push({ tickets: { some: { status: "USED" } } });
  if (query.attendance === "not-attended") and.push({ tickets: { none: { status: "USED" } } });
  const where: Prisma.OrderWhereInput = { AND: and };

  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        event: { select: { id: true, title: true } },
        items: { select: { name: true, quantity: true } },
        tickets: { select: { status: true } },
      },
    }),
  ]);

  return {
    total,
    page: query.page,
    pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
    items: rows.map((o) => ({
      id: o.id,
      number: o.number,
      createdAt: o.createdAt.toISOString(),
      buyerName: o.buyerName,
      buyerEmail: o.buyerEmail,
      event: o.event,
      items: o.items,
      total: o.total,
      subtotal: o.subtotal,
      ticketCount: o.tickets.length,
      usedCount: o.tickets.filter((t) => t.status === "USED").length,
    })),
  };
}

export type OrganizerOrdersPage = Awaited<ReturnType<typeof listOrganizerOrders>>;

// ──────────────────────────── Check-in ────────────────────────────

/** Accepts a raw code or the check-in URL encoded in the QR. */
export function extractTicketCode(input: string): string | null {
  const trimmed = input.trim();
  let code = trimmed;
  try {
    const url = new URL(trimmed);
    code = url.searchParams.get("code") ?? "";
  } catch {
    // not a URL — treat as a raw code
  }
  return /^[A-Za-z0-9_-]{16,64}$/.test(code) ? code : null;
}

const checkInSchema = z.object({ code: z.string().min(1, "Enter a ticket code").max(500) });

async function findOwnedTicket(organizerId: string, raw: unknown) {
  const { code: input } = checkInSchema.parse(raw);
  const code = extractTicketCode(input);
  if (!code)
    throw new HttpError(422, "INVALID_CODE", "This doesn't look like an EventHub ticket code");
  const ticket = await prisma.ticket.findFirst({
    where: { code, event: { organizerId } },
    include: {
      event: { select: { id: true, title: true, startsAt: true, venueName: true } },
      ticketType: { select: { name: true } },
      order: { select: { number: true, buyerName: true } },
      checkedInBy: { select: { name: true } },
    },
  });
  // Same response for "doesn't exist" and "belongs to another organizer".
  if (!ticket)
    throw new HttpError(404, "TICKET_NOT_FOUND", "Ticket not found for any of your events");
  return ticket;
}

function ticketView(t: Awaited<ReturnType<typeof findOwnedTicket>>) {
  return {
    code: t.code,
    status: t.status,
    checkedInAt: t.checkedInAt?.toISOString() ?? null,
    checkedInBy: t.checkedInBy?.name ?? null,
    ticketType: t.ticketType.name,
    orderNumber: t.order.number,
    holder: t.order.buyerName,
    event: {
      id: t.event.id,
      title: t.event.title,
      startsAt: t.event.startsAt.toISOString(),
      venueName: t.event.venueName,
    },
  };
}

export type CheckInTicket = ReturnType<typeof ticketView>;

export async function lookupTicket(organizerId: string, raw: unknown) {
  return ticketView(await findOwnedTicket(organizerId, raw));
}

export async function checkInTicket(organizerId: string, raw: unknown) {
  const ticket = await findOwnedTicket(organizerId, raw);
  // Atomic: only one scanner can flip VALID → USED.
  const res = await prisma.ticket.updateMany({
    where: { id: ticket.id, status: "VALID" },
    data: { status: "USED", checkedInAt: new Date(), checkedInById: organizerId },
  });
  const fresh = ticketView(await findOwnedTicket(organizerId, raw));
  return { ticket: fresh, alreadyUsed: res.count === 0 };
}
