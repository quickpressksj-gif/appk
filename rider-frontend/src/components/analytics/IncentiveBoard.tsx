import { CalendarHeart, CheckCircle2, Gift, Lock, Sparkles, Users, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { IncentiveId, RiderIncentive } from "../../data/rider-analytics-mock";

const ICONS: Record<IncentiveId, LucideIcon> = {
  daily: Gift,
  weekly: Sparkles,
  festival: CalendarHeart,
  referral: Users,
  peak: Zap,
  quest: CheckCircle2,
};

/** Incentive dashboard card with payout, window and progress. */
export function IncentiveCard({
  incentive,
  delay = 0,
}: {
  incentive: RiderIncentive;
  delay?: number;
}) {
  const Icon = ICONS[incentive.id];
  const pct = Math.min(100, Math.round((incentive.progress / incentive.target) * 100));
  const locked = incentive.status === "locked";
  const claimed = incentive.status === "claimed";

  return (
    <div
      className={`card-soft animate-rise border p-4 transition-all duration-300 ${
        claimed ? "border-secondary/40" : "border-border"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
            locked ? "bg-muted text-muted-foreground" : "bg-primary/15 text-brand-dark"
          }`}
        >
          {locked ? <Lock className="size-4" /> : <Icon className="size-5" strokeWidth={2.1} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-black tracking-tight text-foreground">
              {incentive.title}
            </p>
            <span className="shrink-0 text-sm font-black tabular-nums text-brand-green">
              ₹{incentive.amount.toLocaleString("en-IN")}
            </span>
          </div>
          <p className="mt-0.5 text-[0.68rem] font-medium text-muted-foreground">{incentive.body}</p>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`animate-bar-grow h-full rounded-full ${claimed ? "bg-secondary" : "bg-primary"}`}
          style={{ width: `${pct}%`, animationDelay: `${delay}ms` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[0.62rem] font-bold text-muted-foreground">
        <span>
          {incentive.progress} / {incentive.target} · {incentive.window}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 uppercase tracking-widest ${
            claimed
              ? "bg-secondary/15 text-brand-green"
              : locked
                ? "bg-muted text-muted-foreground"
                : "bg-primary/15 text-brand-dark"
          }`}
        >
          {incentive.status}
        </span>
      </div>
    </div>
  );
}

export function IncentiveBoard({ incentives }: { incentives: RiderIncentive[] }) {
  const total = incentives
    .filter((item) => item.status !== "locked")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-3">
      <div className="card-soft animate-rise flex items-center justify-between border border-border p-4">
        <div>
          <p className="text-[0.64rem] font-bold uppercase tracking-widest text-muted-foreground">
            Bonus pool in play
          </p>
          <p className="mt-1 text-lg font-black tracking-tight text-foreground tabular-nums">
            ₹{total.toLocaleString("en-IN")}
          </p>
        </div>
        <span className="grid size-11 place-items-center rounded-2xl bg-secondary/15 text-brand-green">
          <Gift className="size-5" strokeWidth={2.2} />
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {incentives.map((incentive, index) => (
          <IncentiveCard key={incentive.id} incentive={incentive} delay={index * 55} />
        ))}
      </div>
    </div>
  );
}
