import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/session";
import { FavoritesList } from "@/components/favorites/favorites-list";

export const metadata: Metadata = { title: "Favorites", robots: { index: false } };

export default async function FavoritesPage() {
  if (await getCurrentUser()) redirect("/account/favorites");
  return (
    <div className="container-page grid gap-8 py-10 md:py-14">
      <header className="grid gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">Favorites</h1>
        <p className="text-muted-foreground">
          Saved on this device.{" "}
          <Link
            href="/sign-in?next=/account/favorites"
            className="font-semibold text-foreground underline underline-offset-4"
          >
            Sign in
          </Link>{" "}
          to keep them in your account.
        </p>
      </header>
      <FavoritesList />
    </div>
  );
}
