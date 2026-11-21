"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="grid min-h-[60dvh] place-items-center px-4 py-20">
      <div role="alert" className="grid max-w-lg justify-items-center gap-4 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-[#fde3df] text-destructive">
          <RotateCcw className="size-6" aria-hidden />
        </span>
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">
          {"We couldn't load this page. It might be a temporary problem — try again in a moment."}
          {error.digest && (
            <span className="mt-2 block font-mono text-xs">Error ID: {error.digest}</span>
          )}
        </p>
        <div className="flex gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
