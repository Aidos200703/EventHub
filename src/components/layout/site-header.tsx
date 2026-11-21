import { Suspense } from "react";
import Link from "next/link";
import { Heart, Search } from "lucide-react";
import { getCurrentUser } from "@/server/session";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { MainNav, MobileNav } from "./nav";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center gap-2 sm:gap-4">
        <MobileNav user={user} />
        <Logo />
        <Suspense fallback={<div className="ml-6 hidden lg:block" />}>
          <MainNav />
        </Suspense>
        <div className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Link href="/events" aria-label="Search events">
              <Search />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon">
            <Link href={user ? "/account/favorites" : "/favorites"} aria-label="Favorites">
              <Heart />
            </Link>
          </Button>
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/sign-up">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
