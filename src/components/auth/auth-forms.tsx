"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Building2, Ticket, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { safeRedirect } from "@/lib/safe-redirect";
import {
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validation/account";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

function useAfterAuth(next: string | undefined) {
  const router = useRouter();
  return (role?: string) => {
    const fallback = role === "ORGANIZER" ? "/organizer" : "/account";
    router.push(safeRedirect(next, fallback));
    router.refresh();
  };
}

export type DemoAccount = {
  label: string;
  description: string;
  email: string;
  password: string;
  role: "VISITOR" | "ORGANIZER";
};

export function SignInForm({ next, demoAccounts }: { next?: string; demoAccounts: DemoAccount[] }) {
  const afterAuth = useAfterAuth(next);
  const [error, setError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function signIn(email: string, password: string) {
    setError(null);
    const { data, error } = await authClient.signIn.email({ email, password });
    if (error || !data) {
      setError(
        error?.status === 401
          ? "Wrong email or password."
          : (error?.message ?? "Could not sign in. Please try again."),
      );
      return;
    }
    toast.success(`Welcome back, ${data.user.name.split(" ")[0]}!`);
    afterAuth((data.user as { role?: string }).role);
  }

  return (
    <div className="grid gap-8">
      {demoAccounts.length > 0 && (
        <section aria-labelledby="demo-title" className="grid gap-3">
          <h2
            id="demo-title"
            className="font-sans text-xs font-semibold tracking-widest text-muted-foreground uppercase"
          >
            Try a demo account
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {demoAccounts.map((d) => (
              <button
                key={d.email}
                type="button"
                disabled={demoLoading !== null}
                onClick={async () => {
                  setDemoLoading(d.email);
                  await signIn(d.email, d.password);
                  setDemoLoading(null);
                }}
                className="group grid gap-1 rounded-2xl border bg-card p-4 text-left transition hover:border-foreground disabled:opacity-60"
              >
                <span className="flex items-center gap-2 font-semibold">
                  {d.role === "ORGANIZER" ? (
                    <Building2 className="size-4" aria-hidden />
                  ) : (
                    <UserRound className="size-4" aria-hidden />
                  )}
                  {demoLoading === d.email ? "Signing in…" : d.label}
                </span>
                <span className="text-xs text-muted-foreground">{d.description}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Demo data is shared and reset by the seed script. Payments are simulated.
          </p>
        </section>
      )}

      <form
        noValidate
        onSubmit={form.handleSubmit((v) => signIn(v.email, v.password))}
        className="grid gap-5"
      >
        <Field label="Email" required error={errors.email?.message}>
          {(p) => <Input {...p} type="email" autoComplete="email" {...form.register("email")} />}
        </Field>
        <Field label="Password" required error={errors.password?.message}>
          {(p) => (
            <Input
              {...p}
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
            />
          )}
        </Field>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-[#fde3df] p-3 text-sm font-medium text-[#9c2414]"
          >
            {error}
          </p>
        )}
        <Button type="submit" size="lg" loading={isSubmitting}>
          Sign in
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New to EventHub?{" "}
          <Link
            href={`/sign-up${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-semibold text-foreground underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}

export function SignUpForm({
  next,
  initialRole,
}: {
  next?: string;
  initialRole: "VISITOR" | "ORGANIZER";
}) {
  const afterAuth = useAfterAuth(next);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", role: initialRole },
  });
  const { errors, isSubmitting } = form.formState;
  const role = useWatch({ control: form.control, name: "role" });

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (v) => {
        setError(null);
        const { data, error } = await authClient.signUp.email({
          name: v.name,
          email: v.email,
          password: v.password,
          role: v.role,
        });
        if (error || !data) {
          setError(
            error?.code === "USER_ALREADY_EXISTS"
              ? "An account with this email already exists."
              : (error?.message ?? "Could not create the account."),
          );
          return;
        }
        toast.success("Account created");
        afterAuth(v.role);
      })}
      className="grid gap-5"
    >
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">I want to</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              {
                value: "VISITOR",
                title: "Buy tickets",
                text: "Book events and keep tickets in one place",
                icon: Ticket,
              },
              {
                value: "ORGANIZER",
                title: "Sell tickets",
                text: "Publish events and manage sales",
                icon: Building2,
              },
            ] as const
          ).map((o) => (
            <label
              key={o.value}
              className={cn(
                "grid cursor-pointer gap-1 rounded-2xl border bg-card p-4 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                role === o.value && "border-foreground shadow-[inset_0_0_0_1px_var(--foreground)]",
              )}
            >
              <input type="radio" value={o.value} className="sr-only" {...form.register("role")} />
              <span className="flex items-center gap-2 font-semibold">
                <o.icon className="size-4" aria-hidden /> {o.title}
              </span>
              <span className="text-xs text-muted-foreground">{o.text}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field
        label={role === "ORGANIZER" ? "Organizer or company name" : "Full name"}
        required
        error={errors.name?.message}
      >
        {(p) => <Input {...p} autoComplete="name" {...form.register("name")} />}
      </Field>
      <Field label="Email" required error={errors.email?.message}>
        {(p) => <Input {...p} type="email" autoComplete="email" {...form.register("email")} />}
      </Field>
      <Field
        label="Password"
        required
        error={errors.password?.message}
        hint="At least 8 characters"
      >
        {(p) => (
          <Input
            {...p}
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
        )}
      </Field>
      {error && (
        <p role="alert" className="rounded-xl bg-[#fde3df] p-3 text-sm font-medium text-[#9c2414]">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" loading={isSubmitting}>
        Create account
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-semibold text-foreground underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
