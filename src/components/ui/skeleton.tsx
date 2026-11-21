import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("animate-pulse rounded-xl bg-foreground/[0.07]", className)}
      {...props}
    />
  );
}

export { Skeleton };
