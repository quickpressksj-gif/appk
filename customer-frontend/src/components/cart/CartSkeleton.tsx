function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-2xl bg-muted ${className}`} />;
}

export function CartSkeleton() {
  return (
    <div className="px-5 pb-44 pt-4" aria-hidden="true">
      <Shimmer className="h-24 rounded-3xl" />
      <Shimmer className="mt-8 h-4 w-32" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Shimmer key={index} className="h-28 rounded-3xl" />
        ))}
      </div>
      <Shimmer className="mt-6 h-12 rounded-3xl" />
      <Shimmer className="mt-8 h-40 rounded-3xl" />
      <Shimmer className="mt-8 h-32 rounded-3xl" />
      <Shimmer className="mt-8 h-48 rounded-3xl" />
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="px-5 pb-44 pt-4" aria-hidden="true">
      <Shimmer className="h-4 w-32" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <Shimmer key={index} className="h-24 rounded-3xl" />
        ))}
      </div>
      <Shimmer className="mt-8 h-4 w-36" />
      <Shimmer className="mt-4 h-36 rounded-3xl" />
      <Shimmer className="mt-8 h-4 w-40" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Shimmer key={index} className="h-16 rounded-3xl" />
        ))}
      </div>
      <Shimmer className="mt-8 h-44 rounded-3xl" />
    </div>
  );
}
