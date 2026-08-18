import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

/** Success animation shown after a status change completes. */
export function DeliverySuccessOverlay({
  open,
  title,
  body,
  onDone,
}: {
  open: boolean;
  title: string;
  body?: string;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onDone, 1400);
    return () => clearTimeout(timer);
  }, [open, onDone]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-soft-fade fixed inset-0 z-[60] flex items-center justify-center bg-foreground/35 px-6"
    >
      <div className="animate-success-pop card-soft flex w-full max-w-xs flex-col items-center border border-border px-6 py-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-secondary/15 text-brand-green">
          <CheckCircle2 className="size-8" strokeWidth={2.4} />
        </span>
        <p className="mt-4 text-base font-black tracking-tight text-foreground">{title}</p>
        {body ? (
          <p className="mt-1 text-xs font-medium text-muted-foreground">{body}</p>
        ) : null}
      </div>
    </div>
  );
}
