import { Skeleton } from "@/shared/ui/skeleton";

export function WalletHomeSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4">
      <Skeleton className="h-56 w-full rounded-3xl" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-3xl" />
        ))}
      </div>
      <Skeleton className="mt-5 h-32 w-full rounded-3xl" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export function WalletKpiSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-3xl" />
        ))}
      </div>
      <Skeleton className="mt-5 h-40 w-full rounded-3xl" />
    </div>
  );
}

export function TransactionListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-5 pb-32 pt-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-3xl" />
      ))}
    </div>
  );
}