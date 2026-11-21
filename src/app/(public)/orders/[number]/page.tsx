import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus, CheckCircle2 } from "lucide-react";
import { formatDateTime, formatPrice } from "@/lib/format";
import { requireUser } from "@/server/session";
import { getOrderForUser } from "@/server/services/orders";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/tickets/ticket-card";
import { PrintButton } from "@/components/tickets/print-button";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

type Props = { params: Promise<{ number: string }>; searchParams: Promise<{ new?: string }> };

export default async function OrderPage({ params, searchParams }: Props) {
  const { number } = await params;
  const isNew = (await searchParams).new === "1";
  const user = await requireUser(`/orders/${number}`);
  // Scoped by userId: someone else's order number behaves exactly like a missing one.
  const order = await getOrderForUser(user.id, number);
  if (!order) notFound();

  return (
    <div className="container-page grid max-w-5xl gap-10 py-10 md:py-14">
      <Link
        href="/account"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground print:hidden"
      >
        <ArrowLeft className="size-4" aria-hidden /> My tickets
      </Link>

      {isNew ? (
        <section
          className="surface-dark relative overflow-hidden rounded-3xl bg-background p-8 md:p-12"
          aria-labelledby="success-title"
        >
          <div
            aria-hidden
            className="absolute -top-20 -right-20 size-72 rounded-full border-[36px] border-lime/80"
          />
          <div className="relative grid gap-4">
            <CheckCircle2 className="size-12 animate-rise text-lime" aria-hidden />
            <h1
              id="success-title"
              className="animate-rise text-4xl font-extrabold tracking-tight [animation-delay:80ms] md:text-6xl"
            >
              {"You're going!"}
            </h1>
            <p className="max-w-xl animate-rise text-lg text-muted-foreground [animation-delay:160ms]">
              Order <span className="font-mono font-semibold text-foreground">{order.number}</span>{" "}
              is confirmed. Show the QR codes below at the entrance — each ticket admits one person.
              Your tickets are always available in your account.
            </p>
          </div>
        </section>
      ) : (
        <header className="grid gap-2">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Order {order.number}
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            {order.event.title}
          </h1>
        </header>
      )}

      <section aria-labelledby="tickets-title" className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="tickets-title" className="text-2xl font-bold">
            Tickets ({order.tickets.length})
          </h2>
          <div className="flex gap-2 print:hidden">
            <PrintButton />
            <Button asChild variant="outline" size="sm">
              <Link href={`/events/${order.event.slug}`}>
                <CalendarPlus /> Event page
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-4">
          {order.tickets.map((t, i) => (
            <TicketCard
              key={t.id}
              index={i + 1}
              total={order.tickets.length}
              ticket={t}
              event={order.event}
              orderNumber={order.number}
            />
          ))}
        </div>
      </section>

      <section
        aria-labelledby="receipt-title"
        className="grid gap-4 rounded-3xl border bg-card p-6 md:p-8"
      >
        <h2 id="receipt-title" className="text-2xl font-bold">
          Receipt
        </h2>
        <dl className="grid gap-2 text-sm">
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                {it.quantity} × {it.name} ({formatPrice(it.unitPrice)})
              </dt>
              <dd className="tabular-nums">{formatPrice(it.unitPrice * it.quantity)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t pt-2">
            <dt className="text-muted-foreground">Service fee</dt>
            <dd className="tabular-nums">{formatPrice(order.serviceFee)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t pt-3">
            <dt className="font-semibold">Total paid (test)</dt>
            <dd className="font-display text-2xl font-bold tabular-nums">
              {formatPrice(order.total)}
            </dd>
          </div>
        </dl>
        <div className="grid gap-1 border-t pt-4 text-sm text-muted-foreground">
          <p>
            Buyer: {order.buyerName} · {order.buyerEmail} · {order.buyerPhone}
          </p>
          <p>
            Paid {order.paidAt ? formatDateTime(order.paidAt) : "—"} with test card ••••{" "}
            {order.cardLast4}. No real money was charged.
          </p>
        </div>
      </section>
    </div>
  );
}
