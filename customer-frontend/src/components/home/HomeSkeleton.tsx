function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-2xl bg-muted ${className}`} />;
}

export function HomeSkeleton() {
  return (
    <div className="px-5 pb-32 pt-12" aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Shimmer className="size-10 rounded-2xl" />
          <Shimmer className="size-10 rounded-2xl" />
        </div>
      </div>

      <Shimmer className="mt-6 h-14 rounded-3xl" />
      <Shimmer className="mt-6 h-40 rounded-3xl" />

      <div className="mt-6 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Shimmer key={index} className="h-24 rounded-3xl" />
        ))}
      </div>

      <Shimmer className="mt-8 h-4 w-36" />
      <div className="mt-4 grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Shimmer key={index} className="h-28 rounded-3xl" />
        ))}
      </div>

      <Shimmer className="mt-8 h-4 w-44" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <Shimmer key={index} className="h-36 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
