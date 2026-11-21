import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/session";
import { safeRedirect } from "@/lib/safe-redirect";
import { SignInForm, type DemoAccount } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(safeRedirect(next, user.role === "ORGANIZER" ? "/organizer" : "/account"));

  // Demo accounts are only exposed when demo mode is explicitly enabled.
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const password = process.env.DEMO_PASSWORD ?? "eventhub-demo";
  const demoAccounts: DemoAccount[] = demoMode
    ? [
        {
          label: "Visitor",
          description: "Has upcoming & past tickets and favorites",
          email: "visitor@eventhub.kz",
          password,
          role: "VISITOR",
        },
        {
          label: "Organizer",
          description: "Steppe Sound Agency — sales, orders, check-in",
          email: "organizer@eventhub.kz",
          password,
          role: "ORGANIZER",
        },
      ]
    : [];

  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Sign in</h1>
        <p className="text-muted-foreground">Access your tickets, favorites and organizer tools.</p>
      </header>
      <SignInForm next={next} demoAccounts={demoAccounts} />
    </div>
  );
}
