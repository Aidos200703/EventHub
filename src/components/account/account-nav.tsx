"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/account", label: "My tickets" },
  { href: "/account/favorites", label: "Favorites" },
  { href: "/account/settings", label: "Settings" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
