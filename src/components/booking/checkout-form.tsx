"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreditCard, FlaskConical, Lock } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import {
  calculateQuote,
  describeIssue,
  validateSelection,
  type TicketSelection,
} from "@/lib/pricing";
import {
  checkoutFormSchema,
  TEST_CARDS,
  type CheckoutFormInput,
  type CheckoutFormValues,
} from "@/lib/validation/checkout";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { TicketList, type TicketTypeView } from "./ticket-list";
import { OrderSummary } from "./order-summary";

type Props = {
  eventId: string;
  types: TicketTypeView[];
  initialSelection: TicketSelection;
  defaults: { name: string; email: string; phone: string };
};

export function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function CheckoutForm({ eventId, types, initialSelection, defaults }: Props) {
  const router = useRouter();
  const [selection, setSelection] = useState<TicketSelection>(initialSelection);
  // One key per checkout page view: retries and double clicks reuse it, so the server creates one order.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [serverError, setServerError] = useState<string | null>(null);

  const quote = calculateQuote(types, selection);
  const selectionIssues = validateSelection(types, selection);

  const form = useForm<CheckoutFormInput, unknown, CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { buyer: defaults, payment: { cardNumber: "", expiry: "", cvc: "" } },
    mode: "onTouched",
  });
  const { register, handleSubmit, formState, setValue, setError } = form;
  const errors = formState.errors;

  const mutation = useMutation({
    mutationFn: (values: CheckoutFormValues) =>
      api<{ number: string; replayed: boolean }>("/api/orders", {
        method: "POST",
        json: { eventId, idempotencyKey, selection, ...values },
      }),
    onSuccess: (res) => {
      toast.success("Payment successful", { description: `Order ${res.number} is confirmed.` });
      router.replace(`/orders/${res.number}?new=1`);
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      setServerError(message);
      if (err instanceof ApiError && err.fields) {
        for (const [path, msgs] of Object.entries(err.fields)) {
          if (path.startsWith("buyer.") || path.startsWith("payment.")) {
            setError(path as Path<CheckoutFormInput>, { message: msgs[0] });
          }
        }
      }
      // Inventory changed under us: refresh availability numbers.
      if (err instanceof ApiError && err.status === 409) router.refresh();
      toast.error("Order not completed", { description: message });
    },
  });

  const busy = mutation.isPending || mutation.isSuccess;

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => {
        if (busy) return;
        setServerError(null);
        mutation.mutate(values);
      })}
      className="grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-14"
    >
      <div className="grid content-start gap-10">
        <section aria-labelledby="step-tickets" className="grid gap-4">
          <StepTitle id="step-tickets" n={1} title="Tickets" />
          <TicketList
            types={types}
            selection={selection}
            onChange={(id, qty) => setSelection((s) => ({ ...s, [id]: qty }))}
            disabled={busy}
          />
        </section>

        <section aria-labelledby="step-details" className="grid gap-4">
          <StepTitle id="step-details" n={2} title="Your details" />
          <p className="-mt-2 text-sm text-muted-foreground">
            {"We'll show these on your order. They are never encoded in the ticket QR code."}
          </p>
          <div className="grid gap-5 rounded-3xl border bg-card p-5 sm:grid-cols-2 md:p-6">
            <Field
              label="Full name"
              required
              error={errors.buyer?.name?.message}
              className="sm:col-span-2"
            >
              {(p) => <Input {...p} autoComplete="name" {...register("buyer.name")} />}
            </Field>
            <Field label="Email" required error={errors.buyer?.email?.message}>
              {(p) => (
                <Input {...p} type="email" autoComplete="email" {...register("buyer.email")} />
              )}
            </Field>
            <Field
              label="Phone"
              required
              error={errors.buyer?.phone?.message}
              hint="Kazakhstan number"
            >
              {(p) => (
                <Input
                  {...p}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+7 701 234 56 78"
                  {...register("buyer.phone")}
                />
              )}
            </Field>
          </div>
        </section>

        <section aria-labelledby="step-payment" className="grid gap-4">
          <StepTitle id="step-payment" n={3} title="Payment" />
          <div
            role="note"
            className="flex gap-3 rounded-2xl border-2 border-dashed border-[#9a5b00]/40 bg-[#fff0cc] p-4 text-[#5c3700]"
          >
            <FlaskConical className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div className="grid gap-1 text-sm">
              <p className="font-semibold">Test payment — no real money is charged.</p>
              <p>
                Use card <code className="font-mono font-semibold">{TEST_CARDS.success}</code>, any
                future expiry date and any CVC. Card{" "}
                <code className="font-mono">{TEST_CARDS.declined}</code> simulates a decline.
              </p>
              <button
                type="button"
                className="w-fit text-left font-semibold underline underline-offset-4"
                onClick={() => {
                  setValue("payment.cardNumber", TEST_CARDS.success, { shouldValidate: true });
                  setValue("payment.expiry", "12/30", { shouldValidate: true });
                  setValue("payment.cvc", "123", { shouldValidate: true });
                }}
              >
                Fill in the test card
              </button>
            </div>
          </div>
          <div className="grid gap-5 rounded-3xl border bg-card p-5 sm:grid-cols-[1fr_120px_100px] md:p-6">
            <Field label="Card number" required error={errors.payment?.cardNumber?.message}>
              {(p) => (
                <div className="relative">
                  <CreditCard
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    {...p}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="4242 4242 4242 4242"
                    className="pl-10 font-mono"
                    {...register("payment.cardNumber", {
                      onChange: (e) =>
                        setValue("payment.cardNumber", formatCardNumber(e.target.value)),
                    })}
                  />
                </div>
              )}
            </Field>
            <Field label="Expiry" required error={errors.payment?.expiry?.message}>
              {(p) => (
                <Input
                  {...p}
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  className="font-mono"
                  {...register("payment.expiry", {
                    onChange: (e) => setValue("payment.expiry", formatExpiry(e.target.value)),
                  })}
                />
              )}
            </Field>
            <Field label="CVC" required error={errors.payment?.cvc?.message}>
              {(p) => (
                <Input
                  {...p}
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  maxLength={3}
                  placeholder="123"
                  className="font-mono"
                  {...register("payment.cvc")}
                />
              )}
            </Field>
          </div>
        </section>
      </div>

      <aside className="lg:relative">
        <div className="grid gap-5 rounded-3xl border bg-background p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)] lg:sticky lg:top-24">
          <h2 className="text-2xl font-bold">Order summary</h2>
          {quote.ticketCount > 0 ? (
            <OrderSummary quote={quote} />
          ) : (
            <p className="text-sm text-muted-foreground">No tickets selected yet.</p>
          )}
          {selectionIssues.length > 0 && quote.ticketCount > 0 && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {describeIssue(selectionIssues[0]!)}
            </p>
          )}
          {serverError && (
            <p
              role="alert"
              className="rounded-xl bg-[#fde3df] p-3 text-sm font-medium text-[#9c2414]"
            >
              {serverError}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            variant="lime"
            loading={busy}
            disabled={selectionIssues.length > 0}
          >
            <Lock /> {busy ? "Processing…" : `Pay ${formatPrice(quote.total)}`}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Simulated payment. Your card is not charged.
          </p>
        </div>
      </aside>
    </form>
  );
}

function StepTitle({ id, n, title }: { id: string; n: number; title: string }) {
  return (
    <h2 id={id} className="flex items-center gap-3 text-2xl font-bold">
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-full bg-foreground font-sans text-sm text-background"
      >
        {n}
      </span>
      {title}
    </h2>
  );
}
