import { Skeleton } from "@shared/ui/skeleton";

/** Shimmer placeholders for the customer grid. */
export function CustomerGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="card-soft border border-border p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="size-12 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/3 rounded-full" />
              <Skeleton className="h-2.5 w-1/2 rounded-full" />
              <Skeleton className="h-2.5 w-1/3 rounded-full" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Skeleton className="h-12 rounded-2xl" />
            <Skeleton className="h-12 rounded-2xl" />
            <Skeleton className="h-12 rounded-2xl" />
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
            <Skeleton className="h-9 flex-1 rounded-2xl" />
            <Skeleton className="h-9 w-28 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CustomerProfileSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4">
      <Skeleton className="h-36 w-full rounded-3xl" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="mt-4 h-48 w-full rounded-3xl" />
      <Skeleton className="mt-4 h-40 w-full rounded-3xl" />
    </div>
  );
}
