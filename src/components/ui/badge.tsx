import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        lime: "bg-lime text-[#101010]",
        outline: "border border-border text-foreground",
        muted: "bg-muted text-muted-foreground",
        success: "bg-[#dff3e4] text-[#155c2e]",
        warning: "bg-[#fff0cc] text-[#7a4700]",
        destructive: "bg-[#fde3df] text-[#9c2414]",
        glass: "bg-black/55 text-white backdrop-blur-md",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
