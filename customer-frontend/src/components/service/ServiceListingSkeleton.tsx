/** Skeletons for the service listing screen — mirrors the real card layout. */
export function PartnerCardSkeleton() {
  return (
    <div className="card-soft overflow-hidden border border-border">
      <div className="h-36 w-full animate-pulse bg-muted" />
      <div className="space-y-2.5 p-3.5">
        <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-muted" />
        <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-muted" />
        <div className="h-2.5 w-3/4 animate-pulse rounded-full bg-muted" />
        <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

export function ServiceListingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-32 w-full animate-pulse rounded-3xl bg-muted" />
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="h-9 w-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      {[0, 1, 2].map((key) => (
        <PartnerCardSkeleton key={key} />
      ))}
    </div>
  );
}
