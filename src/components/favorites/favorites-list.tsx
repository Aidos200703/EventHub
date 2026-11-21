"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Heart, RotateCcw } from "lucide-react";
import { api } from "@/lib/api-client";
import { useFavorites } from "@/hooks/use-favorites";
import type { EventCardDTO } from "@/server/services/events";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { EventCard, EventGridSkeleton } from "@/components/events/event-cards";

/**
 * Favorites grid shared by the guest page and the account page. Cards are filtered by
 * the live id list, so un-favoriting removes a card instantly (optimistic), and the
 * card query only refetches when an id is added.
 */
export function FavoritesList() {
  const { ids, isReady, isError } = useFavorites();
  const sortedKey = [...ids].sort().join(",");
  const cards = useQuery({
    queryKey: ["favorites", "cards", sortedKey],
    queryFn: () =>
      api<{ events: EventCardDTO[] }>(`/api/events/cards?ids=${sortedKey}`).then((r) => r.events),
    enabled: isReady && ids.length > 0,
    placeholderData: (prev) => prev,
  });

  if (!isReady && !isError) return <EventGridSkeleton count={3} />;
  if (isError || cards.isError) {
    return (
      <EmptyState
        tone="error"
        icon={<RotateCcw />}
        title="Couldn't load favorites"
        description="Check your connection and try again."
        action={<Button onClick={() => cards.refetch()}>Try again</Button>}
      />
    );
  }
  if (ids.length === 0) {
    return (
      <EmptyState
        icon={<Heart />}
        title="No favorites yet"
        description="Tap the heart on any event to save it here."
        action={
          <Button asChild>
            <Link href="/events">Explore events</Link>
          </Button>
        }
      />
    );
  }
  if (!cards.data) return <EventGridSkeleton count={Math.min(ids.length, 6)} />;

  const byId = new Map(cards.data.map((c) => [c.id, c]));
  const visible = ids.flatMap((id) => {
    const c = byId.get(id);
    return c ? [{ ...c, startsAt: new Date(c.startsAt) }] : [];
  });
  const upcoming = visible.filter((e) => !e.isPast);
  const past = visible.filter((e) => e.isPast);

  return (
    <div className="grid gap-12">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {upcoming.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
      {past.length > 0 && (
        <section className="grid gap-4" aria-labelledby="past-favs">
          <h2 id="past-favs" className="text-xl font-bold">
            Already happened
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {past.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
