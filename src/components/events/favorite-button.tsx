"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/use-favorites";
import { useSessionUser } from "@/components/session-provider";
import { cn } from "@/lib/utils";

type Props = {
  eventId: string;
  title: string;
  className?: string;
  variant?: "overlay" | "solid";
  withLabel?: boolean;
};

export function FavoriteButton({
  eventId,
  title,
  className,
  variant = "overlay",
  withLabel = false,
}: Props) {
  const { isFavorite, toggle } = useFavorites();
  const user = useSessionUser();
  const active = isFavorite(eventId);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={
        withLabel
          ? undefined
          : active
            ? `Remove ${title} from favorites`
            : `Save ${title} to favorites`
      }
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggle(eventId);
        if (!user && added)
          toast.success("Saved to favorites", {
            description: "Sign in to keep them across devices.",
          });
      }}
      className={cn(
        "group/fav inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-95",
        withLabel ? "h-11 px-5 text-sm" : "size-10",
        variant === "overlay" && "bg-black/45 text-white backdrop-blur-md hover:bg-black/65",
        variant === "solid" && "border border-input bg-card hover:border-foreground/40",
        className,
      )}
    >
      <Heart
        aria-hidden
        className={cn(
          "size-[18px] transition-transform group-hover/fav:scale-110",
          active && variant === "overlay" && "fill-lime stroke-lime",
          active && variant === "solid" && "fill-[#101010] stroke-[#101010]",
        )}
      />
      {withLabel && <span>{active ? "Saved" : "Save"}</span>}
    </button>
  );
}
