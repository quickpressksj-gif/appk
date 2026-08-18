import { Check } from "lucide-react";

import { DELIVERY_PROGRESS, type DeliveryTimelineStep } from "../../data/rider-delivery-mock";

/** Horizontal order progress tracker used on the Live Navigation screen. */
export function NavProgressTracker({ steps }: { steps: DeliveryTimelineStep[] }) {
  const doneCount = steps.filter((step) => step.done).length;
  const percent = Math.max(
    0,
    Math.min(100, ((doneCount - 1) / (DELIVERY_PROGRESS.length - 1)) * 100),
  );

  return (
    <div>
      <div className="relative mx-1 h-1.5 rounded-full bg-muted">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-secondary transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ol className="mt-2 flex items-start justify-between gap-1">
        {steps.map((step, index) => (
          <li key={step.id} className="flex min-w-0 flex-1 flex-col items-center text-center">
            <span
              className={`flex size-5 items-center justify-center rounded-full border-2 transition-colors duration-500 ${
                step.done
                  ? "border-secondary bg-secondary text-primary-foreground"
                  : "border-border bg-card"
              } ${index === doneCount - 1 ? "animate-status-change" : ""}`}
            >
              {step.done ? <Check className="size-3" strokeWidth={3} /> : null}
            </span>
            <span
              className={`mt-1 text-[0.58rem] font-bold leading-tight ${
                step.done ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
