import { BarChart3, CheckCircle2, PackageCheck, TrendingUp, Wallet } from "lucide-react";

import { SectionHeading, PartnerEmptyState } from "../PartnerPrimitives";
import { formatInr, type EarningsAnalytics } from "../../data/partner-wallet-mock";
import { WalletMoneyTile } from "./WalletStatsGrid";

/** Sprint 3.6 — premium earnings analytics cards + 7-day trend. */
export function EarningsAnalyticsSection({ analytics }: { analytics: EarningsAnalytics }) {
  const peak = analytics.trend.length
    ? Math.max(...analytics.trend.map((point) => point.amount), 1)
    : 1;

  return (
    <section className="mt-7">
      <SectionHeading title="Earnings Analytics" />

      {analytics.totalOrders === 0 ? (
        <PartnerEmptyState
          icon={BarChart3}
          title="No earnings yet"
          body="Complete your first order to unlock revenue analytics."
        />
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <WalletMoneyTile
              icon={TrendingUp}
              label="Today's Revenue"
              value={analytics.todayRevenue}
              delay={0}
            />
            <WalletMoneyTile
              icon={BarChart3}
              label="Weekly Revenue"
              value={analytics.weekRevenue}
              tone="green"
              delay={45}
            />
            <WalletMoneyTile
              icon={Wallet}
              label="Monthly Revenue"
              value={analytics.monthRevenue}
              delay={90}
            />
            <WalletMoneyTile
              icon={TrendingUp}
              label="Avg Order Value"
              value={analytics.avgOrderValue}
              tone="muted"
              delay={135}
            />
            <WalletMoneyTile
              icon={PackageCheck}
              label="Total Orders"
              value={analytics.totalOrders}
              suffix=""
              delay={180}
            />
            <WalletMoneyTile
              icon={CheckCircle2}
              label="Completed Orders"
              value={analytics.completedOrders}
              suffix=""
              tone="green"
              delay={225}
            />
          </div>

          <div className="card-soft mt-4 border border-border p-4">
            <SectionHeading
              title="Last 7 Days"
              action={
                <span className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground">
                  Peak {formatInr(peak)}
                </span>
              }
            />
            <div className="mt-5 flex items-end justify-between gap-2">
              {analytics.trend.map((point) => (
                <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-28 w-full items-end justify-center">
                    <div
                      style={{ height: `${Math.round((point.amount / peak) * 100)}%` }}
                      className="w-full rounded-t-xl bg-primary/80 transition-all duration-700"
                    />
                  </div>
                  <span className="text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
                    {point.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
