"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, LayoutDashboard, LogOut, Settings, Ticket } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { initials } from "@/lib/utils";
import type { SessionUser } from "@/components/session-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function useSignOut() {
  const router = useRouter();
  const qc = useQueryClient();
  return async () => {
    await authClient.signOut();
    qc.clear();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  };
}

export function UserMenu({ user }: { user: NonNullable<SessionUser> }) {
  const signOut = useSignOut();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="ml-1 grid size-10 place-items-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground transition hover:ring-4 hover:ring-lime/60"
        aria-label={`Account menu for ${user.name}`}
      >
        {initials(user.name)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <span className="block font-semibold">{user.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === "ORGANIZER" && (
          <DropdownMenuItem asChild>
            <Link href="/organizer">
              <LayoutDashboard /> Organizer dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/account">
            <Ticket /> My tickets
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/favorites">
            <Heart /> Favorites
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/settings">
            <Settings /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
