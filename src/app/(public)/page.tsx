import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarDays, MapPin, Ticket } from "lucide-react";
import { CATEGORIES, CITIES } from "@/lib/constants";
import {
  getCategoryCounts,
  getFeaturedEvents,
  getPublicStats,
  getUpcomingEvents,
} from "@/server/services/events";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { EventCard, EventRow, PosterCard } from "@/components/events/event-cards";
import { HeroSearch } from "@/components/catalog/hero-search";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const [featured, counts, stats] = await Promise.all([
    getFeaturedEvents(4),
    getCategoryCounts(),
    getPublicStats(),
  ]);
  const upcoming = await getUpcomingEvents(
    6,
    featured.map((e) => e.id),
  );
  const [lead, ...restFeatured] = featured;

  return (
    <>
      {/* ───────── Hero ───────── */}
      <section
        className="surface-dark relative overflow-hidden bg-background"
        aria-labelledby="hero-title"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 -right-36 size-[260px] rounded-full border-[32px] md:-top-40 md:-right-40 md:size-[520px] md:border-[56px] border-lime/90 opacity-90"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-40 bottom-[-120px] size-64 rounded-full bg-lime/10"
        />
        <div className="container-page relative grid gap-10 pt-14 pb-16 md:pt-24 md:pb-24">
          <p className="inline-flex w-fit animate-rise items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            <span className="size-2 rounded-full bg-lime" aria-hidden /> {stats.events} live events
            · {stats.cities} cities
          </p>
          <h1
            id="hero-title"
            className="max-w-5xl animate-rise text-[clamp(2.75rem,8vw,7.5rem)] leading-[0.9] font-extrabold tracking-[-0.04em] [animation-delay:80ms]"
          >
            Go out. <span className="text-lime">Feel</span> something live.
          </h1>
          <p className="max-w-xl animate-rise text-lg text-muted-foreground [animation-delay:160ms] md:text-xl">
            Concerts, theatre, stand-up and festivals across Kazakhstan. Find a night out and get
            your ticket with a QR code in under a minute.
          </p>
          <div className="animate-rise [animation-delay:240ms]">
            <HeroSearch />
          </div>
          <ul
            className="flex animate-rise flex-wrap gap-2 [animation-delay:320ms]"
            aria-label="Popular cities"
          >
            {CITIES.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/events?city=${c.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition hover:border-lime hover:text-lime"
                >
                  <MapPin className="size-3.5" aria-hidden /> {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── Featured ───────── */}
      <section className="container-page py-16 md:py-24" aria-labelledby="featured-title">
        <SectionHeading
          id="featured-title"
          eyebrow="Editor's picks"
          title="Don't miss these"
          href="/events?sort=popular"
          linkLabel="See popular"
        />
        {lead ? (
          <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <PosterCard event={lead} size="lg" priority />
            <div className="grid gap-5">
              {restFeatured.slice(0, 2).map((e) => (
                <PosterCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<Ticket />}
            title="No featured events right now"
            description="Check back soon — new events are added every week."
          />
        )}
      </section>

      {/* ───────── Categories ───────── */}
      <section className="border-y bg-card" aria-labelledby="categories-title">
        <div className="container-page py-16 md:py-20">
          <SectionHeading
            id="categories-title"
            eyebrow="Browse"
            title="What are you in the mood for?"
          />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((c, i) => {
              const count = counts[c.value] ?? 0;
              return (
                <li
                  key={c.slug}
                  className={cn(i === 0 && "col-span-2 sm:col-span-1 lg:row-span-2")}
                >
                  <Link
                    href={`/events?category=${c.slug}`}
                    className={cn(
                      "group flex h-full min-h-32 flex-col justify-between gap-6 rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:border-foreground",
                      i === 0 ? "bg-lime text-[#101010] hover:border-[#101010]" : "bg-background",
                    )}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          "font-display font-bold tracking-tight",
                          i === 0 ? "text-3xl lg:text-4xl" : "text-xl",
                        )}
                      >
                        {c.label}
                      </span>
                      <ArrowUpRight
                        className="size-5 shrink-0 transition group-hover:rotate-45"
                        aria-hidden
                      />
                    </span>
                    <span className="flex items-end justify-between gap-2 text-sm">
                      <span className={cn(i === 0 ? "text-[#101010]/70" : "text-muted-foreground")}>
                        {c.tagline}
                      </span>
                      <span className="font-semibold tabular-nums">{count}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ───────── Upcoming ───────── */}
      <section className="container-page py-16 md:py-24" aria-labelledby="upcoming-title">
        <SectionHeading
          id="upcoming-title"
          eyebrow="Coming up"
          title="Soonest on the calendar"
          href="/events"
          linkLabel="Full calendar"
        />
        {upcoming.length ? (
          <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
            <div className="divide-y rounded-3xl border bg-background p-2">
              {upcoming.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </div>
            <aside className="surface-dark flex flex-col justify-between gap-8 rounded-3xl bg-background p-7">
              <div className="grid gap-3">
                <CalendarDays className="size-8 text-lime" aria-hidden />
                <h3 className="text-3xl leading-tight font-bold">Plans for the weekend?</h3>
                <p className="text-muted-foreground">
                  Everything happening this Saturday and Sunday, in one list.
                </p>
              </div>
              <Button asChild variant="lime" size="lg" className="w-fit">
                <Link href="/events?date=weekend">
                  This weekend <ArrowRight />
                </Link>
              </Button>
            </aside>
          </div>
        ) : (
          <EmptyState
            icon={<CalendarDays />}
            title="Nothing scheduled yet"
            description="New events are on the way."
          />
        )}
        {upcoming.length > 0 && (
          <div className="mt-16 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {upcoming.slice(0, 3).map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>

      {/* ───────── Organizer CTA ───────── */}
      <section className="container-page" aria-labelledby="org-title">
        <div className="relative overflow-hidden rounded-3xl bg-lime p-8 text-[#101010] md:p-14">
          <div
            aria-hidden
            className="absolute -right-16 -bottom-24 size-80 rounded-full border-[40px] border-[#101010]/10"
          />
          <div className="relative grid gap-6 md:max-w-2xl">
            <h2
              id="org-title"
              className="text-4xl leading-none font-extrabold tracking-tight md:text-6xl"
            >
              Running an event? Sell tickets here.
            </h2>
            <p className="text-lg text-[#101010]/75">
              Create an event page, set ticket types and limits, follow sales live and check guests
              in with your phone camera.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-[#101010] text-white hover:bg-[#101010]/85">
                <Link href="/sign-up?role=organizer">Become an organizer</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#101010]/30 hover:bg-[#101010]/5"
              >
                <Link href="/sign-in">Try the demo dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  id: string;
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
      <div className="grid gap-2">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {eyebrow}
        </p>
        <h2 id={id} className="text-3xl font-bold tracking-tight md:text-5xl">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-2 rounded-full text-sm font-semibold underline-offset-4 hover:underline"
        >
          {linkLabel}{" "}
          <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
        </Link>
      )}
    </div>
  );
}
