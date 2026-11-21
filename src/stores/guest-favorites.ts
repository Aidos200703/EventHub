import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Favorites for signed-out visitors, persisted in localStorage.
 * This is the one piece of genuinely global client state: it is shared by every
 * heart button and the favorites page, and survives reloads without an account.
 * After sign-in the ids are merged into the user's server-side favorites.
 */
type GuestFavoritesState = {
  ids: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useGuestFavorites = create<GuestFavoritesState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [id, ...s.ids].slice(0, 100),
        })),
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
      clear: () => set({ ids: [] }),
    }),
    { name: "eventhub:guest-favorites", version: 1 },
  ),
);
