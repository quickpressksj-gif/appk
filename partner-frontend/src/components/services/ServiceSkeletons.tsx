import { Skeleton } from "@/shared/ui/skeleton";

/** Shimmer placeholders matching the service card grid. */
export function ServiceGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="card-soft border border-border p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="size-12 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/3 rounded-full" />
              <Skeleton className="h-2.5 w-1/3 rounded-full" />
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ServiceFormSkeleton() {
  return (
    <div className="space-y-4 px-5 pb-32 pt-4">
      <Skeleton className="h-36 w-full rounded-3xl" />
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  );
}
