"use client";

import Image from "next/image";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarPlus, Eye, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { categoryByValue, cityName } from "@/lib/constants";
import { formatDate, formatPrice, formatTime } from "@/lib/format";
import type { OrganizerEventRow } from "@/server/services/organizer";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialogs";
import { EmptyState } from "@/components/ui/states";
import { eventsKey, statsKey, useOrganizerEvents } from "./overview";

type Status = OrganizerEventRow["status"];

function useEventMutations() {
  const qc = useQueryClient();

  // Optimistic status toggle with rollback on error.
  const status = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      api(`/api/organizer/events/${id}/status`, { method: "PATCH", json: { status } }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: eventsKey });
      const previous = qc.getQueryData<OrganizerEventRow[]>(eventsKey);
      qc.setQueryData<OrganizerEventRow[]>(eventsKey, (rows) =>
        rows?.map((r) => (r.id === id ? { ...r, status } : r)),
      );
      return { previous };
    },
    onError: (err, _v, ctx) => {
      qc.setQueryData(eventsKey, ctx?.previous);
      toast.error("Status not changed", { description: err.message });
    },
    onSuccess: (_d, { status }) =>
      toast.success(status === "PUBLISHED" ? "Event is live" : "Moved to drafts", {
        description:
          status === "PUBLISHED"
            ? "It now appears in the public catalog."
            : "It's hidden from the public catalog.",
      }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: eventsKey });
      qc.invalidateQueries({ queryKey: statsKey });
    },
  });

  // Optimistic removal with rollback on error.
  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/organizer/events/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: eventsKey });
      const previous = qc.getQueryData<OrganizerEventRow[]>(eventsKey);
      qc.setQueryData<OrganizerEventRow[]>(eventsKey, (rows) => rows?.filter((r) => r.id !== id));
      return { previous };
    },
    onError: (err, _v, ctx) => {
      qc.setQueryData(eventsKey, ctx?.previous);
      toast.error("Event not deleted", { description: err.message });
    },
    onSuccess: () => toast.success("Event deleted"),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: eventsKey });
      qc.invalidateQueries({ queryKey: statsKey });
    },
  });

  return { status, remove };
}

export function EventsTable({ initialEvents }: { initialEvents: OrganizerEventRow[] }) {
  const events = useOrganizerEvents(initialEvents);
  const { status, remove } = useEventMutations();

  if (events.isError) {
    return (
      <EmptyState
        tone="error"
        icon={<RotateCcw />}
        title="Couldn't load events"
        action={<Button onClick={() => events.refetch()}>Try again</Button>}
      />
    );
  }
  const rows = events.data ?? [];
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<CalendarPlus />}
        title="You haven't created any events yet"
        description="Create your first event, add ticket types and publish it when you're ready."
        action={
          <Button asChild variant="lime">
            <Link href="/organizer/events/new">Create an event</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="grid gap-3">
      {rows.map((e) => {
        const past = e.isPast;
        const pct = e.capacity ? Math.round((e.sold / e.capacity) * 100) : 0;
        return (
          <li
            key={e.id}
            className="grid gap-4 rounded-2xl border bg-card p-4 md:grid-cols-[120px_1fr_auto] md:items-center"
          >
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-graphite-3">
              {e.coverUrl && (
                <Image src={e.coverUrl} alt="" fill sizes="120px" className="object-cover" />
              )}
            </div>
            <div className="grid min-w-0 gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={e.status === "PUBLISHED" ? "success" : "muted"}>
                  {e.status === "PUBLISHED" ? "Published" : "Draft"}
                </Badge>
                {past && <Badge variant="outline">Ended</Badge>}
                <span className="text-xs text-muted-foreground">
                  {categoryByValue(e.category).label} · {cityName(e.city)}
                </span>
              </div>
              <h2 className="truncate text-lg font-bold">{e.title}</h2>
              <p className="text-sm text-muted-foreground">
                {formatDate(new Date(e.startsAt))} · {formatTime(new Date(e.startsAt))}
              </p>
              <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Sold</dt>
                  <dd className="font-semibold tabular-nums">
                    {e.sold.toLocaleString("en-US")}/{e.capacity.toLocaleString("en-US")} ({pct}%)
                  </dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Orders</dt>
                  <dd className="font-semibold tabular-nums">{e.orders}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Sales</dt>
                  <dd className="font-semibold tabular-nums">{formatPrice(e.revenue)}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Checked in</dt>
                  <dd className="font-semibold tabular-nums">{e.checkedIn}</dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <label
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold",
                  past && "opacity-50",
                )}
              >
                <input
                  type="checkbox"
                  role="switch"
                  className="peer sr-only"
                  checked={e.status === "PUBLISHED"}
                  disabled={past || (status.isPending && status.variables?.id === e.id)}
                  onChange={(ev) =>
                    status.mutate({ id: e.id, status: ev.target.checked ? "PUBLISHED" : "DRAFT" })
                  }
                  aria-label={`Published: ${e.title}`}
                />
                <span
                  aria-hidden
                  className="relative h-5 w-9 rounded-full bg-secondary transition peer-checked:bg-success peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4"
                />
                {e.status === "PUBLISHED" ? "Live" : "Draft"}
              </label>
              {e.status === "PUBLISHED" && (
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  aria-label={`View public page of ${e.title}`}
                >
                  <Link href={`/events/${e.slug}`} target="_blank">
                    <Eye />
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link href={`/organizer/events/${e.id}/edit`}>
                  <Pencil /> Edit
                </Link>
              </Button>
              <ConfirmDialog
                title={`Delete "${e.title}"?`}
                description={
                  e.orders > 0
                    ? "This event already has orders, so it can't be deleted. Move it to drafts to stop sales instead."
                    : "The event, its ticket types and programme will be permanently removed. This can't be undone."
                }
                confirmLabel="Delete event"
                onConfirm={() => remove.mutate(e.id)}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${e.title}`}
                    className="text-destructive hover:bg-[#fde3df]"
                  >
                    <Trash2 />
                  </Button>
                }
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
