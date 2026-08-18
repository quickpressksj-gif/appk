import {
  BadgeIndianRupee,
  CalendarDays,
  CalendarRange,
  Clock3,
  Landmark,
  Sparkles,
} from "lucide-react";

import { useCountUp } from "../../hooks/use-count-up";
import { formatInr, type WalletSummary } from "../../data/partner-wallet-mock";

const TILES = [
  { key: "today", label: "Today's Earnings", icon: CalendarDays, tone: "primary" },
  { key: "week", label: "Weekly Earnings", icon: CalendarRange, tone: "green" },
  { key: "month", label: "Monthly Earnings", icon: Sparkles, tone: "primary" },
  { key: "pendingSettlement", label: "Pending Settlement", icon: Clock3, tone: "muted" },
  { key: "lifetime", label: "Lifetime Earnings", icon: Landmark, tone: "green" },
  { key: "balance", label: "Wallet Balance", icon: BadgeIndianRupee, tone: "primary" },
] as const;

const TONES: Record<string, string> = {
  primary: "bg-primary/15 text-brand-dark",
  green: "bg-secondary/10 text-brand-green",
  muted: "bg-muted text-muted-foreground",
};

/** Sprint 3.6 — animated money tile with counter animation. */
export function WalletMoneyTile({
  icon: Icon,
  label,
  value,
  tone = "primary",
  delay = 0,
  suffix,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: number;
  tone?: "primary" | "green" | "muted";
  delay?: number;
  suffix?: string;
}) {
  const display = useCountUp(value);

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="animate-slide-up card-soft border border-border p-4 transition-all duration-300 hover:border-primary/60"
    >
      <span className={`flex size-9 items-center justify-center rounded-2xl ${TONES[tone]}`}>
        <Icon className="size-4" strokeWidth={2.2} />
      </span>
      <p className="mt-3 truncate text-lg font-black tracking-tight text-foreground">
        {suffix ? `${display.toLocaleString("en-IN")}${suffix}` : formatInr(display)}
      </p>
      <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

/** Wallet dashboard grid — balance, today/week/month, pending, lifetime. */
export function WalletStatsGrid({ summary }: { summary: WalletSummary }) {
  return (
    <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {TILES.map((tile, index) => (
        <WalletMoneyTile
          key={tile.key}
          icon={tile.icon}
          label={tile.label}
          value={summary[tile.key]}
          tone={tile.tone}
          delay={index * 45}
        />
      ))}
    </section>
  );
}
