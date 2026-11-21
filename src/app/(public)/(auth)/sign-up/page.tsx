import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/session";
import { SignUpForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

type Props = { searchParams: Promise<{ next?: string; role?: string }> };

export default async function SignUpPage({ searchParams }: Props) {
  const { next, role } = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Create an account</h1>
        <p className="text-muted-foreground">
          Book tickets in a minute, or start selling your own events.
        </p>
      </header>
      <SignUpForm next={next} initialRole={role === "organizer" ? "ORGANIZER" : "VISITOR"} />
    </div>
  );
}
