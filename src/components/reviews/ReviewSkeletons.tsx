import { Skeleton } from "@shared/ui/skeleton";

export function ReviewAnalyticsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-24 rounded-3xl" />
      ))}
    </div>
  );
}

export function ReviewListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="card-soft border border-border p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-1/2 rounded-full" />
              <Skeleton className="h-2.5 w-1/3 rounded-full" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <Skeleton className="h-2.5 w-full rounded-full" />
            <Skeleton className="h-2.5 w-4/5 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-9 w-32 rounded-2xl" />
        </div>
      ))}
    </div>
  );
}
