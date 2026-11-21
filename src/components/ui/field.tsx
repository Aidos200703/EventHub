"use client";

import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn("text-sm leading-none font-medium select-none", className)}
      {...props}
    />
  );
}

export type FieldControlProps = {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
  "aria-required"?: true;
};

type FieldProps = {
  label: React.ReactNode;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
  className?: string;
  /** Render prop receives the ids so the control is wired to its label, hint and error. */
  children: (props: FieldControlProps) => React.ReactNode;
};

/** Accessible form field: label, control, hint and error linked via ids. */
export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = React.useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("grid content-start gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden>
            *
          </span>
        )}
      </Label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        "aria-required": required ? true : undefined,
      })}
      {hint && !error && (
        <p id={hintId} className="text-[13px] text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-[13px] font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
