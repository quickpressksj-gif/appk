import { Target } from "lucide-react";

import { useCountUp } from "../../hooks/use-count-up";
import type { RiderGoal } from "../../data/rider-analytics-mock";

function formatGoal(value: number, unit: RiderGoal["unit"]) {
  return unit === "currency" ? `₹${Math.round(value).toLocaleString("en-IN")}` : Math.round(value).toString();
}

/** Animated progress bar for one daily/weekly/monthly goal. */
export function GoalProgressRow({ goal, delay = 0 }: { goal: RiderGoal; delay?: number }) {
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const animated = useCountUp(pct, 900, 0);

  return (
    <div
      className="card-soft animate-rise border border-border p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-black tracking-tight text-foreground">{goal.label}</p>
          <p className="truncate text-[0.68rem] font-medium text-muted-foreground">{goal.caption}</p>
        </div>
        <span className="shrink-0 text-sm font-black tabular-nums text-brand-green">
          {animated}%
        </span>
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="animate-bar-grow h-full rounded-full bg-secondary"
          style={{ width: `${pct}%`, animationDelay: `${delay}ms` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[0.62rem] font-bold text-muted-foreground">
        <span>
          {formatGoal(goal.current, goal.unit)} / {formatGoal(goal.target, goal.unit)}
        </span>
        <span className="flex items-center gap-1 text-brand-green">
          <Target className="size-3" />
          {goal.reward}
        </span>
      </div>
    </div>
  );
}

export function GoalProgressList({ goals }: { goals: RiderGoal[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {goals.map((goal, index) => (
        <GoalProgressRow key={goal.id} goal={goal} delay={index * 60} />
      ))}
    </div>
  );
}
