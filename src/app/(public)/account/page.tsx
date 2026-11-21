import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, History, Ticket } from "lucide-react";
import { cityName } from "@/lib/constants";
import { dateBadge, formatDate, formatPrice, formatTime } from "@/lib/format";
import { cn, pluralize } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { getUserBookings, type Booking } from "@/server/services/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

export const metadata: Metadata = { title: "My tickets", robots: { index: false } };

type Props = { searchParams: Promise<{ notice?: string }> };

export default async function AccountPage({ searchParams }: Props) {
  const user = await requireUser("/account");
  const { notice } = await searchParams;
  const { upcoming, past } = await getUserBookings(user.id);

  return (
    <div className="grid gap-12">
      {notice === "organizer-only" && (
        <p role="status" className="rounded-2xl bg-[#fff0cc] p-4 text-sm text-[#5c3700]">
          The organizer dashboard is available to organizer accounts only. Sign in with an organizer
          account or create one to sell tickets.
        </p>
      )}
      <section aria-labelledby="upcoming-title" className="grid gap-4">
        <h2 id="upcoming-title" className="text-2xl font-bold">
          Upcoming <span className="text-muted-foreground">({upcoming.length})</span>
        </h2>
        {upcoming.length ? (
          <ul className="grid gap-4 lg:grid-cols-2">
            {upcoming.map((b) => (
              <li key={b.id}>
                <BookingCard booking={b} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<Ticket />}
            title="No upcoming events"
            description="When you book tickets, they'll appear here with QR codes for entry."
            action={
              <Button asChild>
                <Link href="/events">Find something to do</Link>
              </Button>
            }
          />
        )}
      </section>

      <section aria-labelledby="past-title" className="grid gap-4">
        <h2 id="past-title" className="text-2xl font-bold">
          Past <span className="text-muted-foreground">({past.length})</span>
        </h2>
        {past.length ? (
          <ul className="grid gap-4 lg:grid-cols-2">
            {past.map((b) => (
              <li key={b.id}>
                <BookingCard booking={b} past />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<History />}
            title="No past events yet"
            description="Events you attended will be kept here."
          />
        )}
      </section>
    </div>
  );
}

function BookingCard({ booking, past }: { booking: Booking; past?: boolean }) {
  const badge = dateBadge(booking.event.startsAt);
  return (
    <article
      className={cn(
        "group relative grid grid-cols-[96px_1fr] overflow-hidden rounded-3xl bg-card ring-1 ring-border transition hover:ring-foreground sm:grid-cols-[140px_1fr]",
        past && "opacity-80",
      )}
    >
      <div className="relative">
        {booking.event.coverUrl && (
          <Image
            src={booking.event.coverUrl}
            alt=""
            fill
            sizes="140px"
            className={cn("object-cover", past && "grayscale")}
          />
        )}
        <div className="absolute top-3 left-3 grid w-12 place-items-center rounded-xl bg-white py-1.5 text-[#101010]">
          <span className="font-display text-xl leading-none font-bold">{badge.day}</span>
          <span className="text-[10px] font-bold tracking-widest">{badge.month}</span>
        </div>
      </div>
      <div className="grid gap-2 p-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant={past ? "muted" : "lime"}>
            {pluralize(booking.ticketCount, "ticket")}
          </Badge>
          {booking.usedCount > 0 && <Badge variant="muted">{booking.usedCount} checked in</Badge>}
        </div>
        <h3 className="text-xl leading-tight font-bold">
          <Link
            href={`/orders/${booking.number}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {booking.event.title}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">
          {formatDate(booking.event.startsAt)} · {formatTime(booking.event.startsAt)} ·{" "}
          {booking.event.venueName}, {cityName(booking.event.city)}
        </p>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="font-mono text-muted-foreground">
            {booking.number} · {formatPrice(booking.total)}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold">
            {past ? "View order" : "Show tickets"}{" "}
            <ArrowUpRight className="size-4 transition group-hover:rotate-45" aria-hidden />
          </span>
        </div>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl ring-ring ring-offset-2 group-has-[a:focus-visible]:ring-2"
      />
    </article>
  );
}
