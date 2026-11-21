"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/dialogs";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/components/session-provider";

const links = [
  {
    href: "/events",
    label: "All events",
    match: (q: URLSearchParams) => !q.get("category") && !q.get("date"),
  },
  {
    href: "/events?category=concert",
    label: "Concerts",
    match: (q: URLSearchParams) => q.get("category") === "concert",
  },
  {
    href: "/events?category=theatre",
    label: "Theatre",
    match: (q: URLSearchParams) => q.get("category") === "theatre",
  },
  {
    href: "/events?date=weekend",
    label: "This weekend",
    match: (q: URLSearchParams) => q.get("date") === "weekend",
  },
];

export function MainNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
      {links.map((l) => {
        const active = pathname === "/events" && l.match(new URLSearchParams(params.toString()));
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground",
              active && "bg-secondary text-foreground",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ user }: { user: SessionUser }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="gap-6">
        <div>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </div>
        <nav aria-label="Mobile" className="grid gap-1">
          {[
            { href: "/", label: "Home" },
            ...links,
            { href: user ? "/account/favorites" : "/favorites", label: "Favorites" },
          ].map((l) => (
            <SheetClose asChild key={l.href}>
              <Link
                href={l.href}
                className="rounded-xl px-3 py-3 font-display text-lg font-semibold hover:bg-secondary"
              >
                {l.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
        <div>
          <p className="mb-2 px-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Categories
          </p>
          <div className="flex flex-wrap gap-2 px-3">
            {CATEGORIES.map((c) => (
              <SheetClose asChild key={c.slug}>
                <Link
                  href={`/events?category=${c.slug}`}
                  className="rounded-full border px-3 py-1.5 text-sm hover:bg-secondary"
                >
                  {c.label}
                </Link>
              </SheetClose>
            ))}
          </div>
        </div>
        <div className="mt-auto grid gap-2">
          {user ? (
            <>
              <SheetClose asChild>
                <Button asChild variant="outline">
                  <Link href="/account">My tickets</Link>
                </Button>
              </SheetClose>
              {user.role === "ORGANIZER" && (
                <SheetClose asChild>
                  <Button asChild>
                    <Link href="/organizer">Organizer dashboard</Link>
                  </Button>
                </SheetClose>
              )}
            </>
          ) : (
            <>
              <SheetClose asChild>
                <Button asChild variant="outline">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button asChild>
                  <Link href="/sign-up">Create account</Link>
                </Button>
              </SheetClose>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
