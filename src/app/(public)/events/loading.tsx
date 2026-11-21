import { Skeleton } from "@/components/ui/skeleton";
import { EventGridSkeleton } from "@/components/events/event-cards";

export default function Loading() {
  return (
    <>
      <section className="border-b bg-card">
        <div className="container-page grid gap-6 py-10 md:py-14">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-14 w-72" />
          <Skeleton className="h-13 w-full rounded-full" />
        </div>
      </section>
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[280px_1fr]">
        <div className="hidden gap-4 lg:grid lg:content-start">
          <Skeleton className="h-11" />
          <Skeleton className="h-32" />
          <Skeleton className="h-28" />
        </div>
        <EventGridSkeleton />
      </div>
    </>
  );
}
