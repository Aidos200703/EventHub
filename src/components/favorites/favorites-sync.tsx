"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useSessionUser } from "@/components/session-provider";
import { useGuestFavorites } from "@/stores/guest-favorites";
import { favoritesKey } from "@/hooks/use-favorites";

/** After sign-in, moves favorites saved as a guest into the account (once). */
export function FavoritesSync() {
  const user = useSessionUser();
  const qc = useQueryClient();
  const ids = useGuestFavorites((s) => s.ids);
  const clear = useGuestFavorites((s) => s.clear);
  const syncing = useRef(false);

  useEffect(() => {
    if (!user || ids.length === 0 || syncing.current) return;
    syncing.current = true;
    api<{ ids: string[]; added: number }>("/api/favorites", { method: "POST", json: { ids } })
      .then((res) => {
        clear();
        qc.setQueryData(favoritesKey, res.ids);
        if (res.added > 0)
          toast.success(`Saved ${res.added} favorite${res.added === 1 ? "" : "s"} to your account`);
      })
      .catch(() => {
        // Keep guest favorites locally and retry on the next load.
      })
      .finally(() => {
        syncing.current = false;
      });
  }, [user, ids, clear, qc]);

  return null;
}
