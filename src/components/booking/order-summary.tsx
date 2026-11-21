import { formatPrice } from "@/lib/format";
import type { OrderQuote } from "@/lib/pricing";
import { SERVICE_FEE_RATE } from "@/lib/constants";

export function OrderSummary({ quote }: { quote: OrderQuote }) {
  return (
    <dl className="grid gap-2 text-sm" aria-label="Order summary">
      {quote.lines.map((l) => (
        <div key={l.ticketTypeId} className="flex justify-between gap-4">
          <dt className="text-muted-foreground">
            {l.quantity} × {l.name}
          </dt>
          <dd className="tabular-nums">{formatPrice(l.lineTotal)}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-4 border-t pt-2">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="tabular-nums">{formatPrice(quote.subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">
          Service fee ({Math.round(SERVICE_FEE_RATE * 100)}%)
        </dt>
        <dd className="tabular-nums">{formatPrice(quote.serviceFee)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t pt-3">
        <dt className="font-semibold">Total</dt>
        <dd className="font-display text-2xl font-bold tabular-nums" data-testid="order-total">
          {formatPrice(quote.total)}
        </dd>
      </div>
    </dl>
  );
}
