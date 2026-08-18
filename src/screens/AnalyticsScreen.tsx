import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Download,
  IndianRupee,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@shared/ui/sonner";

import { PartnerTopBar } from "../components/PartnerTopBar";
import { PartnerBottomNav } from "../components/PartnerBottomNav";
import { PullToRefresh } from "../components/dashboard/PullToRefresh";
import { PartnerEmptyState, SectionHeading, StatCard } from "../components/PartnerPrimitives";
import {
  ChartCard,
  CustomerGrowthChart,
  OrdersBarChart,
  RevenueAreaChart,
  ServiceSplitChart,
} from "../components/analytics/AnalyticsCharts";
import { InsightCard } from "../components/analytics/InsightCard";
import { ThreadListSkeleton } from "../components/notifications/NotificationSkeletons";
import { OfflineBanner, useOnlineStatus } from "../components/notifications/OfflineBanner";
import { usePartnerResource } from "../hooks/use-partner-resource";
import { partnerRoutes } from "../navigation/partner-routes";
import {
  ANALYTICS_RANGES,
  fetchPartnerAnalytics,
  formatCompactInr,
  formatInr,
  type RangeId,
} from "../data/partner-analytics-mock";

/** Sprint 3.9 — Analytics & Reports (UI only, mock series, no backend). */
export function AnalyticsScreen() {
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const { data, setData } = usePartnerResource(fetchPartnerAnalytics);
  const [range, setRange] = useState<RangeId>("week");

  const handleRefresh = useCallback(async () => {
    const fresh = await fetchPartnerAnalytics();
    setData(fresh);
    toast.success("Analytics refreshed");
  }, [setData]);

  const trend = useMemo(() => {
    if (!data) return [];
    if (range === "month" || range === "last-month") return data.monthlyTrend;
    if (range === "custom") return data.weeklyTrend;
    return data.revenueTrend;
  }, [data, range]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md md:max-w-3xl lg:max-w-5xl">
        <PartnerTopBar
          title="Analytics & Reports"
          subtitle="Business performance at a glance"
          onBack={() => navigate({ to: partnerRoutes.dashboard })}
        />

        {!data ? (
          <div className="px-5 pb-32 pt-4">
            <ThreadListSkeleton rows={5} />
          </div>
        ) : (
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="animate-fade-in px-5 pb-32 pt-4">
              {online ? null : <OfflineBanner message="Showing the last synced analytics." />}

              <div
                role="tablist"
                aria-label="Date range"
                className="no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0"
              >
                {ANALYTICS_RANGES.map((item) => {
                  const isActive = range === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setRange(item.id)}
                      className={`min-h-9 shrink-0 rounded-full border px-3.5 text-[0.7rem] font-bold tracking-tight transition-all duration-300 active:scale-[0.96] ${
                        isActive
                          ? "border-brand-green bg-secondary/10 text-brand-green-dark"
                          : "border-border bg-card text-muted-foreground hover:border-primary/60"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard
                  icon={IndianRupee}
                  label="Today"
                  value={formatInr(data.kpis.todayRevenue)}
                  hint="+12% vs yesterday"
                />
                <StatCard
                  icon={IndianRupee}
                  label="This Month"
                  value={formatCompactInr(data.kpis.monthlyRevenue)}
                  hint="+9.4% growth"
                  tone="green"
                />
                <StatCard
                  icon={ShoppingBag}
                  label="Orders"
                  value={`${data.kpis.totalOrders}`}
                  hint={`${data.kpis.completedOrders} completed`}
                />
                <StatCard
                  icon={Users}
                  label="Customers"
                  value={`${data.kpis.activeCustomers}`}
                  hint={`${data.kpis.repeatCustomers} repeat`}
                  tone="muted"
                />
                <StatCard
                  icon={IndianRupee}
                  label="Avg Order Value"
                  value={formatInr(data.kpis.avgOrderValue)}
                />
                <StatCard
                  icon={Star}
                  label="Avg Rating"
                  value={`${data.kpis.avgRating}`}
                  tone="green"
                />
                <StatCard
                  icon={ShoppingBag}
                  label="Cancelled"
                  value={`${data.kpis.cancelledOrders}`}
                  tone="muted"
                />
                <StatCard
                  icon={IndianRupee}
                  label="Lifetime Earnings"
                  value={formatCompactInr(data.kpis.totalEarnings)}
                />
              </div>

              <div className="mt-6 space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                <ChartCard title="Revenue Trend" caption="Revenue across the selected range">
                  <RevenueAreaChart data={trend} />
                </ChartCard>
                <ChartCard title="Orders Volume" caption="Completed order count">
                  <OrdersBarChart data={trend} />
                </ChartCard>
                <ChartCard title="Service-wise Revenue" caption="Share of revenue per service">
                  <ServiceSplitChart data={data.services} />
                </ChartCard>
                <ChartCard title="Customer Growth" caption="Active vs repeat customers">
                  <CustomerGrowthChart data={data.customerGrowth} />
                </ChartCard>
              </div>

              <div className="mt-7">
                <SectionHeading title="Business Insights" />
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {data.insights.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              </div>

              <div className="mt-7">
                <SectionHeading title="Top Customers" />
                <div className="card-soft mt-4 divide-y divide-border border border-border">
                  {data.topCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold tracking-tight text-foreground">
                          {customer.name}
                        </p>
                        <p className="text-[0.7rem] font-medium text-muted-foreground">
                          {customer.orders} orders · Last {customer.lastOrder}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-black text-brand-green">
                        {formatInr(customer.spend)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-7">
                <SectionHeading title="Reports" />
                {data.reports.length === 0 ? (
                  <PartnerEmptyState
                    icon={BarChart3}
                    title="No reports yet"
                    body="Daily, weekly, monthly and yearly reports will appear here."
                  />
                ) : (
                  <div className="mt-4 space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                    {data.reports.map((report) => (
                      <article
                        key={report.id}
                        className="card-soft animate-slide-up border border-border p-4"
                      >
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold tracking-tight text-foreground">
                              {report.title}
                            </p>
                            <p className="text-[0.7rem] font-medium text-muted-foreground">
                              {report.date} · {report.service} · {report.customer}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-wider text-muted-foreground">
                            {report.period}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <p className="text-sm font-black text-foreground">
                            {formatInr(report.revenue)}
                          </p>
                          <p className="text-[0.7rem] font-semibold text-muted-foreground">
                            {report.orders} orders
                          </p>
                          <div className="ml-auto flex items-center gap-2">
                            {(["PDF", "Excel"] as const).map((format) => (
                              <button
                                key={format}
                                type="button"
                                onClick={() =>
                                  toast.success(`${format} export queued`, {
                                    description: "Download will be available once backend is live.",
                                  })
                                }
                                className="ripple inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[0.68rem] font-bold text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.96]"
                              >
                                <Download className="size-3.5" />
                                {format}
                              </button>
                            ))}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PullToRefresh>
        )}

        <PartnerBottomNav active="dashboard" />
      </div>
      <Toaster />
    </main>
  );
}