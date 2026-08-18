export function BrandMark({ withTagline = true }: { withTagline?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <p className="animate-fade-in text-3xl font-extrabold tracking-tight sm:text-4xl">
        <span className="text-brand-dark">Quick</span>
        <span className="text-brand-green">Press</span>
      </p>
      <span className="relative mt-3 block h-[3px] w-24 overflow-hidden rounded-full bg-primary/15">
        <span className="brand-sweep absolute inset-y-0 left-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
      </span>

      {withTagline ? (
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Laundry <span className="text-primary">|</span> Pickup{" "}
          <span className="text-primary">|</span> Delivery
        </p>
      ) : null}
    </div>
  );
}
