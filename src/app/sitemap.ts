import type { MetadataRoute } from "next";
import { prisma } from "@/server/db";
import { CATEGORIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED", endsAt: { gte: new Date() } },
    select: { slug: true, updatedAt: true },
  });
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/events`, changeFrequency: "hourly", priority: 0.9 },
    ...CATEGORIES.map((c) => ({
      url: `${base}/events?category=${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...events.map((e) => ({
      url: `${base}/events/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
