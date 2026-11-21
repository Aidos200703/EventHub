import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { requireUser } from "@/server/session";
import { initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AccountNav } from "@/components/account/account-nav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  return (
    <div className="container-page grid gap-8 py-10 md:py-14">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="grid size-16 place-items-center rounded-full bg-lime font-display text-2xl font-bold text-[#101010]"
          >
            {initials(user.name)}
          </span>
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              My account
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{user.name}</h1>
          </div>
        </div>
        {user.role === "ORGANIZER" && (
          <Button asChild variant="outline">
            <Link href="/organizer">
              <LayoutDashboard /> Organizer dashboard
            </Link>
          </Button>
        )}
      </header>
      <AccountNav />
      {children}
    </div>
  );
}
