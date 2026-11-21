import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cityName } from "@/lib/constants";
import { formatDate, formatTime } from "@/lib/format";
import { decodeSelection, maxSelectable } from "@/lib/pricing";
import { requireUser } from "@/server/session";
import { getEventBySlug } from "@/server/services/events";
import { getProfile } from "@/server/services/account";
import { CheckoutForm } from "@/components/booking/checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ tickets?: string }> };

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tickets } = await searchParams;
  const user = await requireUser(`/checkout/${slug}${tickets ? `?tickets=${tickets}` : ""}`);
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const profile = await getProfile(user.id);
  const types = event.ticketTypes.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    price: t.price,
    available: t.quantity - t.sold,
    maxPerOrder: t.maxPerOrder,
  }));
  // Clamp the URL selection to what is actually available right now.
  const requested = decodeSelection(tickets);
  const initialSelection = Object.fromEntries(
    types.flatMap((t) =>
      requested[t.id] ? [[t.id, Math.min(requested[t.id]!, maxSelectable(t))] as const] : [],
    ),
  );

  return (
    <div className="container-page grid gap-8 py-10 md:py-14">
      <Link
        href={`/events/${event.slug}`}
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to event
      </Link>
      <header className="grid gap-2">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Checkout
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">{event.title}</h1>
        <p className="text-muted-foreground">
          {formatDate(event.startsAt)} · {formatTime(event.startsAt)} · {event.venueName},{" "}
          {cityName(event.city)}
        </p>
      </header>
      {event.startsAt <= new Date() ? (
        <p className="rounded-2xl bg-secondary p-6">Ticket sales for this event have ended.</p>
      ) : (
        <CheckoutForm
          eventId={event.id}
          types={types}
          initialSelection={initialSelection}
          defaults={{ name: profile.name, email: profile.email, phone: profile.phone ?? "" }}
        />
      )}
    </div>
  );
}
