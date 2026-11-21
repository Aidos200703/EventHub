"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarRange,
  ExternalLink,
  LayoutDashboard,
  Menu,
  Plus,
  ReceiptText,
  ScanLine,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/dialogs";
import { SignOutButton } from "@/components/account/sign-out-button";

const items = [
  { href: "/organizer", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/organizer/events", label: "Events", icon: CalendarRange },
  { href: "/organizer/orders", label: "Orders", icon: ReceiptText },
  { href: "/organizer/check-in", label: "Check-in", icon: ScanLine },
];

function NavLinks({ onNavigate }: { onNavigate?: boolean }) {
  const pathname = usePathname();
  return (
    <ul className="grid gap-1">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const link = (
          <Link
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground",
              active && "bg-secondary text-foreground shadow-[inset_3px_0_0_var(--lime)]",
            )}
          >
            <item.icon className="size-[18px]" aria-hidden /> {item.label}
          </Link>
        );
        return (
          <li key={item.href}>{onNavigate ? <SheetClose asChild>{link}</SheetClose> : link}</li>
        );
      })}
    </ul>
  );
}

function SidebarBody({
  user,
  inSheet,
}: {
  user: { name: string; email: string };
  inSheet?: boolean;
}) {
  return (
    <div className="flex h-full flex-col gap-8">
      <Logo href="/organizer" />
      <Button asChild variant="lime" className="w-full">
        <Link href="/organizer/events/new">
          <Plus /> New event
        </Link>
      </Button>
      <nav aria-label="Organizer">
        <NavLinks onNavigate={inSheet} />
      </nav>
      <div className="mt-auto grid gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="size-4" aria-hidden /> View public site
        </Link>
        <div className="flex items-center gap-3 border-t pt-4">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-full bg-lime font-display text-sm font-bold text-[#101010]"
          >
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <SignOutButton className="w-full" />
      </div>
    </div>
  );
}

export function OrganizerSidebar({ user }: { user: { name: string; email: string } }) {
  return (
    <aside className="surface-dark sticky top-0 hidden h-dvh w-64 shrink-0 border-r bg-background p-5 lg:block">
      <SidebarBody user={user} />
    </aside>
  );
}

export function OrganizerTopbar({ user }: { user: { name: string; email: string } }) {
  return (
    <div className="surface-dark sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4 lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open organizer menu">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="surface-dark bg-background">
          <SheetTitle className="sr-only">Organizer menu</SheetTitle>
          <SheetDescription className="sr-only">
            Navigation for the organizer dashboard
          </SheetDescription>
          <SidebarBody user={user} inSheet />
        </SheetContent>
      </Sheet>
      <Logo href="/organizer" className="text-lg" />
      <Button asChild variant="lime" size="sm" className="ml-auto">
        <Link href="/organizer/events/new">
          <Plus /> New
        </Link>
      </Button>
    </div>
  );
}
