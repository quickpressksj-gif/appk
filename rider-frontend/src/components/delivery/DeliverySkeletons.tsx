import { Skeleton } from "@/shared/ui/skeleton";

export function DeliveryListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="card-soft border border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-4 w-40 rounded-full" />
          <Skeleton className="mt-2 h-3 w-full rounded-full" />
          <Skeleton className="mt-2 h-3 w-5/6 rounded-full" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-11 w-full rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

export function DeliveryDetailsSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4">
      <Skeleton className="h-24 w-full rounded-3xl" />
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
      <Skeleton className="mt-4 h-56 w-full rounded-3xl" />
      <Skeleton className="mt-4 h-32 w-full rounded-3xl" />
    </div>
  );
}

export function NavigationSkeleton() {
  return (
    <div className="absolute inset-0 p-4">
      <div className="shimmer size-full rounded-3xl bg-muted">
        <div className="size-full opacity-40 [background-image:linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>
    </div>
  );
}
