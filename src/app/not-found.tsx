import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="surface-dark grid min-h-dvh place-items-center bg-background px-4">
      <div className="grid max-w-xl justify-items-start gap-6">
        <p className="font-display text-[clamp(6rem,20vw,12rem)] leading-none font-extrabold tracking-tighter text-lime">
          404
        </p>
        <h1 className="text-4xl font-bold">This page left before the encore.</h1>
        <p className="text-muted-foreground">
          The link may be broken, or the page has been removed.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="lime">
            <Link href="/events">Browse events</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
