import { Skeleton } from "@/shared/ui/skeleton";

export function HistoryListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-5 pb-32 pt-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full rounded-3xl" />
      ))}
    </div>
  );
}

export function HistoryDetailSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4">
      <Skeleton className="h-32 w-full rounded-3xl" />
      <Skeleton className="mt-4 h-56 w-full rounded-3xl" />
      <Skeleton className="mt-4 h-40 w-full rounded-3xl" />
    </div>
  );
}

export function PerformanceSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-3xl" />
        ))}
      </div>
      <Skeleton className="mt-5 h-48 w-full rounded-3xl" />
    </div>
  );
}