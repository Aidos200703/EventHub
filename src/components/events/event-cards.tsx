import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { EventCardData } from "@/server/services/events";
import { categoryByValue, cityName } from "@/lib/constants";
import { dateBadge, formatDate, formatPrice, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "./favorite-button";

type CardEvent = EventCardData & { isPast?: boolean };

export function CoverImage({
  src,
  alt,
  className,
  sizes,
  priority,
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "absolute inset-0 grid place-items-center bg-graphite-3 text-sm text-white/60",
          className,
        )}
        role="img"
        aria-label={alt || "No cover"}
      >
        No cover yet
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}

export function availabilityState(remaining: number, capacity: number) {
  if (capacity === 0 || remaining <= 0) return "sold-out" as const;
  if (remaining <= Math.max(10, capacity * 0.1)) return "few-left" as const;
  return "available" as const;
}

export function AvailabilityBadge({
  remaining,
  capacity,
  className,
}: {
  remaining: number;
  capacity: number;
  className?: string;
}) {
  const state = availabilityState(remaining, capacity);
  if (state === "sold-out")
    return (
      <Badge variant="destructive" className={className}>
        Sold out
      </Badge>
    );
  if (state === "few-left")
    return (
      <Badge variant="warning" className={className}>
        Only {remaining} left
      </Badge>
    );
  return null;
}

function PriceTag({ event }: { event: CardEvent }) {
  if (event.isPast) return <span className="text-muted-foreground">Event ended</span>;
  if (availabilityState(event.remaining, event.capacity) === "sold-out")
    return <span className="text-muted-foreground">Sold out</span>;
  return event.minPrice !== null ? (
    <span>
      <span className="font-normal text-muted-foreground">from </span>
      {formatPrice(event.minPrice)}
    </span>
  ) : null;
}

/** Catalog card: image on top, structured meta below. */
export function EventCard({ event, priority }: { event: CardEvent; priority?: boolean }) {
  const cat = categoryByValue(event.category);
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)]",
        event.isPast && "opacity-70",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <CoverImage
          src={event.coverUrl}
          alt=""
          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          className="transition duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <Badge variant="glass">{cat.label}</Badge>
          <FavoriteButton eventId={event.id} title={event.title} className="relative z-10" />
        </div>
        {!event.isPast && (
          <AvailabilityBadge
            remaining={event.remaining}
            capacity={event.capacity}
            className="absolute bottom-3 left-3"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
          <time dateTime={event.startsAt.toISOString()}>
            {formatDate(event.startsAt)} · {formatTime(event.startsAt)}
          </time>
        </p>
        <h3 className="font-display text-xl leading-tight font-semibold">
          <Link
            href={`/events/${event.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {event.title}
          </Link>
        </h3>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {event.venueName}, {cityName(event.city)}
          </span>
        </p>
        <div className="mt-auto flex items-center justify-between pt-2 text-[15px] font-semibold">
          <PriceTag event={event} />
          <span
            aria-hidden
            className="grid size-9 place-items-center rounded-full bg-secondary transition group-hover:rotate-45 group-hover:bg-lime"
          >
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
      {/* Visible focus ring for the stretched link */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl ring-ring ring-offset-2 group-has-[a:focus-visible]:ring-2"
      />
    </article>
  );
}

/** Large poster card with text over the image — featured events. */
export function PosterCard({
  event,
  size = "md",
  priority,
}: {
  event: EventCardData;
  size?: "lg" | "md";
  priority?: boolean;
}) {
  const cat = categoryByValue(event.category);
  const badge = dateBadge(event.startsAt);
  return (
    <article
      className={cn(
        "group relative isolate flex overflow-hidden rounded-3xl bg-graphite text-white",
        size === "lg" ? "min-h-[420px] md:min-h-[520px]" : "min-h-[300px]",
      )}
    >
      <CoverImage
        src={event.coverUrl}
        alt=""
        sizes={
          size === "lg" ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 30vw, 100vw"
        }
        priority={priority}
        className="-z-10 transition duration-700 group-hover:scale-[1.05]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
      />
      <div className="absolute top-4 left-4 grid w-14 place-items-center rounded-2xl bg-white py-2 text-center text-[#101010] shadow-lg">
        <span className="font-display text-2xl leading-none font-bold">{badge.day}</span>
        <span className="text-[11px] font-bold tracking-widest">{badge.month}</span>
      </div>
      <FavoriteButton
        eventId={event.id}
        title={event.title}
        className="absolute top-4 right-4 z-10"
      />
      <div className="mt-auto grid w-full gap-3 p-5 md:p-7">
        <div className="flex flex-wrap gap-2">
          <Badge variant="lime">{cat.label}</Badge>
          <Badge variant="glass">
            <MapPin aria-hidden /> {cityName(event.city)}
          </Badge>
          <AvailabilityBadge remaining={event.remaining} capacity={event.capacity} />
        </div>
        <h3
          className={cn(
            "font-display leading-[0.95] font-bold tracking-tight",
            size === "lg" ? "text-4xl md:text-6xl" : "text-2xl md:text-3xl",
          )}
        >
          <Link
            href={`/events/${event.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {event.title}
          </Link>
        </h3>
        {size === "lg" && <p className="max-w-xl text-white/80 md:text-lg">{event.summary}</p>}
        <p className="text-sm font-semibold text-white/90">
          {event.venueName}
          {event.minPrice !== null && ` · from ${formatPrice(event.minPrice)}`}
        </p>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl ring-lime ring-offset-2 group-has-[a:focus-visible]:ring-4"
      />
    </article>
  );
}

/** Timetable row: compact, scannable list of upcoming events. */
export function EventRow({ event }: { event: EventCardData }) {
  const badge = dateBadge(event.startsAt);
  const cat = categoryByValue(event.category);
  return (
    <article className="group relative grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl px-3 py-4 transition hover:bg-card sm:grid-cols-[auto_96px_1fr_auto] sm:gap-6 sm:px-4">
      <div className="w-12 text-center">
        <p className="font-display text-3xl leading-none font-bold">{badge.day}</p>
        <p className="text-[11px] font-bold tracking-widest text-muted-foreground">{badge.month}</p>
      </div>
      <div className="relative hidden aspect-[4/3] overflow-hidden rounded-xl sm:block">
        <CoverImage
          src={event.coverUrl}
          alt=""
          sizes="96px"
          className="transition duration-500 group-hover:scale-110"
        />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {cat.label} · {formatTime(event.startsAt)} · {cityName(event.city)}
        </p>
        <h3 className="mt-1 truncate font-display text-lg font-semibold sm:text-xl">
          <Link
            href={`/events/${event.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {event.title}
          </Link>
        </h3>
        <p className="truncate text-sm text-muted-foreground">{event.venueName}</p>
      </div>
      <div className="flex items-center gap-3">
        <p className="hidden text-right text-sm font-semibold md:block">
          <PriceTag event={event} />
        </p>
        <span
          aria-hidden
          className="grid size-10 place-items-center rounded-full border transition group-hover:border-transparent group-hover:bg-lime"
        >
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl ring-ring group-has-[a:focus-visible]:ring-2"
      />
    </article>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border" aria-hidden>
      <div className="aspect-[16/10] animate-pulse bg-foreground/[0.07]" />
      <div className="grid gap-3 p-5">
        <div className="h-3 w-1/3 animate-pulse rounded bg-foreground/[0.07]" />
        <div className="h-6 w-4/5 animate-pulse rounded bg-foreground/[0.07]" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-foreground/[0.07]" />
        <div className="mt-3 h-5 w-1/4 animate-pulse rounded bg-foreground/[0.07]" />
      </div>
    </div>
  );
}

export function EventGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-label="Loading events"
    >
      {Array.from({ length: count }, (_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
