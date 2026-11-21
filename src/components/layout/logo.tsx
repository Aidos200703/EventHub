import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      aria-label="EventHub home"
      className={cn(
        "group inline-flex items-center gap-2 rounded-full font-display text-xl font-bold tracking-tight",
        className,
      )}
    >
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-full bg-lime text-[#101010] transition-transform duration-300 group-hover:rotate-[-12deg]"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v8a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2z" />
          <path d="M10 6v12" strokeDasharray="2 2.5" />
        </svg>
      </span>
      <span aria-hidden>
        Event<span className="text-muted-foreground">Hub</span>
      </span>
    </Link>
  );
}
