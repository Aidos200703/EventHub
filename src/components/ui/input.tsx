import * as React from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "flex h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3.5 text-[15px] text-foreground transition-colors placeholder:text-muted-foreground/80 hover:border-foreground/30 focus-visible:border-foreground focus-visible:outline-2 focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:outline-destructive";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(inputClass, className)} {...props} />;
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(inputClass, "h-auto min-h-28 py-3 leading-relaxed", className)}
      {...props}
    />
  );
}

/** Native select: best keyboard & mobile UX, styled to match inputs. */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(inputClass, "appearance-none pr-10", className)}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground"
      >
        <path
          d="M4 6l4 4 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export { Input, Textarea, NativeSelect };
