import { useNavigate } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  CheckCircle2,
  IndianRupee,
  ListOrdered,
  Loader2,
  Package,
  Sparkles,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { useCountUp } from "../../hooks/use-count-up";
import { partnerRoutes } from "../../navigation/partner-routes";
import {
  orderStatusFlow,
  revenueBreakdown,
  type DashboardShop,
  type DashboardSummaryCard,
  type QuickStat,
  type RevenueRange,
} from "../../data/partner-dashboard-mock";

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

/* ------------------------------------------------------------------ Welcome */

export function WelcomeCard({
  shop,
  summary,
}: {
  shop: DashboardShop;
  summary: DashboardSummaryCard;
}) {
  const totalOrders = useCountUp(summary.totalOrders);
  const revenue = useCountUp(summary.revenue);
  const earnings = useCountUp(summary.earnings);
  const active = useCountUp(summary.activeOrders);

  return (
    <section className="animate-rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand-dark to-brand-green p-5 shadow-soft md:p-7">
      <div className="pointer-events-none absolute -right-12 -top-14 size-48 rounded-full bg-primary/25 blur-2xl" />
      <div className="relative">
        <p className="text-[0.68rem] font-semibold uppercase tracking-widest text-background/70">
          {greeting()},
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-background md:text-3xl">
          {shop.partnerName}
        </h2>
        <p className="mt-1 text-[0.72rem] font-semibold text-background/70">Today's Summary</p>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryTile label="Total Orders" value={`${totalOrders}`} />
          <SummaryTile label="Revenue" value={inr(revenue)} />
          <SummaryTile label="Earnings" value={inr(earnings)} />
          <SummaryTile label="Active Orders" value={`${active}`} />
        </div>
      </div>
    </section>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-background/12 p-3 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5">
      <p className="text-[0.62rem] font-bold uppercase tracking-wider text-background/65">
        {label}
      </p>
      <p className="mt-1 truncate text-lg font-black tracking-tight text-background">{value}</p>
    </div>
  );
}

/* -------------------------------------------------------------- Quick stats */

const STAT_ICON = {
  new: ListOrdered,
  processing: Loader2,
  ready: Package,
  completed: CheckCircle2,
  cancelled: XCircle,
} as const;

const STAT_TONE: Record<QuickStat["tone"], string> = {
  primary: "bg-primary/15 text-brand-dark",
  green: "bg-secondary/10 text-brand-green",
  muted: "bg-muted text-muted-foreground",
  danger: "bg-destructive/10 text-destructive",
};

export function QuickStatsGrid({ stats }: { stats: QuickStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat, index) => (
        <QuickStatCard key={stat.id} stat={stat} delay={index * 60} />
      ))}
    </div>
  );
}

function QuickStatCard({ stat, delay }: { stat: QuickStat; delay: number }) {
  const value = useCountUp(stat.value, 700 + delay);
  const Icon = STAT_ICON[stat.id as keyof typeof STAT_ICON] ?? ListOrdered;

  return (
    <div
      className="card-soft animate-rise border border-border p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        className={`flex size-9 items-center justify-center rounded-2xl ${STAT_TONE[stat.tone]}`}
      >
        <Icon className="size-4" strokeWidth={2.2} />
      </span>
      <p className="mt-3 text-2xl font-black tracking-tight text-foreground">{value}</p>
      <p className="text-[0.66rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {stat.label}
      </p>
    </div>
  );
}

/* ----------------------------------------------------------------- Revenue */

const RANGE_LABEL: Record<RevenueRange, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This Week",
};

export function RevenueCard() {
  const [range, setRange] = useState<RevenueRange>("today");
  const active = revenueBreakdown[range];
  const amount = useCountUp(active.amount, 800);
  const positive = active.deltaPct >= 0;

  return (
    <section className="card-soft animate-rise border border-border p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
            <IndianRupee className="size-4" strokeWidth={2.3} />
          </span>
          <h3 className="truncate text-sm font-black tracking-tight text-foreground">Revenue</h3>
        </div>
        <div className="flex max-w-full shrink-0 gap-1 overflow-x-auto rounded-full bg-muted p-1">
          {(Object.keys(revenueBreakdown) as RevenueRange[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`rounded-full px-3 py-1.5 text-[0.64rem] font-bold tracking-tight transition-all duration-300 ${
                range === key
                  ? "bg-background text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {RANGE_LABEL[key]}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-5 text-3xl font-black sm:text-4xl tracking-tight text-foreground">{inr(amount)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-[0.66rem] font-bold ${
            positive ? "bg-secondary/10 text-brand-green" : "bg-destructive/10 text-destructive"
          }`}
        >
          {positive ? (
            <ArrowUpRight className="size-3.5" />
          ) : (
            <ArrowDownRight className="size-3.5" />
          )}
          {Math.abs(active.deltaPct)}%
        </span>
        <span className="text-[0.7rem] font-semibold text-muted-foreground">
          {active.orders} orders · {RANGE_LABEL[range]}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        {(Object.keys(revenueBreakdown) as RevenueRange[]).map((key) => (
          <div key={key} className="rounded-2xl bg-muted/60 p-3">
            <p className="text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
              {RANGE_LABEL[key]}
            </p>
            <p className="mt-1 truncate text-[0.8rem] font-black sm:text-sm tracking-tight text-foreground">
              {inr(revenueBreakdown[key].amount)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- Status chips */

export function OrderStatusChips({ active = "Pickup" }: { active?: string }) {
  const activeIndex = orderStatusFlow.indexOf(active as (typeof orderStatusFlow)[number]);

  return (
    <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
      {orderStatusFlow.map((status, index) => {
        const done = index < activeIndex;
        const isActive = index === activeIndex;
        return (
          <span
            key={status}
            className={`animate-rise flex shrink-0 snap-start items-center gap-1.5 rounded-full px-3 py-2 text-[0.68rem] font-bold tracking-tight transition-all duration-300 ${
              isActive
                ? "bg-brand-dark text-background shadow-soft"
                : done
                  ? "bg-secondary/10 text-brand-green"
                  : "bg-muted text-muted-foreground"
            }`}
            style={{ animationDelay: `${index * 45}ms` }}
          >
            {done ? <CheckCircle2 className="size-3.5" /> : null}
            {status}
          </span>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------- Quick actions */

const QUICK_ACTIONS = [
  { id: "services", label: "Manage Services", icon: Sparkles, to: partnerRoutes.services },
  { id: "profile", label: "Shop Profile", icon: Building2, to: partnerRoutes.profile },
  { id: "wallet", label: "Wallet", icon: Wallet, to: partnerRoutes.wallet },
  { id: "analytics", label: "Analytics", icon: BarChart3, to: partnerRoutes.earnings },
  { id: "customers", label: "Customers", icon: Users, to: partnerRoutes.orders },
  { id: "reports", label: "Reports", icon: ListOrdered, to: partnerRoutes.earnings },
] as const;

export function QuickActionsGrid() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {QUICK_ACTIONS.map((action, index) => (
        <button
          key={action.id}
          type="button"
          onClick={() => navigate({ to: action.to })}
          className="card-soft ripple animate-rise flex flex-col items-center gap-2 border border-border px-2 py-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 active:scale-[0.96]"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
            <action.icon className="size-[1.1rem]" strokeWidth={2.2} />
          </span>
          <span className="text-center text-[0.64rem] font-bold leading-tight tracking-tight text-foreground">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}
