import { Skeleton } from "@shared/ui/skeleton";

/** Sprint 3.6 — skeleton loading for the wallet & earnings module. */
export function WalletScreenSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4">
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-3xl" />
        ))}
      </div>
      <Skeleton className="mt-6 h-52 w-full rounded-3xl" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export function WalletRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mt-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-3xl" />
      ))}
    </div>
  );
}
