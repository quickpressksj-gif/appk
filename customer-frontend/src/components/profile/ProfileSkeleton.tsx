function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-2xl bg-muted ${className}`} />;
}

export function ProfileSkeleton() {
  return (
    <div className="px-5 pb-32 pt-12" aria-hidden="true">
      <div className="flex items-center justify-between">
        <Shimmer className="h-5 w-32" />
        <div className="flex gap-2">
          <Shimmer className="size-10 rounded-2xl" />
          <Shimmer className="size-10 rounded-2xl" />
        </div>
      </div>

      <Shimmer className="mt-6 h-48 rounded-3xl" />

      <div className="mt-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Shimmer key={index} className="h-24 rounded-3xl" />
        ))}
      </div>

      <Shimmer className="mt-8 h-4 w-28" />
      <Shimmer className="mt-4 h-64 rounded-3xl" />

      <Shimmer className="mt-8 h-4 w-24" />
      <Shimmer className="mt-4 h-44 rounded-3xl" />

      <Shimmer className="mt-8 h-4 w-28" />
      <Shimmer className="mt-4 h-40 rounded-3xl" />
    </div>
  );
}
