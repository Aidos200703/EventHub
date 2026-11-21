"use client";

import { formatPrice } from "@/lib/format";
import { maxSelectable, type PricedTicketType, type TicketSelection } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { QuantityStepper } from "./quantity-stepper";

export type TicketTypeView = PricedTicketType & { description: string | null };

/** List of ticket types with quantity steppers. Shared by the event page and checkout. */
export function TicketList({
  types,
  selection,
  onChange,
  disabled,
}: {
  types: TicketTypeView[];
  selection: TicketSelection;
  onChange: (id: string, qty: number) => void;
  disabled?: boolean;
}) {
  return (
    <ul className="grid gap-3">
      {types.map((t) => {
        const qty = selection[t.id] ?? 0;
        const max = maxSelectable(t);
        const soldOut = t.available <= 0;
        const few = !soldOut && t.available <= 10;
        return (
          <li
            key={t.id}
            className={cn(
              "flex items-center justify-between gap-4 rounded-2xl border bg-card p-4 transition",
              qty > 0 && "border-foreground shadow-[inset_4px_0_0_var(--lime)]",
              soldOut && "opacity-60",
            )}
          >
            <div className="min-w-0">
              <p className="font-semibold">{t.name}</p>
              {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
              <p className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-display text-lg font-bold">{formatPrice(t.price)}</span>
                {soldOut && <Badge variant="destructive">Sold out</Badge>}
                {few && <Badge variant="warning">{t.available} left</Badge>}
              </p>
            </div>
            {!soldOut && !disabled && (
              <QuantityStepper
                label={t.name}
                value={qty}
                max={max}
                onChange={(v) => onChange(t.id, v)}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
