import { Skeleton } from "@/shared/ui/skeleton";

export function AnalyticsDashboardSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4">
      <Skeleton className="h-12 w-full rounded-2xl" />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-3xl" />
        ))}
      </div>
      <Skeleton className="mt-5 h-44 w-full rounded-3xl" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-56 w-full rounded-3xl" />
        <Skeleton className="h-56 w-full rounded-3xl" />
      </div>
    </div>
  );
}

export function AchievementsSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4">
      <Skeleton className="h-20 w-full rounded-3xl" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-3xl" />
        ))}
      </div>
      <div className="mt-5 space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export function InsightsSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4">
      <Skeleton className="h-20 w-full rounded-3xl" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
