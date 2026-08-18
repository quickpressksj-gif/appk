import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { useCountUp } from "../../hooks/use-count-up";

const TONE_CLASS: Record<"primary" | "green" | "muted" | "amber", string> = {
  primary: "bg-primary/15 text-brand-dark",
  green: "bg-secondary/10 text-brand-green",
  muted: "bg-muted text-muted-foreground",
  amber: "bg-primary/25 text-brand-dark",
};

/** Animated KPI tile used by the wallet, earnings and performance screens. */
export function CounterCard({
  icon: Icon,
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  hint,
  tone = "primary",
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  hint?: string;
  tone?: "primary" | "green" | "muted" | "amber";
  delay?: number;
}) {
  const animated = useCountUp(value, 950, decimals);

  return (
    <div
      className="card-soft animate-rise border border-border p-4 transition-all duration-300 hover:border-primary/60"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={`flex size-9 items-center justify-center rounded-2xl ${TONE_CLASS[tone]}`}>
        <Icon className="size-4" strokeWidth={2.2} />
      </span>
      <p className="mt-3 text-lg font-black tracking-tight text-foreground sm:text-xl">
        {prefix}
        {animated.toLocaleString("en-IN", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
        {suffix}
      </p>
      <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {hint ? <p className="mt-1 text-[0.68rem] font-medium text-brand-green">{hint}</p> : null}
    </div>
  );
}

/** Small labelled row used inside summary and detail panels. */
export function SummaryRow({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <p className="min-w-0 flex-1 truncate text-xs font-semibold text-muted-foreground">{label}</p>
      <p
        className={`shrink-0 text-sm font-black tracking-tight ${
          accent ? "text-brand-green" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function ProgressBar({ value, tone = "primary" }: { value: number; tone?: "primary" | "green" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all duration-700 ${
          tone === "green" ? "bg-secondary" : "bg-primary"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function QuickActionTile({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card-soft flex min-h-11 flex-1 flex-col items-center gap-2 border border-border px-2 py-3 text-center transition-all duration-300 hover:border-primary/60 active:scale-[0.97]"
    >
      <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
        <Icon className="size-4" strokeWidth={2.2} />
      </span>
      <span className="text-[0.66rem] font-black tracking-tight text-foreground">{label}</span>
    </button>
  );
}

export function WalletPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card-soft border border-border p-4 ${className}`}>{children}</section>;
}