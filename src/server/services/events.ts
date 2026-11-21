import "server-only";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { CATALOG_PAGE_SIZE, categoryBySlug } from "@/lib/constants";
import { kzDateToUtc, presetRange } from "@/lib/dates";
import type { CatalogSearch } from "@/lib/validation/catalog";
import { prisma } from "../db";

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  category: true,
  city: true,
  venueName: true,
  startsAt: true,
  coverUrl: true,
  minPrice: true,
  ticketTypes: { select: { quantity: true, sold: true } },
} satisfies Prisma.EventSelect;

type CardRow = Prisma.EventGetPayload<{ select: typeof cardSelect }>;

export type EventCardData = Omit<CardRow, "ticketTypes"> & { remaining: number; capacity: number };

function toCard({ ticketTypes, ...row }: CardRow): EventCardData {
  const capacity = ticketTypes.reduce((s, t) => s + t.quantity, 0);
  const remaining = ticketTypes.reduce((s, t) => s + (t.quantity - t.sold), 0);
  return { ...row, capacity, remaining };
}

/** Events visible to the public: published and not finished yet. */
function publicWhere(now = new Date()): Prisma.EventWhereInput {
  return { status: "PUBLISHED", endsAt: { gte: now } };
}

export function buildCatalogWhere(search: CatalogSearch, now = new Date()): Prisma.EventWhereInput {
  const and: Prisma.EventWhereInput[] = [publicWhere(now)];

  if (search.q) {
    const q = search.q;
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
        { venueName: { contains: q, mode: "insensitive" } },
        { organizer: { name: { contains: q, mode: "insensitive" } } },
      ],
    });
  }
  if (search.city) and.push({ city: search.city });
  if (search.category) {
    const cat = categoryBySlug(search.category);
    if (cat) and.push({ category: cat.value });
  }
  if (search.date) {
    const { from, to } = presetRange(search.date, now);
    and.push({ startsAt: { lt: to }, endsAt: { gte: from } });
  } else if (search.from || search.to) {
    const range: Prisma.DateTimeFilter = {};
    if (search.from) range.gte = kzDateToUtc(search.from);
    if (search.to) range.lt = new Date(kzDateToUtc(search.to).getTime() + 86_400_000);
    and.push({ startsAt: range });
  }
  if (search.minPrice !== undefined || search.maxPrice !== undefined) {
    and.push({
      minPrice: {
        gte: search.minPrice ?? 0,
        ...(search.maxPrice !== undefined && { lte: search.maxPrice }),
      },
    });
  }
  return { AND: and };
}

function catalogOrderBy(sort: CatalogSearch["sort"]): Prisma.EventOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ minPrice: { sort: "asc", nulls: "last" } }, { startsAt: "asc" }];
    case "price-desc":
      return [{ minPrice: { sort: "desc", nulls: "last" } }, { startsAt: "asc" }];
    case "popular":
      return [{ tickets: { _count: "desc" } }, { startsAt: "asc" }];
    default:
      return [{ startsAt: "asc" }, { id: "asc" }];
  }
}

export async function searchEvents(search: CatalogSearch) {
  const where = buildCatalogWhere(search);
  const total = await prisma.event.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const page = Math.min(search.page, pageCount);
  const rows = await prisma.event.findMany({
    where,
    orderBy: catalogOrderBy(search.sort),
    skip: (page - 1) * CATALOG_PAGE_SIZE,
    take: CATALOG_PAGE_SIZE,
    select: cardSelect,
  });
  return { items: rows.map(toCard), total, page, pageCount };
}

export async function getFeaturedEvents(limit = 4) {
  const rows = await prisma.event.findMany({
    where: { ...publicWhere(), featured: true },
    orderBy: { startsAt: "asc" },
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

export async function getUpcomingEvents(limit = 6, excludeIds: string[] = []) {
  const rows = await prisma.event.findMany({
    where: { ...publicWhere(), startsAt: { gte: new Date() }, id: { notIn: excludeIds } },
    orderBy: { startsAt: "asc" },
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

export async function getCategoryCounts() {
  const rows = await prisma.event.groupBy({
    by: ["category"],
    where: publicWhere(),
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((r) => [r.category, r._count._all])) as Record<string, number>;
}

export async function getPublicStats() {
  const [events, cities, organizers] = await Promise.all([
    prisma.event.count({ where: publicWhere() }),
    prisma.event.findMany({ where: publicWhere(), distinct: ["city"], select: { city: true } }),
    prisma.event.findMany({
      where: publicWhere(),
      distinct: ["organizerId"],
      select: { organizerId: true },
    }),
  ]);
  return { events, cities: cities.length, organizers: organizers.length };
}

export const getEventBySlug = cache(async (slug: string) => {
  return prisma.event.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      ticketTypes: { orderBy: { position: "asc" } },
      program: { orderBy: { position: "asc" } },
      organizer: {
        select: {
          id: true,
          name: true,
          bio: true,
          _count: { select: { events: { where: { status: "PUBLISHED" } } } },
        },
      },
    },
  });
});

export type PublicEvent = NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>;

export async function getRelatedEvents(
  event: { id: string; category: PublicEvent["category"]; city: string },
  limit = 3,
) {
  const rows = await prisma.event.findMany({
    where: {
      ...publicWhere(),
      id: { not: event.id },
      OR: [{ category: event.category }, { city: event.city }],
    },
    orderBy: { startsAt: "asc" },
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

/** Card data for a list of ids (favorites). Keeps the requested order and flags past events. */
export async function getEventCardsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await prisma.event.findMany({
    where: { id: { in: ids.slice(0, 100) }, status: "PUBLISHED" },
    select: { ...cardSelect, endsAt: true },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const now = new Date();
  return ids.flatMap((id) => {
    const row = byId.get(id);
    if (!row) return [];
    const { endsAt, ...rest } = row;
    return [{ ...toCard(rest), isPast: endsAt < now }];
  });
}

export type FavoriteCard = Awaited<ReturnType<typeof getEventCardsByIds>>[number];

/** Serializable version of card data for client components (Dates → ISO strings). */
export type EventCardDTO = Omit<EventCardData, "startsAt"> & { startsAt: string; isPast?: boolean };
export function toCardDTO<T extends EventCardData & { isPast?: boolean }>(card: T): EventCardDTO {
  return { ...card, startsAt: card.startsAt.toISOString() };
}
