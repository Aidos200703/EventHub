"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CalendarPlus, RotateCcw } from "lucide-react";
import { api } from "@/lib/api-client";
import { formatDate, formatPrice } from "@/lib/format";
import type { OrganizerEventRow, OrganizerStats } from "@/server/services/organizer";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

export const statsKey = ["organizer", "stats"] as const;
export const eventsKey = ["organizer", "events"] as const;

export function useOrganizerStats(initialData?: OrganizerStats) {
  return useQuery({
    queryKey: statsKey,
    queryFn: () => api<OrganizerStats>("/api/organizer/stats"),
    initialData,
    refetchInterval: 30_000, // near-live sales numbers
  });
}

export function useOrganizerEvents(initialData?: OrganizerEventRow[]) {
  return useQuery({
    queryKey: eventsKey,
    queryFn: () =>
      api<{ events: OrganizerEventRow[] }>("/api/organizer/events").then((r) => r.events),
    initialData,
  });
}

export function Overview({
  stats: initialStats,
  events: initialEvents,
}: {
  stats: OrganizerStats;
  events: OrganizerEventRow[];
}) {
  const stats = useOrganizerStats(initialStats);
  const events = useOrganizerEvents(initialEvents);

  if (stats.isError) {
    return (
      <EmptyState
        tone="error"
        icon={<RotateCcw />}
        title="Couldn't load statistics"
        description={stats.error.message}
        action={<Button onClick={() => stats.refetch()}>Try again</Button>}
      />
    );
  }

  const s = stats.data!;
  const upcoming = (events.data ?? []).filter((e) => !e.isPast).slice(0, 5);

  return (
    <div className="grid gap-8">
      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Orders" value={s.orders.toLocaleString("en-US")} />
        <Stat label="Tickets sold" value={s.ticketsSold.toLocaleString("en-US")} />
        <Stat
          label="Test sales"
          value={formatPrice(s.revenue)}
          highlight
          hint="Ticket subtotal, excl. service fee"
        />
        <Stat
          label="Checked in"
          value={s.checkedIn.toLocaleString("en-US")}
          hint={`${s.published} published · ${s.drafts} drafts`}
        />
      </dl>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <SalesChart series={s.series} />
        <section
          className="grid content-start gap-4 rounded-2xl border bg-card p-5"
          aria-labelledby="next-title"
        >
          <div className="flex items-center justify-between">
            <h2 id="next-title" className="text-lg font-bold">
              Upcoming events
            </h2>
            <Link
              href="/organizer/events"
              className="text-sm font-semibold underline-offset-4 hover:underline"
            >
              All events
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState
              className="py-8"
              icon={<CalendarPlus />}
              title="No upcoming events"
              action={
                <Button asChild size="sm">
                  <Link href="/organizer/events/new">Create an event</Link>
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-3">
              {upcoming.map((e) => {
                const pct = e.capacity ? Math.round((e.sold / e.capacity) * 100) : 0;
                return (
                  <li key={e.id} className="grid gap-2 rounded-xl border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/organizer/events/${e.id}/edit`}
                          className="block truncate font-semibold hover:underline"
                        >
                          {e.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(new Date(e.startsAt))}
                        </p>
                      </div>
                      <Badge variant={e.status === "PUBLISHED" ? "success" : "muted"}>
                        {e.status === "PUBLISHED" ? "Live" : "Draft"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div
                        className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${e.title}: ${pct}% sold`}
                      >
                        <div
                          className="h-full rounded-full bg-foreground"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-24 text-right tabular-nums">
                        {e.sold.toLocaleString("en-US")}/{e.capacity.toLocaleString("en-US")}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-2 rounded-2xl border bg-card p-5",
        highlight && "border-transparent bg-lime text-[#101010]",
      )}
    >
      <dt
        className={cn(
          "text-xs font-semibold tracking-widest uppercase",
          highlight ? "text-[#101010]/70" : "text-muted-foreground",
        )}
      >
        {label}
      </dt>
      <dd className="font-display text-3xl font-bold tracking-tight tabular-nums md:text-4xl">
        {value}
      </dd>
      {hint && (
        <p className={cn("text-xs", highlight ? "text-[#101010]/70" : "text-muted-foreground")}>
          {hint}
        </p>
      )}
    </div>
  );
}

function SalesChart({ series }: { series: OrganizerStats["series"] }) {
  const max = Math.max(1, ...series.map((d) => d.revenue));
  const total = series.reduce((s, d) => s + d.revenue, 0);
  const label = (day: string) =>
    new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  return (
    <section
      className="grid content-start gap-4 rounded-2xl border bg-card p-5"
      aria-labelledby="chart-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="chart-title" className="text-lg font-bold">
            Sales, last 14 days
          </h2>
          <p className="text-sm text-muted-foreground">Test revenue per day, Kazakhstan time</p>
        </div>
        <p className="font-display text-2xl font-bold tabular-nums">{formatPrice(total)}</p>
      </div>
      <div className="flex h-48 items-end gap-1.5" aria-hidden>
        {series.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
            <div
              className="min-h-[3px] rounded-t-md bg-foreground/85 transition group-hover:bg-lime"
              style={{ height: `${(d.revenue / max) * 100}%` }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background group-hover:block">
              {label(d.day)}: {formatPrice(d.revenue)} · {d.orders} orders
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground" aria-hidden>
        <span>{label(series[0]!.day)}</span>
        <span>Today</span>
      </div>
      <table className="sr-only">
        <caption>Daily test sales for the last 14 days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Orders</th>
            <th scope="col">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {series.map((d) => (
            <tr key={d.day}>
              <td>{label(d.day)}</td>
              <td>{d.orders}</td>
              <td>{formatPrice(d.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function OverviewHeaderAction() {
  return (
    <Button asChild variant="outline">
      <Link href="/organizer/orders">
        All orders <ArrowUpRight />
      </Link>
    </Button>
  );
}
