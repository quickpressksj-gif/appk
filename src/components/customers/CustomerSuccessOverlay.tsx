import { Check } from "lucide-react";
import { useEffect } from "react";

/** Success confirmation for customer/review actions. */
export function CustomerSuccessOverlay({
  message,
  onDone,
}: {
  message: string | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDone, 1200);
    return () => window.clearTimeout(timer);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-overlay-in pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-background/70 backdrop-blur-sm"
    >
      <div className="animate-success-pop card-soft flex flex-col items-center border border-border px-8 py-7 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-secondary/15 text-brand-green-dark">
          <Check className="size-7" strokeWidth={3} />
        </span>
        <p className="mt-3 text-sm font-black tracking-tight text-foreground">{message}</p>
      </div>
    </div>
  );
}
