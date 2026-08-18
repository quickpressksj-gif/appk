function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-2xl bg-muted ${className}`} />;
}

export function OrderSuccessSkeleton() {
  return (
    <div className="px-5 pb-40 pt-6" aria-hidden="true">
      <Shimmer className="mx-auto size-24 rounded-full" />
      <Shimmer className="mx-auto mt-6 h-5 w-48" />
      <Shimmer className="mx-auto mt-3 h-3 w-32" />
      <Shimmer className="mt-8 h-28 rounded-3xl" />
      <Shimmer className="mt-6 h-40 rounded-3xl" />
      <Shimmer className="mt-6 h-52 rounded-3xl" />
    </div>
  );
}

export function TrackingSkeleton() {
  return (
    <div className="px-5 pb-40 pt-4" aria-hidden="true">
      <Shimmer className="h-44 rounded-3xl" />
      <Shimmer className="mt-6 h-24 rounded-3xl" />
      <Shimmer className="mt-6 h-4 w-36" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Shimmer key={index} className="h-16 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
