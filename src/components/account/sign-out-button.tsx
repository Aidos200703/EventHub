"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSignOut } from "@/components/layout/user-menu";

export function SignOutButton({ className }: { className?: string }) {
  const signOut = useSignOut();
  return (
    <Button variant="outline" className={className ?? "w-fit"} onClick={signOut}>
      <LogOut /> Sign out
    </Button>
  );
}
