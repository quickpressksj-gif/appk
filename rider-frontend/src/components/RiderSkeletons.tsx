import { Skeleton } from "@/shared/ui/skeleton";

export function RiderCardsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="px-5 pb-32 pt-4">
      <Skeleton className="h-32 w-full rounded-3xl" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-3xl" />
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export function RiderListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-5 pb-32 pt-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-3xl" />
      ))}
    </div>
  );
}

export function RiderDetailSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4">
      <Skeleton className="h-40 w-full rounded-3xl" />
      <Skeleton className="mt-4 h-28 w-full rounded-3xl" />
      <Skeleton className="mt-4 h-48 w-full rounded-3xl" />
    </div>
  );
}

/** Map loading skeleton with the shared shimmer sweep. */
export function RiderMapSkeleton({ className = "h-64" }: { className?: string }) {
  return (
    <div className={`shimmer w-full overflow-hidden rounded-3xl bg-muted ${className}`}>
      <div className="size-full opacity-40 [background-image:linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] [background-size:28px_28px]" />
    </div>
  );
}
