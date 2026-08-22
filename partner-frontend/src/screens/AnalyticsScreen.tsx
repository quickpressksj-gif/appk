import { useEffect, useState } from "react";
import {
  BarChart3,
  Calendar,
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { PartnerLayout } from "../components/layout/PartnerLayout";
import {
  fetchPartnerAnalytics,
  type PartnerAnalyticsData,
} from "../api/partner/partner-analytics-api";

export function AnalyticsScreen() {
  const [period, setPeriod] = useState<string>("7d");
  const [data, setData] = useState<PartnerAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async (selectedPeriod: string) => {
    setIsLoading(true);
    try {
      const res = await fetchPartnerAnalytics(selectedPeriod);
      setData(res);
    } catch {
      toast.error("Failed to load store analytics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load(period);
  }, [period]);

  const maxOrder = Math.max(...(data?.ordersTrend || [1]), 1);
  const maxRevenue = Math.max(...(data?.revenueTrend || [1]), 1);

  return (
    <PartnerLayout
      activeTab="earnings"
      title="Analytics & Growth"
      subtitle="Track your laundry business growth, revenue trends and top performing services"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
        {/* Period Filter Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-card p-1 shadow-sm">
            {[
              { id: "today", label: "Today" },
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "all", label: "All Time" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                  period === p.id
                    ? "bg-primary text-brand-dark shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-2 text-xs font-bold text-muted-foreground md:flex">
            <Calendar className="size-4" />
            <span>Updated live from order database</span>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/20 text-brand-dark">
                <Package className="size-5" />
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Orders
            </p>
            <p className="text-2xl font-black text-foreground">{data?.totalOrders ?? 0}</p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600">
                <DollarSign className="size-5" />
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Gross
              </span>
            </div>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Revenue
            </p>
            <p className="text-2xl font-black text-foreground">₹{data?.totalRevenue ?? 0}</p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600">
                <TrendingUp className="size-5" />
              </span>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                Net 80%
              </span>
            </div>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Store Earnings
            </p>
            <p className="text-2xl font-black text-foreground">₹{data?.totalEarnings ?? 0}</p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-600">
                <Users className="size-5" />
              </span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full">
                Reach
              </span>
            </div>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Customers
            </p>
            <p className="text-2xl font-black text-foreground">{data?.totalCustomers ?? 0}</p>
          </div>
        </div>

        {/* Charts & Top Services Grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Daily Orders Trend Chart */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-foreground">Orders Trend</h3>
                <p className="text-xs text-muted-foreground">Order volume distribution</p>
              </div>
              <BarChart3 className="size-5 text-muted-foreground" />
            </div>

            <div className="mt-6 flex h-48 items-end gap-3 pt-6 border-b border-border/70 pb-2">
              {(data?.trendLabels || []).map((label, idx) => {
                const count = data?.ordersTrend?.[idx] ?? 0;
                const heightPercent = Math.max(12, Math.round((count / maxOrder) * 100));
                return (
                  <div key={label + idx} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] font-bold text-foreground">{count}</span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[32px] rounded-t-xl bg-gradient-to-t from-primary/80 to-primary transition-all duration-500 hover:brightness-110"
                    />
                    <span className="text-[9px] font-semibold text-muted-foreground truncate max-w-full">
                      {label.slice(5) || label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-foreground">Revenue Trend</h3>
                <p className="text-xs text-muted-foreground">Daily gross order value in ₹</p>
              </div>
              <DollarSign className="size-5 text-muted-foreground" />
            </div>

            <div className="mt-6 flex h-48 items-end gap-3 pt-6 border-b border-border/70 pb-2">
              {(data?.trendLabels || []).map((label, idx) => {
                const amount = data?.revenueTrend?.[idx] ?? 0;
                const heightPercent = Math.max(12, Math.round((amount / maxRevenue) * 100));
                return (
                  <div key={label + idx} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] font-bold text-foreground">₹{amount}</span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[32px] rounded-t-xl bg-gradient-to-t from-emerald-600/80 to-emerald-500 transition-all duration-500 hover:brightness-110"
                    />
                    <span className="text-[9px] font-semibold text-muted-foreground truncate max-w-full">
                      {label.slice(5) || label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Services Ranking */}
        <div className="mt-8 rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-foreground">Top Services</h3>
              <p className="text-xs text-muted-foreground">Most popular services booked by customers</p>
            </div>
            <ShoppingBag className="size-5 text-muted-foreground" />
          </div>

          <div className="mt-6 space-y-3">
            {(!data?.topServices || data.topServices.length === 0) ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No service bookings recorded yet in this period.
              </p>
            ) : (
              data.topServices.map((svc, i) => (
                <div
                  key={svc.name}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 p-4 transition-colors hover:bg-muted/60"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-primary/20 text-xs font-black text-brand-dark">
                      #{i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground">{svc.name}</p>
                      <p className="text-[10px] text-muted-foreground">{svc.count} items ordered</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-foreground">₹{svc.revenue}</p>
                    <p className="text-[10px] text-muted-foreground">Gross sales</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PartnerLayout>
  );
}
