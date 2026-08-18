import { Skeleton } from "@/shared/ui/skeleton";

export function PartnerCardsSkeleton({ rows = 4 }: { rows?: number }) {
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

export function PartnerListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-5 pb-32 pt-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-3xl" />
      ))}
    </div>
  );
}

export function PartnerDetailSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4">
      <Skeleton className="h-40 w-full rounded-3xl" />
      <Skeleton className="mt-4 h-28 w-full rounded-3xl" />
      <Skeleton className="mt-4 h-48 w-full rounded-3xl" />
    </div>
  );
}
