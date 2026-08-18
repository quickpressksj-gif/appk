function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-2xl bg-muted ${className}`} />;
}

export function ServiceDetailSkeleton() {
  return (
    <div className="px-5 pb-40 pt-4" aria-hidden="true">
      <div className="flex items-center justify-between">
        <Shimmer className="size-10 rounded-2xl" />
        <Shimmer className="h-4 w-32" />
        <div className="flex gap-2">
          <Shimmer className="size-10 rounded-2xl" />
          <Shimmer className="size-10 rounded-2xl" />
        </div>
      </div>

      <Shimmer className="mt-5 h-52 rounded-3xl" />
      <Shimmer className="mt-5 h-4 w-44" />
      <Shimmer className="mt-3 h-3 w-full" />
      <Shimmer className="mt-2 h-3 w-3/4" />

      <div className="mt-6 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Shimmer key={index} className="h-20 rounded-3xl" />
        ))}
      </div>

      <Shimmer className="mt-8 h-4 w-36" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Shimmer key={index} className="h-24 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}