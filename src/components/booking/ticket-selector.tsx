"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, TicketX } from "lucide-react";
import { calculateQuote, encodeSelection, type TicketSelection } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";
import { useSessionUser } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { TicketList, type TicketTypeView } from "./ticket-list";

type Props = { slug: string; types: TicketTypeView[]; salesOpen: boolean };

/** Step 1 of booking: pick ticket types and quantities on the event page. */
export function TicketSelector({ slug, types, salesOpen }: Props) {
  const router = useRouter();
  const user = useSessionUser();
  const [selection, setSelection] = useState<TicketSelection>({});
  const quote = calculateQuote(types, selection);
  const allSoldOut = types.every((t) => t.available <= 0);

  if (!salesOpen) {
    return (
      <p className="rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">
        Ticket sales for this event have ended.
      </p>
    );
  }
  if (allSoldOut) {
    return (
      <div className="grid justify-items-center gap-2 rounded-2xl bg-secondary p-6 text-center">
        <TicketX className="size-7" aria-hidden />
        <p className="font-semibold">All tickets are sold out</p>
        <p className="text-sm text-muted-foreground">
          Save the event to favorites to keep it on your radar.
        </p>
      </div>
    );
  }

  const checkoutHref = `/checkout/${slug}?tickets=${encodeSelection(selection)}`;

  return (
    <div className="grid gap-5">
      <TicketList
        types={types}
        selection={selection}
        onChange={(id, qty) => setSelection((s) => ({ ...s, [id]: qty }))}
      />
      <div className="grid gap-3 rounded-2xl bg-secondary p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">
            {quote.ticketCount
              ? `${quote.ticketCount} ticket${quote.ticketCount === 1 ? "" : "s"}`
              : "No tickets selected"}
          </span>
          <span className="font-display text-2xl font-bold tabular-nums" aria-live="polite">
            {formatPrice(quote.subtotal)}
          </span>
        </div>
        <Button
          size="lg"
          variant="lime"
          disabled={quote.ticketCount === 0}
          onClick={() =>
            router.push(user ? checkoutHref : `/sign-in?next=${encodeURIComponent(checkoutHref)}`)
          }
        >
          {user ? "Continue to checkout" : "Sign in to book"} <ArrowRight />
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Service fee is shown at checkout. Test payment — no real money is charged.
        </p>
      </div>
    </div>
  );
}
