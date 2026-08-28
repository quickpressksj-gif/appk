import { CheckCircle2, IndianRupee, ShoppingBag, Star, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { ShopStatistics } from "../../data/partner-shop-mock";

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  delay,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  delay: number;
  tone?: "primary" | "green";
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="animate-rise card-soft border border-border p-4 transition-all duration-300 hover:border-primary/60"
    >
      <span
        className={`flex size-9 items-center justify-center rounded-2xl ${
          tone === "green" ? "bg-secondary/15 text-brand-green-dark" : "bg-primary/15 text-brand-dark"
        }`}
      >
        <Icon className="size-4" strokeWidth={2.2} />
      </span>
      <p className="mt-3 text-lg font-black tracking-tight text-foreground">{value}</p>
      <p className="text-[0.66rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[0.66rem] font-medium text-brand-green">{hint}</p>
    </div>
  );
}

/** Premium statistics grid — 2 columns on mobile, 3 on tablet, 5 on desktop. */
export function ShopStatsGrid({ stats }: { stats: ShopStatistics }) {
  const completionRate =
    stats.totalOrders > 0
      ? Math.min(100, Math.round((stats.completedOrders / stats.totalOrders) * 100))
      : 100;

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      <StatTile
        icon={ShoppingBag}
        label="Total Orders"
        value={stats.totalOrders.toLocaleString("en-IN")}
        hint="Lifetime Orders"
        delay={0}
      />
      <StatTile
        icon={CheckCircle2}
        label="Completed"
        value={stats.completedOrders.toLocaleString("en-IN")}
        hint={`${completionRate}% completion rate`}
        delay={60}
        tone="green"
      />
      <StatTile
        icon={Users}
        label="Active Customers"
        value={stats.activeCustomers.toLocaleString("en-IN")}
        hint="Verified Customers"
        delay={120}
      />
      <StatTile
        icon={Star}
        label="Average Rating"
        value={stats.averageRating.toFixed(1)}
        hint="Customer Feedback"
        delay={180}
        tone="green"
      />
      <StatTile
        icon={IndianRupee}
        label="Revenue"
        value={`₹${stats.revenue.toLocaleString("en-IN")}`}
        hint="Total Settled Revenue"
        delay={240}
      />
    </div>
  );
}
