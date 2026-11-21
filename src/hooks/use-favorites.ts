"use client";

import { useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useSessionUser } from "@/components/session-provider";
import { useGuestFavorites } from "@/stores/guest-favorites";

export const favoritesKey = ["favorites", "ids"] as const;

const subscribeNoop = () => () => {};
/** True after hydration — localStorage-backed state must not render on the server. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

/**
 * Unified favorites API: server-backed with optimistic updates (and rollback)
 * for signed-in users, localStorage (Zustand) for guests.
 */
export function useFavorites() {
  const user = useSessionUser();
  const qc = useQueryClient();
  const hydrated = useHydrated();
  const guestIds = useGuestFavorites((s) => s.ids);
  const guestToggle = useGuestFavorites((s) => s.toggle);

  const query = useQuery({
    queryKey: favoritesKey,
    queryFn: () => api<{ ids: string[] }>("/api/favorites").then((r) => r.ids),
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: ({ eventId, next }: { eventId: string; next: boolean }) =>
      api(`/api/favorites/${eventId}`, { method: next ? "PUT" : "DELETE" }),
    onMutate: async ({ eventId, next }) => {
      await qc.cancelQueries({ queryKey: favoritesKey });
      const previous = qc.getQueryData<string[]>(favoritesKey);
      qc.setQueryData<string[]>(favoritesKey, (old = []) =>
        next
          ? [eventId, ...old.filter((id) => id !== eventId)]
          : old.filter((id) => id !== eventId),
      );
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      qc.setQueryData(favoritesKey, ctx?.previous);
      toast.error("Couldn't update favorites", { description: err.message });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: favoritesKey }),
  });

  const ids: string[] = user ? (query.data ?? []) : hydrated ? guestIds : [];

  return {
    ids,
    isReady: user ? query.isSuccess : hydrated,
    isError: query.isError,
    isFavorite: (id: string) => ids.includes(id),
    toggle: (id: string) => {
      const next = !ids.includes(id);
      if (user) mutation.mutate({ eventId: id, next });
      else guestToggle(id);
      return next;
    },
  };
}
