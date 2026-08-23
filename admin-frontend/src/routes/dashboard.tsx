import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Building2,
  Truck,
  Users,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "../components/AdminShell";
import { AdminLivePanel } from "../components/AdminLivePanel";
import { DataTable, KpiGrid, SectionCard, StatusPill } from "../components/AdminUI";
import { OrdersBarChart, RevenueAreaChart } from "../components/AdminCharts";
import {
  fetchDashboardKpis,
  fetchLatestOrders,
  fetchOrdersSeries,
  fetchRecentActivity,
  fetchRevenueSeries,
} from "../api/dashboard";
import { adminRoutes } from "../navigation/admin-routes";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Operations Dashboard", "Live QuickPress Command Center"),
  component: DashboardPage,
});

const TONE_DOT: Record<string, string> = {
  default: "bg-zinc-500",
  success: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
  warning: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
  danger: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]",
};

function DashboardPage() {
  const navigate = useNavigate();
  const kpis = useQuery({ queryKey: ["admin", "dashboard", "kpis"], queryFn: fetchDashboardKpis });
  const revenue = useQuery({ queryKey: ["admin", "dashboard", "revenue"], queryFn: fetchRevenueSeries });
  const orders = useQuery({ queryKey: ["admin", "dashboard", "orders"], queryFn: fetchOrdersSeries });
  const activity = useQuery({ queryKey: ["admin", "dashboard", "activity"], queryFn: fetchRecentActivity });
  const latest = useQuery({ queryKey: ["admin", "dashboard", "latest"], queryFn: fetchLatestOrders });

  const handleRefresh = () => {
    kpis.refetch();
    revenue.refetch();
    orders.refetch();
    activity.refetch();
    latest.refetch();
    toast.success("Dashboard metrics refreshed!");
  };

  const latestRows = (latest.data?.rows ?? []).map((row, index) => ({
    id: String(row["id"] ?? index),
    customer: String(row["customer"] ?? "—"),
    partner: String(row["partner"] ?? "—"),
    status: String(row["status"] ?? "—"),
    amount: String(row["amount"] ?? "—"),
  }));

  return (
    <AdminShell
      title="Operations Dashboard"
      subtitle="Live platform metrics across orders, partner stores, riders and finances."
      actions={
        <>
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-bold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white active:scale-95"
          >
            <RefreshCw className={`size-3.5 ${kpis.isFetching ? "animate-spin text-emerald-400" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => toast.success("Exporting snapshot as PDF/CSV...")}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-95"
          >
            <Download className="size-3.5" />
            <span>Export Snapshot</span>
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Top Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 size-64 rounded-full bg-amber-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3 py-1 text-[11px] font-black text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>COMMAND CENTER · LIVE GOVERNANCE</span>
              </div>
              <h2 className="mt-3 text-xl sm:text-2xl font-black text-white tracking-tight">
                Welcome back, Super Admin 👋
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-medium">
                Monitor incoming laundry orders, approve pending partner stores, and track platform revenue.
              </p>
            </div>

            {/* Quick Navigation Action Chips */}
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => navigate({ to: adminRoutes.partners })}
                className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 py-2.5 text-xs font-black text-zinc-200 hover:border-emerald-500/50 hover:bg-zinc-800 transition-all active:scale-95"
              >
                <Building2 className="size-4 text-emerald-400" />
                <span>Review Partners</span>
                <ArrowRight className="size-3 text-zinc-500" />
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: adminRoutes.orders })}
                className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 py-2.5 text-xs font-black text-zinc-200 hover:border-amber-500/50 hover:bg-zinc-800 transition-all active:scale-95"
              >
                <Clock className="size-4 text-amber-400" />
                <span>Live Orders</span>
                <ArrowRight className="size-3 text-zinc-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Realtime Live Dispatch & Alerts Feed */}
        <AdminLivePanel />

        {/* Dynamic Metric Cards */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              PLATFORM METRICS & GROWTH
            </h3>
            <span className="text-[11px] font-bold text-zinc-500">Live Database Counters</span>
          </div>
          <KpiGrid kpis={kpis.data} loading={kpis.isLoading} />
        </div>

        {/* Interactive Charts Row */}
        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard
            title="Gross Revenue Trajectory"
            description="Total customer payments volume (7-day trend)"
          >
            <RevenueAreaChart data={revenue.data} loading={revenue.isLoading} />
          </SectionCard>

          <SectionCard
            title="Order Fulfillment Velocity"
            description="Completed pickups vs cancellations"
          >
            <OrdersBarChart data={orders.data} loading={orders.isLoading} />
          </SectionCard>
        </div>

        {/* Bottom Details Grid */}
        <div className="grid gap-6 xl:grid-cols-3 items-start">
          <div className="xl:col-span-2">
            <SectionCard
              title="Recent Orders Pipeline"
              description="Latest customer laundry bookings across the network"
              actions={
                <button
                  type="button"
                  onClick={() => navigate({ to: adminRoutes.orders })}
                  className="text-xs font-black text-emerald-400 hover:underline"
                >
                  View All Orders →
                </button>
              }
            >
              <DataTable
                loading={latest.isLoading}
                rows={latestRows}
                onRowClick={(r) => navigate({ to: adminRoutes.orders })}
                columns={[
                  { key: "id", label: "Order ID", render: (r) => <span className="font-mono font-black text-zinc-200">#{r.id}</span> },
                  { key: "customer", label: "Customer", render: (r) => <span className="font-bold text-white">{r.customer}</span> },
                  { key: "partner", label: "Store", render: (r) => <span className="text-zinc-300 font-medium">{r.partner}</span> },
                  { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
                  { key: "amount", label: "Total", className: "text-right", render: (r) => <span className="font-black text-emerald-400">{r.amount}</span> },
                ]}
              />
            </SectionCard>
          </div>

          {/* Audit Stream */}
          <SectionCard
            title="Audit & Operations Stream"
            description="Realtime platform governance events"
          >
            <ul className="space-y-3.5">
              {(activity.data ?? []).map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-3"
                >
                  <span className={`mt-1 size-2 shrink-0 rounded-full ${TONE_DOT[item.tone] || TONE_DOT["default"]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-zinc-200 leading-snug">{item.title}</p>
                    <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                      {item.meta} · {item.time}
                    </p>
                  </div>
                </li>
              ))}
              {activity.isLoading ? (
                <li className="text-xs text-zinc-500 py-4 text-center">Loading audit stream...</li>
              ) : null}
            </ul>
          </SectionCard>
        </div>
      </div>
    </AdminShell>
  );
}
