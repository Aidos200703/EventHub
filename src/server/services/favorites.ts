import "server-only";
import { z } from "zod";
import { prisma } from "../db";
import { notFound } from "../http";

export async function listFavoriteIds(userId: string) {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { eventId: true },
  });
  return rows.map((r) => r.eventId);
}

export async function addFavorite(userId: string, eventId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!event) throw notFound("Event");
  // Idempotent: adding twice is fine.
  await prisma.favorite.upsert({
    where: { userId_eventId: { userId, eventId } },
    create: { userId, eventId },
    update: {},
  });
}

export async function removeFavorite(userId: string, eventId: string) {
  await prisma.favorite.deleteMany({ where: { userId, eventId } });
}

const mergeSchema = z.object({ ids: z.array(z.string().max(40)).max(100) });

/** Merges favorites saved as a guest into the account. Unknown/draft ids are ignored. */
export async function mergeFavorites(userId: string, raw: unknown) {
  const { ids } = mergeSchema.parse(raw);
  const valid = await prisma.event.findMany({
    where: { id: { in: ids }, status: "PUBLISHED" },
    select: { id: true },
  });
  const res = await prisma.favorite.createMany({
    data: valid.map((e) => ({ userId, eventId: e.id })),
    skipDuplicates: true,
  });
  return { added: res.count, ids: await listFavoriteIds(userId) };
}
