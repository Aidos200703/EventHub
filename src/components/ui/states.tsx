import * as React from "react";
import { cn } from "@/lib/utils";

/** Empty / error state block with an icon, a headline and an optional action. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  tone = "default",
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  tone?: "default" | "error";
}) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "grid justify-items-center gap-3 rounded-3xl border border-dashed px-6 py-14 text-center",
        tone === "error" && "border-destructive/40 bg-[#fde3df]/40",
        className,
      )}
    >
      {icon && (
        <div
          aria-hidden
          className={cn(
            "grid size-14 place-items-center rounded-full bg-secondary [&_svg]:size-6",
            tone === "error" && "bg-[#fde3df] text-destructive",
          )}
        >
          {icon}
        </div>
      )}
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
