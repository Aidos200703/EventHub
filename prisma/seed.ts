/**
 * Seeds demo data. Safe to re-run: it wipes all tables and recreates everything.
 *   npm run db:seed
 */
import { randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { calculateQuote } from "../src/lib/pricing";
import { kzLocalInputToUtc, utcToKzLocalInput } from "../src/lib/dates";
import { DEMO_VISITOR, EVENTS, EXTRA_VISITORS, ORGANIZERS } from "./seed-data";

try {
  process.loadEnvFile();
} catch {
  // .env is optional
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "eventhub-demo";

// Deterministic pseudo-random so demo data looks the same on every machine.
let seed = 42;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = <T>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]!;
const id = () => randomBytes(12).toString("hex");
const ORDER_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const usedNumbers = new Set<string>();
function orderNumber() {
  for (;;) {
    let n = "EH-";
    for (let i = 0; i < 6; i++) n += ORDER_ALPHABET[Math.floor(rand() * ORDER_ALPHABET.length)];
    if (!usedNumbers.has(n)) {
      usedNumbers.add(n);
      return n;
    }
  }
}

async function createUser(
  data: {
    email: string;
    name: string;
    role: "VISITOR" | "ORGANIZER";
    bio?: string;
    phone?: string;
    city?: string;
  },
  passwordHash: string,
) {
  const userId = id();
  await prisma.user.create({
    data: {
      id: userId,
      ...data,
      emailVerified: true,
      accounts: {
        create: { id: id(), accountId: userId, providerId: "credential", password: passwordHash },
      },
    },
  });
  return userId;
}

function eventDates(startInDays: number, startTime: string, durationHours: number) {
  const day = utcToKzLocalInput(new Date(Date.now() + startInDays * 86_400_000)).slice(0, 10);
  const startsAt = kzLocalInputToUtc(`${day}T${startTime}`);
  return { startsAt, endsAt: new Date(startsAt.getTime() + durationHours * 3_600_000) };
}

type CreatedEvent = {
  id: string;
  key: string;
  startsAt: Date;
  endsAt: Date;
  organizerId: string;
  types: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    presold: number;
    maxPerOrder: number;
  }[];
};

async function main() {
  console.log("Resetting data…");
  await prisma.$transaction([
    prisma.ticket.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.programItem.deleteMany(),
    prisma.ticketType.deleteMany(),
    prisma.event.deleteMany(),
    prisma.upload.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const hash = await hashPassword(DEMO_PASSWORD);

  console.log("Creating users…");
  const organizerIds = {} as Record<keyof typeof ORGANIZERS, string>;
  for (const key of Object.keys(ORGANIZERS) as (keyof typeof ORGANIZERS)[]) {
    const org = ORGANIZERS[key];
    organizerIds[key] = await createUser(
      { email: org.email, name: org.name, role: "ORGANIZER", bio: org.bio, city: "almaty" },
      hash,
    );
  }
  const visitorId = await createUser({ ...DEMO_VISITOR, role: "VISITOR" }, hash);
  const extraVisitors: { id: string; name: string; email: string }[] = [];
  for (const v of EXTRA_VISITORS)
    extraVisitors.push({ ...v, id: await createUser({ ...v, role: "VISITOR" }, hash) });

  console.log("Creating events…");
  const created: CreatedEvent[] = [];
  for (const e of EVENTS) {
    const { startsAt, endsAt } = eventDates(e.startInDays, e.startTime, e.durationHours);
    const event = await prisma.event.create({
      data: {
        slug: e.key,
        title: e.title,
        summary: e.summary,
        description: e.description,
        category: e.category,
        city: e.city,
        venueName: e.venueName,
        venueAddress: e.venueAddress,
        startsAt,
        endsAt,
        coverUrl: `/covers/${e.key}.webp`,
        status: e.draft ? "DRAFT" : "PUBLISHED",
        publishedAt: e.draft ? null : new Date(Date.now() - 40 * 86_400_000),
        featured: e.featured ?? false,
        minPrice: Math.min(...e.ticketTypes.map((t) => t.price)),
        organizerId: organizerIds[e.organizer],
        ticketTypes: {
          create: e.ticketTypes.map((t, i) => ({
            name: t.name,
            description: t.description,
            price: t.price,
            quantity: t.quantity,
            maxPerOrder: t.maxPerOrder ?? 10,
            position: i,
          })),
        },
        program: { create: e.program.map((p, i) => ({ ...p, position: i })) },
      },
      include: { ticketTypes: { orderBy: { position: "asc" } } },
    });
    created.push({
      id: event.id,
      key: e.key,
      startsAt,
      endsAt,
      organizerId: event.organizerId,
      types: event.ticketTypes.map((t, i) => ({ ...t, presold: e.ticketTypes[i]!.presold ?? 0 })),
    });
  }

  console.log("Generating orders…");
  const orders: {
    id: string;
    number: string;
    idempotencyKey: string;
    userId: string;
    eventId: string;
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
    subtotal: number;
    serviceFee: number;
    total: number;
    cardLast4: string;
    createdAt: Date;
    paidAt: Date;
  }[] = [];
  const items: {
    id: string;
    orderId: string;
    ticketTypeId: string;
    name: string;
    unitPrice: number;
    quantity: number;
  }[] = [];
  const tickets: {
    id: string;
    code: string;
    orderId: string;
    eventId: string;
    ticketTypeId: string;
    status: "VALID" | "USED";
    checkedInAt: Date | null;
    checkedInById: string | null;
    createdAt: Date;
  }[] = [];
  const soldByType = new Map<string, number>();

  function addOrder(opts: {
    userId: string;
    buyer: { name: string; email: string };
    event: CreatedEvent;
    selection: Record<string, number>;
    createdAt: Date;
    used?: boolean;
  }) {
    const { event, selection } = opts;
    const quote = calculateQuote(
      event.types.map((t) => ({
        id: t.id,
        name: t.name,
        price: t.price,
        available: t.quantity,
        maxPerOrder: t.maxPerOrder,
      })),
      selection,
    );
    const orderId = id();
    orders.push({
      id: orderId,
      number: orderNumber(),
      idempotencyKey: randomUUID(),
      userId: opts.userId,
      eventId: event.id,
      buyerName: opts.buyer.name,
      buyerEmail: opts.buyer.email,
      buyerPhone: `+7701${String(Math.floor(rand() * 1e7)).padStart(7, "0")}`,
      subtotal: quote.subtotal,
      serviceFee: quote.serviceFee,
      total: quote.total,
      cardLast4: "4242",
      createdAt: opts.createdAt,
      paidAt: opts.createdAt,
    });
    for (const line of quote.lines) {
      items.push({
        id: id(),
        orderId,
        ticketTypeId: line.ticketTypeId,
        name: line.name,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
      });
      soldByType.set(line.ticketTypeId, (soldByType.get(line.ticketTypeId) ?? 0) + line.quantity);
      for (let i = 0; i < line.quantity; i++) {
        const used = opts.used ?? false;
        tickets.push({
          id: id(),
          code: randomBytes(16).toString("base64url"),
          orderId,
          eventId: event.id,
          ticketTypeId: line.ticketTypeId,
          status: used ? "USED" : "VALID",
          checkedInAt: used ? event.startsAt : null,
          checkedInById: used ? event.organizerId : null,
          createdAt: opts.createdAt,
        });
      }
    }
  }

  const byKey = (key: string) => created.find((e) => e.key === key)!;
  const now = Date.now();

  // Demo visitor's own bookings: two upcoming, one past (checked in).
  const visitor = { name: DEMO_VISITOR.name, email: DEMO_VISITOR.email };
  const fest = byKey("steppe-echoes-festival");
  addOrder({
    userId: visitorId,
    buyer: visitor,
    event: fest,
    selection: { [fest.types[1]!.id]: 2 },
    createdAt: new Date(now - 3 * 86_400_000),
  });
  const hamlet = byKey("hamlet-a-new-reading");
  addOrder({
    userId: visitorId,
    buyer: visitor,
    event: hamlet,
    selection: { [hamlet.types[1]!.id]: 1 },
    createdAt: new Date(now - 6 * 86_400_000),
  });
  const indie = byKey("autumn-indie-showcase");
  addOrder({
    userId: visitorId,
    buyer: visitor,
    event: indie,
    selection: { [indie.types[0]!.id]: 2 },
    createdAt: new Date(now - 32 * 86_400_000),
    used: true,
  });

  // Background sales from other visitors, skewed towards the last two weeks.
  for (const event of created) {
    for (const type of event.types) {
      let remaining = type.presold - (soldByType.get(type.id) ?? 0);
      while (remaining > 0) {
        const qty = Math.min(remaining, 1 + Math.floor(rand() * Math.min(4, type.maxPerOrder)));
        const buyer = pick(extraVisitors);
        const latest = Math.min(now, event.startsAt.getTime() - 3_600_000);
        const ageDays = Math.pow(rand(), 1.6) * 30;
        const createdAt = new Date(latest - ageDays * 86_400_000 - rand() * 3_600_000);
        const isPast = event.endsAt.getTime() < now;
        addOrder({
          userId: buyer.id,
          buyer,
          event,
          selection: { [type.id]: qty },
          createdAt,
          used: isPast && rand() < 0.86,
        });
        remaining -= qty;
      }
    }
  }

  const chunk = <T>(arr: T[], size = 1000) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, (i + 1) * size),
    );
  for (const part of chunk(orders)) await prisma.order.createMany({ data: part });
  for (const part of chunk(items)) await prisma.orderItem.createMany({ data: part });
  for (const part of chunk(tickets)) await prisma.ticket.createMany({ data: part });
  for (const [typeId, sold] of soldByType)
    await prisma.ticketType.update({ where: { id: typeId }, data: { sold } });

  for (const key of [
    "neon-steppe-electronic-live",
    "swan-lake-astana-opera",
    "lines-of-the-steppe-exhibition",
  ]) {
    await prisma.favorite.create({ data: { userId: visitorId, eventId: byKey(key).id } });
  }

  console.log(`✓ ${created.length} events, ${orders.length} orders, ${tickets.length} tickets`);
  console.log(`\nDemo accounts (password: ${DEMO_PASSWORD})`);
  console.log(`  Visitor:   ${DEMO_VISITOR.email}`);
  console.log(`  Organizer: ${ORGANIZERS.steppe.email}`);
  console.log(`  Organizer: ${ORGANIZERS.stage.email} (second organizer, for access checks)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
