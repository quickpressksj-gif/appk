/** Animated brand loader (Lottie-style, pure CSS/SVG) used on blocking waits. */
export function RiderLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="relative flex size-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-primary/20 qp-bob" />
        <svg viewBox="0 0 48 48" className="size-9" aria-hidden="true">
          <path
            d="M26 4 L12 27 h9 l-3 17 16-24 h-9 z"
            fill="var(--color-primary)"
            className="qp-bolt-box"
          />
        </svg>
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
