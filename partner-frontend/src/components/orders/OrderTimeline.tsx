import { Check, CircleDashed, XCircle } from "lucide-react";

import {
  STAGE_TIMELINE_INDEX,
  TIMELINE_STEPS,
  type ManagedOrder,
} from "../../data/partner-orders-mock";

/** Vertical status timeline: Pending → Accepted → … → Delivered. */
export function OrderTimeline({ order }: { order: ManagedOrder }) {
  const activeIndex = STAGE_TIMELINE_INDEX[order.stage];
  const cancelled = order.stage === "cancelled";

  return (
    <ol className="relative">
      {TIMELINE_STEPS.map((step, index) => {
        const done = !cancelled && index <= activeIndex;
        const current = !cancelled && index === activeIndex;
        const isLast = index === TIMELINE_STEPS.length - 1;
        const entry = order.timeline[index];

        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                  cancelled && index === 0
                    ? "bg-destructive/10 text-destructive"
                    : done
                      ? "bg-secondary/15 text-brand-green-dark"
                      : "bg-muted text-muted-foreground"
                } ${current ? "ring-2 ring-primary/40" : ""}`}
              >
                {cancelled && index === 0 ? (
                  <XCircle className="size-4" />
                ) : done ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : (
                  <CircleDashed className="size-4" />
                )}
              </span>
              {!isLast ? (
                <span
                  className={`my-1 w-px flex-1 transition-colors duration-500 ${
                    done && !cancelled ? "bg-brand-green/50" : "bg-border"
                  }`}
                />
              ) : null}
            </div>
            <div className={isLast ? "pb-0" : "pb-5"}>
              <p
                className={`text-sm font-bold tracking-tight ${
                  done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
              <p className="text-[0.68rem] font-semibold text-muted-foreground">
                {cancelled && index > 0
                  ? "Not applicable"
                  : done
                    ? (entry?.time ?? "Completed")
                    : "Pending"}
              </p>
              {current ? (
                <span className="mt-1 inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-brand-dark">
                  Current
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
