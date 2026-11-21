"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  className?: string;
};

export function QuantityStepper({ value, max, onChange, label, className }: Props) {
  const btn =
    "grid size-9 place-items-center rounded-full border border-input bg-card transition hover:border-foreground disabled:pointer-events-none disabled:opacity-35";
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="group"
      aria-label={`${label} quantity`}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value <= 0}
        aria-label={`Remove one ${label} ticket`}
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <output
        className="w-7 text-center font-display text-lg font-bold tabular-nums"
        aria-live="polite"
        aria-label={`${label}: ${value} selected`}
      >
        {value}
      </output>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Add one ${label} ticket`}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
