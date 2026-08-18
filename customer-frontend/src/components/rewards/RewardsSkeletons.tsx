function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-2xl bg-muted ${className}`} />;
}

export function WalletSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4" aria-hidden="true">
      <Shimmer className="h-44 rounded-3xl" />
      <div className="mt-5 grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Shimmer key={index} className="h-20 rounded-3xl" />
        ))}
      </div>
      <Shimmer className="mt-7 h-4 w-40" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Shimmer key={index} className="h-20 rounded-3xl" />
        ))}
      </div>
      <Shimmer className="mt-7 h-40 rounded-3xl" />
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, group) => (
        <div key={group} className="mt-5 first:mt-0">
          <Shimmer className="h-3 w-20" />
          <div className="mt-3 space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <Shimmer key={index} className="h-24 rounded-3xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function OffersSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4" aria-hidden="true">
      <Shimmer className="h-40 rounded-3xl" />
      <Shimmer className="mt-7 h-4 w-32" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Shimmer key={index} className="h-28 rounded-3xl" />
        ))}
      </div>
      <Shimmer className="mt-7 h-4 w-36" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Shimmer key={index} className="h-32 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export function ReferralSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4" aria-hidden="true">
      <Shimmer className="h-56 rounded-3xl" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Shimmer key={index} className="h-24 rounded-3xl" />
        ))}
      </div>
      <Shimmer className="mt-6 h-11 rounded-2xl" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Shimmer key={index} className="h-16 rounded-3xl" />
        ))}
      </div>
      <Shimmer className="mt-6 h-28 rounded-3xl" />
    </div>
  );
}
