import { memo, type ReactNode } from "react";

/** Inline premium spinner (used by loading buttons and inline loaders). */
export const Spinner = memo(function Spinner({ className = "size-4" }: { className?: string }) {
  return <span role="status" aria-label="Loading" className={`spinner ${className}`} />;
});

/** Centered loading block for full-screen / section loading states. */
export const LoadingBlock = memo(function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div className="card-enter flex flex-col items-center justify-center gap-3 py-14">
      <Spinner className="size-7" />
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
    </div>
  );
});

/** Animated success check with an expanding ring — used on confirmations. */
export const SuccessCheck = memo(function SuccessCheck({ className = "size-16" }: { className?: string }) {
  return (
    <span className={`relative grid place-items-center ${className}`}>
      <span className="animate-success-ring absolute inset-0 rounded-full bg-brand-green/25" />
      <span className="animate-success-pop relative grid size-full place-items-center rounded-full bg-brand-green/15">
        <svg viewBox="0 0 24 24" fill="none" className="size-1/2 text-brand-green">
          <path
            d="M4 12.5l5 5L20 6.5"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-check-draw"
          />
        </svg>
      </span>
    </span>
  );
});

/** Fade + slide-up reveal wrapper with an optional stagger index. */
export const Reveal = memo(function Reveal({
  children,
  delayIndex = 0,
  className = "",
}: {
  children: ReactNode;
  delayIndex?: number;
  className?: string;
}) {
  return (
    <div
      className={`card-enter ${className}`}
      style={delayIndex ? { animationDelay: `${Math.min(delayIndex, 10) * 50}ms` } : undefined}
    >
      {children}
    </div>
  );
});
