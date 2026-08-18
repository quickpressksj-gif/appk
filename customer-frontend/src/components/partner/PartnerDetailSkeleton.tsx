function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-2xl bg-muted ${className}`} />;
}

export function PartnerDetailSkeleton() {
  return (
    <div className="pb-40" aria-hidden="true">
      <Shimmer className="h-56 rounded-none" />

      <div className="px-5">
        <div className="card-soft -mt-10 border border-border p-4">
          <div className="flex items-center gap-3">
            <Shimmer className="size-16 rounded-3xl" />
            <div className="flex-1">
              <Shimmer className="h-4 w-40" />
              <Shimmer className="mt-2 h-3 w-28" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Shimmer key={index} className="h-16 rounded-2xl" />
            ))}
          </div>
        </div>

        <Shimmer className="mt-8 h-4 w-36" />
        <Shimmer className="mt-4 h-32 rounded-3xl" />

        <Shimmer className="mt-8 h-4 w-40" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Shimmer key={index} className="h-28 rounded-3xl" />
          ))}
        </div>

        <Shimmer className="mt-8 h-4 w-32" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Shimmer key={index} className="h-16 rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
