import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { useCountUp } from "../../hooks/use-count-up";

const TONE_CLASS: Record<"primary" | "green" | "muted" | "amber", string> = {
  primary: "bg-slate-100 text-slate-900",
  green: "bg-emerald-50 text-emerald-600",
  muted: "bg-slate-100 text-slate-600",
  amber: "bg-amber-50 text-amber-700",
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
      className="animate-rise rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={`flex size-8 items-center justify-center rounded-xl ${TONE_CLASS[tone]}`}>
        <Icon className="size-4" strokeWidth={2.3} />
      </span>
      <p className="mt-2.5 text-lg font-black tracking-tight text-slate-900 sm:text-xl">
        {prefix}
        {animated.toLocaleString("en-IN", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
        {suffix}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      {hint ? <p className="mt-1 text-[10px] font-semibold text-emerald-600">{hint}</p> : null}
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
    <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Icon className="size-4" />
      </span>
      <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-600">{label}</p>
      <p
        className={`shrink-0 text-sm font-black tracking-tight ${
          accent ? "text-emerald-600" : "text-slate-900"
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
      className="h-1.5 overflow-hidden rounded-full bg-slate-100"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all duration-700 ${
          tone === "green" ? "bg-emerald-500" : "bg-slate-900"
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
      className="flex min-h-11 flex-1 flex-col items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white px-2 py-3 text-center shadow-sm transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.95]"
    >
      <span className="flex size-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
        <Icon className="size-4" strokeWidth={2.2} />
      </span>
      <span className="text-[11px] font-black tracking-tight text-slate-900">{label}</span>
    </button>
  );
}

export function WalletPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </section>
  );
}