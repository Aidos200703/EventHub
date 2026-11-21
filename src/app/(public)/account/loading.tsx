import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="grid gap-4" role="status" aria-label="Loading">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-40 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
