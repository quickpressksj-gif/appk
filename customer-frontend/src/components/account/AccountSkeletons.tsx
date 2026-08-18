function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-2xl bg-muted ${className}`} />;
}

export function AddressesSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <Shimmer key={index} className="h-20 rounded-3xl" />
        ))}
      </div>
      <Shimmer className="mt-7 h-4 w-36" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Shimmer key={index} className="h-40 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export function PaymentsSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4" aria-hidden="true">
      <Shimmer className="h-4 w-40" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Shimmer key={index} className="h-24 rounded-3xl" />
        ))}
      </div>
      <Shimmer className="mt-7 h-4 w-32" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Shimmer key={index} className="h-20 rounded-3xl" />
        ))}
      </div>
      <Shimmer className="mt-7 h-28 rounded-3xl" />
    </div>
  );
}

export function HelpSkeleton() {
  return (
    <div className="px-5 pb-32 pt-4" aria-hidden="true">
      <Shimmer className="h-12 rounded-3xl" />
      <div className="mt-5 grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Shimmer key={index} className="h-20 rounded-3xl" />
        ))}
      </div>
      <Shimmer className="mt-7 h-4 w-40" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Shimmer key={index} className="h-20 rounded-3xl" />
        ))}
      </div>
      <Shimmer className="mt-7 h-4 w-24" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Shimmer key={index} className="h-16 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
