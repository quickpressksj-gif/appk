function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-2xl bg-muted ${className}`} />;
}

/** Loading placeholder for the Membership screen (Sprint 2.9). */
export function MembershipSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4" aria-hidden="true">
      <Shimmer className="h-44 rounded-3xl" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <Shimmer key={index} className="h-20 rounded-3xl" />
        ))}
      </div>
      <Shimmer className="mt-6 h-11 rounded-2xl" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Shimmer key={index} className="h-40 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export function MembershipHistorySkeleton() {
  return (
    <div className="mt-4 space-y-3" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <Shimmer key={index} className="h-24 rounded-3xl" />
      ))}
    </div>
  );
}
