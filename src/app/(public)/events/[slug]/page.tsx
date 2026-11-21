import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, UserRound } from "lucide-react";
import { categoryByValue, cityName } from "@/lib/constants";
import { formatLongDate, formatPrice, formatShortDay, formatTime } from "@/lib/format";
import { getEventBySlug, getRelatedEvents } from "@/server/services/events";
import { Badge } from "@/components/ui/badge";
import { CoverImage, EventCard } from "@/components/events/event-cards";
import { FavoriteButton } from "@/components/events/favorite-button";
import { TicketSelector } from "@/components/booking/ticket-selector";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEventBySlug((await params).slug);
  if (!event) return { title: "Event not found" };
  const title = `${event.title} — ${cityName(event.city)}, ${formatLongDate(event.startsAt)}`;
  return {
    title,
    description: event.summary,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      type: "website",
      title: event.title,
      description: event.summary,
      url: `/events/${event.slug}`,
      images: event.coverUrl
        ? [{ url: event.coverUrl, width: 1600, height: 1000, alt: event.title }]
        : undefined,
    },
    twitter: { card: "summary_large_image", title: event.title, description: event.summary },
  };
}

export default async function EventPage({ params }: Props) {
  const event = await getEventBySlug((await params).slug);
  if (!event) notFound();

  const related = await getRelatedEvents(event);
  const cat = categoryByValue(event.category);
  const salesOpen = event.startsAt > new Date();
  const types = event.ticketTypes.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    price: t.price,
    available: t.quantity - t.sold,
    maxPerOrder: t.maxPerOrder,
  }));
  const minPrice = Math.min(...types.map((t) => t.price));
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Structured data for search engines (schema.org/Event)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary,
    startDate: event.startsAt.toISOString(),
    endDate: event.endsAt.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: event.coverUrl ? [`${baseUrl}${event.coverUrl}`] : undefined,
    location: {
      "@type": "Place",
      name: event.venueName,
      address: `${event.venueAddress}, ${cityName(event.city)}, Kazakhstan`,
    },
    organizer: { "@type": "Organization", name: event.organizer.name },
    offers: types.map((t) => ({
      "@type": "Offer",
      name: t.name,
      price: t.price,
      priceCurrency: "KZT",
      availability: t.available > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      url: `${baseUrl}/events/${event.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Cover */}
      <section className="surface-dark relative isolate overflow-hidden bg-background">
        <div className="absolute inset-0 -z-10">
          <CoverImage src={event.coverUrl} alt="" sizes="100vw" priority className="opacity-90" />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-[#17181a] via-[#17181a]/50 to-transparent"
          />
        </div>
        <div className="container-page grid min-h-[440px] content-end gap-5 pt-32 pb-10 md:min-h-[560px] md:pb-14">
          <nav aria-label="Breadcrumb" className="text-sm text-white/70">
            <ol className="flex flex-wrap gap-2">
              <li>
                <Link href="/events" className="hover:text-white hover:underline">
                  Events
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={`/events?category=${cat.slug}`}
                  className="hover:text-white hover:underline"
                >
                  {cat.label}
                </Link>
              </li>
            </ol>
          </nav>
          <div className="flex flex-wrap gap-2">
            <Badge variant="lime">{cat.label}</Badge>
            <Badge variant="glass">
              <MapPin aria-hidden /> {cityName(event.city)}
            </Badge>
          </div>
          <h1 className="max-w-4xl text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.92] font-extrabold tracking-[-0.03em] text-white">
            {event.title}
          </h1>
          <p className="max-w-2xl text-lg text-white/80">{event.summary}</p>
          <div className="flex flex-wrap items-center gap-3">
            <FavoriteButton eventId={event.id} title={event.title} withLabel />
            <span className="text-sm text-white/70">From {formatPrice(minPrice)}</span>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_420px] lg:gap-16">
        <div className="grid content-start gap-12">
          {/* Key facts */}
          <dl className="grid gap-px overflow-hidden rounded-3xl border bg-border sm:grid-cols-3">
            <Fact icon={<CalendarDays />} label="Date" value={formatLongDate(event.startsAt)} />
            <Fact
              icon={<Clock />}
              label="Time"
              value={
                formatShortDay(event.startsAt) === formatShortDay(event.endsAt)
                  ? `${formatTime(event.startsAt)} – ${formatTime(event.endsAt)}`
                  : `${formatTime(event.startsAt)} – ${formatShortDay(event.endsAt)}, ${formatTime(event.endsAt)}`
              }
            />
            <Fact icon={<MapPin />} label="Venue" value={event.venueName} />
          </dl>

          <section aria-labelledby="about-title" className="grid gap-4">
            <h2 id="about-title" className="text-3xl font-bold tracking-tight">
              About the event
            </h2>
            <div className="grid max-w-prose gap-4 text-lg leading-relaxed text-foreground/85">
              {event.description.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          {event.program.length > 0 && (
            <section aria-labelledby="program-title" className="grid gap-4">
              <h2 id="program-title" className="text-3xl font-bold tracking-tight">
                Programme
              </h2>
              <ol className="relative grid gap-0 border-l-2 border-foreground/15 pl-6">
                {event.program.map((p) => (
                  <li key={p.id} className="relative pb-6 last:pb-0">
                    <span
                      aria-hidden
                      className="absolute top-1.5 -left-[33px] size-4 rounded-full border-4 border-background bg-lime ring-2 ring-foreground/15"
                    />
                    <p className="font-mono text-sm font-semibold text-muted-foreground">
                      {p.time}
                    </p>
                    <p className="font-display text-lg font-semibold">{p.title}</p>
                    {p.description && (
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section aria-labelledby="venue-title" className="grid gap-4">
            <h2 id="venue-title" className="text-3xl font-bold tracking-tight">
              Venue
            </h2>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border bg-card p-6">
              <div>
                <p className="font-display text-xl font-semibold">{event.venueName}</p>
                <p className="text-muted-foreground">
                  {event.venueAddress}, {cityName(event.city)}
                </p>
              </div>
              <a
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-secondary"
                href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(`${event.venueAddress}, ${cityName(event.city)}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin className="size-4" aria-hidden /> Open map{" "}
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          </section>

          <section aria-labelledby="org-title" className="grid gap-4">
            <h2 id="org-title" className="text-3xl font-bold tracking-tight">
              Organizer
            </h2>
            <div className="flex items-start gap-4 rounded-3xl border bg-card p-6">
              <span
                className="grid size-12 shrink-0 place-items-center rounded-full bg-foreground text-background"
                aria-hidden
              >
                <UserRound className="size-5" />
              </span>
              <div className="grid gap-1">
                <p className="font-display text-lg font-semibold">{event.organizer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {event.organizer._count.events} published events on EventHub
                </p>
                {event.organizer.bio && <p className="mt-2 text-sm">{event.organizer.bio}</p>}
              </div>
            </div>
          </section>
        </div>

        {/* Tickets */}
        <aside aria-labelledby="tickets-title" className="lg:relative">
          <div className="grid gap-5 rounded-3xl border bg-background p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)] md:p-6 lg:sticky lg:top-24">
            <h2 id="tickets-title" className="text-2xl font-bold">
              Tickets
            </h2>
            <TicketSelector slug={event.slug} types={types} salesOpen={salesOpen} />
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="container-page grid gap-8 pb-8" aria-labelledby="related-title">
          <h2 id="related-title" className="text-3xl font-bold tracking-tight">
            You might also like
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3 bg-card p-5">
      <span className="mt-0.5 text-muted-foreground [&_svg]:size-5" aria-hidden>
        {icon}
      </span>
      <div>
        <dt className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {label}
        </dt>
        <dd className="mt-1 font-semibold">{value}</dd>
      </div>
    </div>
  );
}
