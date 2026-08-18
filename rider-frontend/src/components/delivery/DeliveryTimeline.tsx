import { Check } from "lucide-react";

import type { DeliveryTimelineStep } from "../../data/rider-delivery-mock";

/** Vertical progress timeline shared by the details screen. */
export function DeliveryTimeline({ steps }: { steps: DeliveryTimelineStep[] }) {
  const activeIndex = steps.reduce((last, step, index) => (step.done ? index : last), -1);

  return (
    <ol className="mt-4 space-y-0">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isCurrent = index === activeIndex;

        return (
          <li key={step.id} className="animate-rise relative flex gap-3 pb-5 last:pb-0">
            {!isLast ? (
              <span
                className={`absolute left-[0.68rem] top-6 h-full w-0.5 rounded-full transition-colors duration-500 ${
                  steps[index + 1]?.done ? "bg-secondary" : "bg-border"
                }`}
              />
            ) : null}

            <span
              className={`relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                step.done
                  ? "border-secondary bg-secondary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground"
              } ${isCurrent ? "animate-status-change" : ""}`}
            >
              {step.done ? (
                <Check className="size-3.5" strokeWidth={3} />
              ) : (
                <span className="size-1.5 rounded-full bg-border" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-bold tracking-tight ${
                  step.done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
              <p className="text-[0.68rem] font-medium text-muted-foreground">
                {step.time ?? "Pending"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
