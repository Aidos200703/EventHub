import type { Metadata } from "next";
import { FavoritesList } from "@/components/favorites/favorites-list";

export const metadata: Metadata = { title: "Favorites", robots: { index: false } };

export default function AccountFavoritesPage() {
  return <FavoritesList />;
}
