import { Skeleton } from "@shared/ui/skeleton";

export function ShopProfileSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4">
      <Skeleton className="h-40 w-full rounded-3xl" />
      <Skeleton className="mt-4 h-28 w-full rounded-3xl" />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-3xl" />
        ))}
      </div>
      <Skeleton className="mt-4 h-44 w-full rounded-3xl" />
      <Skeleton className="mt-4 h-36 w-full rounded-3xl" />
    </div>
  );
}

export function ShopGallerySkeleton({ tiles = 6 }: { tiles?: number }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: tiles }).map((_, i) => (
        <Skeleton key={i} className="aspect-4/3 w-full rounded-2xl" />
      ))}
    </div>
  );
}

/** Shimmering tile used while a gallery image "loads". */
export function ShopImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="shimmer flex aspect-4/3 w-full items-center justify-center rounded-2xl bg-muted">
      <span className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
