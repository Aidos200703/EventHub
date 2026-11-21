"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ReceiptText, RotateCcw, Search } from "lucide-react";
import { api } from "@/lib/api-client";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { OrganizerOrdersPage } from "@/server/services/organizer";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/states";

type Filters = {
  q: string;
  eventId: string;
  attendance: "all" | "attended" | "not-attended";
  page: number;
};

export function OrdersTable({ events }: { events: { id: string; title: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // Filters live in the URL so a filtered view can be shared or reloaded.
  const filters: Filters = {
    q: params.get("q") ?? "",
    eventId: params.get("eventId") ?? "",
    attendance: (["attended", "not-attended"].includes(params.get("attendance") ?? "")
      ? params.get("attendance")
      : "all") as Filters["attendance"],
    page: Math.max(1, Number(params.get("page")) || 1),
  };
  const [q, setQ] = useState(filters.q);

  const setFilters = (patch: Partial<Filters>) => {
    const next = { ...filters, page: 1, ...patch };
    const sp = new URLSearchParams();
    if (next.q) sp.set("q", next.q);
    if (next.eventId) sp.set("eventId", next.eventId);
    if (next.attendance !== "all") sp.set("attendance", next.attendance);
    if (next.page > 1) sp.set("page", String(next.page));
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  useEffect(() => {
    if (q.trim() === filters.q) return;
    const t = setTimeout(() => setFilters({ q: q.trim() }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const apiQuery = new URLSearchParams({
    ...(filters.q && { q: filters.q }),
    ...(filters.eventId && { eventId: filters.eventId }),
    attendance: filters.attendance,
    page: String(filters.page),
    pageSize: "10",
  }).toString();

  const query = useQuery({
    queryKey: ["organizer", "orders", apiQuery],
    queryFn: () => api<OrganizerOrdersPage>(`/api/organizer/orders?${apiQuery}`),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="grid gap-1.5">
          <Label htmlFor="orders-q">Search</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="orders-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Order number, name or email"
              className="pl-10"
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="orders-event">Event</Label>
          <NativeSelect
            id="orders-event"
            value={filters.eventId}
            onChange={(e) => setFilters({ eventId: e.target.value })}
          >
            <option value="">All events</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="orders-att">Attendance</Label>
          <NativeSelect
            id="orders-att"
            value={filters.attendance}
            onChange={(e) => setFilters({ attendance: e.target.value as Filters["attendance"] })}
          >
            <option value="all">All orders</option>
            <option value="attended">Checked in</option>
            <option value="not-attended">Not checked in</option>
          </NativeSelect>
        </div>
      </div>

      {query.isError ? (
        <EmptyState
          tone="error"
          icon={<RotateCcw />}
          title="Couldn't load orders"
          description={query.error.message}
          action={<Button onClick={() => query.refetch()}>Try again</Button>}
        />
      ) : !query.data ? (
        <div className="grid gap-2" role="status" aria-label="Loading orders">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : query.data.items.length === 0 ? (
        <EmptyState
          icon={<ReceiptText />}
          title="No orders found"
          description="Try another search or clear the filters."
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {query.data.total.toLocaleString("en-US")} orders
          </p>
          <div
            className={cn(
              "overflow-x-auto rounded-2xl border bg-card transition-opacity",
              query.isPlaceholderData && "opacity-60",
            )}
            aria-busy={query.isFetching}
          >
            <table className="w-full min-w-[760px] text-sm">
              <caption className="sr-only">Orders for your events</caption>
              <thead>
                <tr className="border-b text-left text-xs tracking-widest text-muted-foreground uppercase">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Order
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Buyer
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Event
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Tickets
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Total
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Check-in
                  </th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((o) => (
                  <tr key={o.id} className="border-b last:border-b-0 hover:bg-secondary/50">
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold">{o.number}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(new Date(o.createdAt))}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{o.buyerName}</p>
                      <p className="text-xs text-muted-foreground">{o.buyerEmail}</p>
                    </td>
                    <td className="max-w-56 truncate px-4 py-3">{o.event.title}</td>
                    <td className="px-4 py-3">
                      {o.items.map((i) => `${i.quantity} × ${i.name}`).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatPrice(o.total)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          o.usedCount === o.ticketCount
                            ? "success"
                            : o.usedCount > 0
                              ? "warning"
                              : "muted"
                        }
                      >
                        {o.usedCount}/{o.ticketCount}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav aria-label="Orders pagination" className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() => setFilters({ page: filters.page - 1 })}
            >
              <ChevronLeft /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {query.data.page} of {query.data.pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page >= query.data.pageCount}
              onClick={() => setFilters({ page: filters.page + 1 })}
            >
              Next <ChevronRight />
            </Button>
          </nav>
        </>
      )}
    </div>
  );
}
