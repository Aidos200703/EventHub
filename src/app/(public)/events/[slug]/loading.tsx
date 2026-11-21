import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading event">
      <div className="h-[440px] animate-pulse bg-graphite md:h-[560px]" />
      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_420px]">
        <div className="grid content-start gap-6">
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </div>
  );
}
