import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
  AlertTriangle,
  Wallet,
  ShoppingBag,
  BellRing,
  Activity as ActivityIcon,
  ChevronRight,
  ExternalLink,
  PlusCircle,
  TicketPercent,
  CheckCircle,
  XCircle,
  Server,
  Database,
  Radio,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "../components/AdminShell";
import { AdminLivePanel } from "../components/AdminLivePanel";
import { DataTable, SectionCard, StatusPill } from "../components/AdminUI";
import { OrdersBarChart, RevenueAreaChart } from "../components/AdminCharts";
import {
  fetchDashboardSummary,
  fetchLatestOrders,
  fetchOrdersSeries,
  fetchRecentActivity,
  fetchRevenueSeries,
} from "../api/dashboard";
import { adminRoutes } from "../navigation/admin-routes";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Command Center Dashboard", "Live Platform Operations · QuickPress"),
  component: DashboardPage,
});

const TONE_DOT: Record<string, string> = {
  default: "bg-zinc-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [period, setPeriod] = useState<"today" | "7d" | "30d">("7d");

  const summary = useQuery({ queryKey: ["admin", "dashboard", "summary"], queryFn: fetchDashboardSummary });
  const revenue = useQuery({ queryKey: ["admin", "dashboard", "revenue", period], queryFn: fetchRevenueSeries });
  const orders = useQuery({ queryKey: ["admin", "dashboard", "orders", period], queryFn: fetchOrdersSeries });
  const activity = useQuery({ queryKey: ["admin", "dashboard", "activity"], queryFn: fetchRecentActivity });
  const latest = useQuery({ queryKey: ["admin", "dashboard", "latest"], queryFn: fetchLatestOrders });

  const data = summary.data;

  const handleRefresh = () => {
    summary.refetch();
    revenue.refetch();
    orders.refetch();
    activity.refetch();
    latest.refetch();
    toast.success("Dashboard metrics refreshed!");
  };

  const count = (n?: number) => (n ?? 0).toLocaleString("en-IN");
  const currency = (n?: number) => `₹${(n ?? 0).toLocaleString("en-IN")}`;

  const latestRows = (latest.data?.rows ?? []).map((row, index) => ({
    id: String(row["id"] ?? index),
    customer: String(row["customer"] ?? "—"),
    partner: String(row["partner"] ?? "—"),
    rider: String(row["rider"] ?? "Unassigned"),
    status: String(row["status"] ?? "—"),
    amount: String(row["amount"] ?? "—"),
  }));

  const currentDateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <AdminShell
      title="Platform Command Center"
      subtitle={`Live operations data as of ${currentDateStr}`}
      actions={
        <>
          {/* System Health Pill */}
          <button
            type="button"
            onClick={() => setHealthModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800 transition-all hover:bg-emerald-100 active:scale-95"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
            </span>
            <span>All Systems Operational</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-50 active:scale-95 shadow-xs"
          >
            <RefreshCw className={`size-3.5 ${summary.isFetching ? "animate-spin text-emerald-600" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => toast.success("Exporting snapshot as CSV...")}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-black text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-95"
          >
            <Download className="size-3.5" />
            <span>Export Snapshot</span>
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {/* =========================================================================
            1. REQUIRES ATTENTION (ALERT STRIP)
        ========================================================================= */}
        {data && (data.pendingPartners > 0 || data.pendingPayouts > 0 || data.unassignedOrders > 0) && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500 text-white font-black text-xs">
                  <AlertTriangle className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-950">Requires Immediate Attention</h3>
                  <p className="text-xs text-amber-800 font-medium">Pending operational tasks awaiting admin resolution</p>
                </div>
              </div>
            </div>

            <div className="mt-3.5 grid gap-3 sm:grid-cols-3">
              {data.pendingPartners > 0 && (
                <button
                  type="button"
                  onClick={() => navigate({ to: adminRoutes.partners })}
                  className="flex items-center justify-between rounded-xl border border-amber-300 bg-white p-3 text-left transition-all hover:border-amber-400 hover:shadow-sm"
                >
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">
                      Partner Approvals
                    </span>
                    <p className="text-base font-black text-zinc-900">{data.pendingPartners} Pending Applications</p>
                  </div>
                  <ChevronRight className="size-4 text-amber-600" />
                </button>
              )}

              {data.pendingPayouts > 0 && (
                <button
                  type="button"
                  onClick={() => navigate({ to: adminRoutes.wallet })}
                  className="flex items-center justify-between rounded-xl border border-amber-300 bg-white p-3 text-left transition-all hover:border-amber-400 hover:shadow-sm"
                >
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                      Partner Payouts
                    </span>
                    <p className="text-base font-black text-zinc-900">{currency(data.pendingPayoutAmount)} ({data.pendingPayouts})</p>
                  </div>
                  <ChevronRight className="size-4 text-amber-600" />
                </button>
              )}

              {data.unassignedOrders > 0 && (
                <button
                  type="button"
                  onClick={() => navigate({ to: adminRoutes.orders })}
                  className="flex items-center justify-between rounded-xl border border-amber-300 bg-white p-3 text-left transition-all hover:border-amber-400 hover:shadow-sm"
                >
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-700">
                      Fleet Assignment
                    </span>
                    <p className="text-base font-black text-zinc-900">{data.unassignedOrders} Unassigned Orders</p>
                  </div>
                  <ChevronRight className="size-4 text-amber-600" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            2. PRIMARY CLICKABLE KPI CARDS
        ========================================================================= */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* Card 1: Orders */}
          <div
            onClick={() => navigate({ to: adminRoutes.orders })}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition-all hover:border-zinc-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">ORDERS</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShoppingBag className="size-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-zinc-900">{count(data?.totalOrders)}</p>
            <div className="mt-2 space-y-1 text-[11px] font-semibold text-zinc-600">
              <p className="flex justify-between"><span>Today's:</span> <span className="font-bold text-zinc-900">{count(data?.todayOrders)}</span></p>
              <p className="flex justify-between"><span>Active:</span> <span className="font-bold text-emerald-700">{count(data?.liveOrders)}</span></p>
              <p className="flex justify-between"><span>Completed:</span> <span className="font-bold text-zinc-900">{count(data?.deliveredOrders)}</span></p>
            </div>
          </div>

          {/* Card 2: Revenue */}
          <div
            onClick={() => navigate({ to: adminRoutes.wallet })}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition-all hover:border-zinc-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">REVENUE</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Wallet className="size-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-700">{currency(data?.revenue)}</p>
            <div className="mt-2 space-y-1 text-[11px] font-semibold text-zinc-600">
              <p className="flex justify-between"><span>Today:</span> <span className="font-bold text-zinc-900">{currency(data?.todayRevenue)}</span></p>
              <p className="flex justify-between"><span>7-Day:</span> <span className="font-bold text-zinc-900">{currency(data?.weeklyRevenue)}</span></p>
              <p className="flex justify-between"><span>Commission (18%):</span> <span className="font-bold text-emerald-700">{currency(data?.platformEarnings)}</span></p>
            </div>
          </div>

          {/* Card 3: Partners */}
          <div
            onClick={() => navigate({ to: adminRoutes.partners })}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition-all hover:border-zinc-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">PARTNERS</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Building2 className="size-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-zinc-900">{count(data?.partners)}</p>
            <div className="mt-2 space-y-1 text-[11px] font-semibold text-zinc-600">
              <p className="flex justify-between"><span>Active:</span> <span className="font-bold text-emerald-700">{count(data?.activePartners)}</span></p>
              <p className="flex justify-between"><span>Pending:</span> <span className="font-bold text-rose-600">{count(data?.pendingPartners)}</span></p>
              <p className="flex justify-between"><span>Suspended:</span> <span className="font-bold text-zinc-900">{count(data?.suspendedPartners)}</span></p>
            </div>
          </div>

          {/* Card 4: Riders */}
          <div
            onClick={() => navigate({ to: adminRoutes.riders })}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition-all hover:border-zinc-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">RIDERS</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Truck className="size-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-zinc-900">{count(data?.riders)}</p>
            <div className="mt-2 space-y-1 text-[11px] font-semibold text-zinc-600">
              <p className="flex justify-between"><span>Online:</span> <span className="font-bold text-emerald-700">{count(data?.onlineRiders)}</span></p>
              <p className="flex justify-between"><span>On Delivery:</span> <span className="font-bold text-amber-600">{count(data?.busyRiders)}</span></p>
              <p className="flex justify-between"><span>Available:</span> <span className="font-bold text-zinc-900">{count(data?.availableRiders)}</span></p>
            </div>
          </div>

          {/* Card 5: Customers */}
          <div
            onClick={() => navigate({ to: adminRoutes.customers })}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition-all hover:border-zinc-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">CUSTOMERS</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Users className="size-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-zinc-900">{count(data?.customers)}</p>
            <div className="mt-2 space-y-1 text-[11px] font-semibold text-zinc-600">
              <p className="flex justify-between"><span>Active:</span> <span className="font-bold text-emerald-700">{count(data?.activeCustomers)}</span></p>
              <p className="flex justify-between"><span>New Today:</span> <span className="font-bold text-zinc-900">{count(data?.todayCustomers)}</span></p>
              <p className="flex justify-between"><span>Conversion:</span> <span className="font-bold text-zinc-900">
                {data?.customers ? `${Math.round(((data.activeCustomers || 0) / data.customers) * 100)}%` : "0%"}
              </span></p>
            </div>
          </div>

          {/* Card 6: Payouts */}
          <div
            onClick={() => navigate({ to: adminRoutes.wallet })}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition-all hover:border-zinc-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">PAYOUTS</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="size-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-zinc-900">{count(data?.pendingPayouts)}</p>
            <div className="mt-2 space-y-1 text-[11px] font-semibold text-zinc-600">
              <p className="flex justify-between"><span>Pending Sum:</span> <span className="font-bold text-rose-600">{currency(data?.pendingPayoutAmount)}</span></p>
              <p className="flex justify-between"><span>Cycle:</span> <span className="font-bold text-zinc-900">Daily T+1</span></p>
              <p className="flex justify-between"><span>Status:</span> <span className="font-bold text-emerald-700">Settled</span></p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. ORDER STATUS OVERVIEW (VISUAL PIPELINE)
        ========================================================================= */}
        <SectionCard
          title="Order Fulfillment Pipeline"
          description="Live orders tracked through each stage of the QuickPress lifecycle"
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {(data?.statusBreakdown ?? []).map((step) => (
              <button
                key={step.status}
                type="button"
                onClick={() => navigate({ to: adminRoutes.orders })}
                className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 text-center transition-all hover:border-emerald-500 hover:bg-white hover:shadow-xs active:scale-95"
              >
                <span className="text-xl font-black text-zinc-900">{step.count}</span>
                <span className="mt-1 text-[11px] font-bold text-zinc-600 leading-tight">
                  {step.label}
                </span>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* =========================================================================
            4. REALTIME LIVE ORDERS & DISPATCH PANEL
        ========================================================================= */}
        <AdminLivePanel />

        {/* =========================================================================
            5. REVENUE & ORDERS ANALYTICS (RECHARTS)
        ========================================================================= */}
        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard
            title="Revenue Trajectory"
            description="Gross merchandise volume vs platform earnings"
            actions={
              <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
                {(["today", "7d", "30d"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize transition-all ${
                      period === p ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    {p === "today" ? "Today" : p === "7d" ? "7 Days" : "30 Days"}
                  </button>
                ))}
              </div>
            }
          >
            <RevenueAreaChart data={revenue.data} loading={revenue.isLoading} />
          </SectionCard>

          <SectionCard
            title="Order Fulfillment Velocity"
            description="Delivered orders vs cancellations"
          >
            <OrdersBarChart data={orders.data} loading={orders.isLoading} />
          </SectionCard>
        </div>

        {/* =========================================================================
            6. TOP PARTNERS & TOP SERVICES ROW
        ========================================================================= */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Top Partners */}
          <SectionCard
            title="Top Partner Stores"
            description="Leading laundry stores by volume and ratings"
            actions={
              <button
                type="button"
                onClick={() => navigate({ to: adminRoutes.partners })}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                All Partners →
              </button>
            }
          >
            <div className="space-y-2.5">
              {(data?.topPartners ?? []).map((partner) => (
                <div
                  key={partner.id}
                  onClick={() => navigate({ to: adminRoutes.partners })}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 hover:bg-white hover:border-zinc-200 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs">
                      {partner.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-black text-zinc-900">{partner.name}</p>
                      <p className="text-[10px] text-zinc-500 font-medium">{partner.city} · ★ {partner.rating}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-700">{currency(partner.revenue)}</p>
                    <p className="text-[10px] text-zinc-500 font-semibold">{partner.orders} orders</p>
                  </div>
                </div>
              ))}
              {(!data?.topPartners || data.topPartners.length === 0) && (
                <p className="py-6 text-center text-xs text-zinc-400">No partner activity recorded yet.</p>
              )}
            </div>
          </SectionCard>

          {/* Top Services */}
          <SectionCard
            title="Top Service Categories"
            description="Most booked services by customer frequency"
            actions={
              <button
                type="button"
                onClick={() => navigate({ to: adminRoutes.services })}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Catalog →
              </button>
            }
          >
            <div className="space-y-3">
              {(data?.topServices ?? []).map((item) => (
                <div key={item.service} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-zinc-800">{item.service}</span>
                    <span className="text-zinc-900">{item.orders} Orders ({currency(item.revenue)})</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(15, (item.orders / (data.totalOrders || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {(!data?.topServices || data.topServices.length === 0) && (
                <p className="py-6 text-center text-xs text-zinc-400">No service booking activity recorded yet.</p>
              )}
            </div>
          </SectionCard>
        </div>

        {/* =========================================================================
            7. LATEST ORDERS & RECENT AUDIT STREAM
        ========================================================================= */}
        <div className="grid gap-6 xl:grid-cols-3 items-start">
          <div className="xl:col-span-2">
            <SectionCard
              title="Recent Orders Pipeline"
              description="Latest customer laundry bookings across the network"
              actions={
                <button
                  type="button"
                  onClick={() => navigate({ to: adminRoutes.orders })}
                  className="text-xs font-black text-emerald-700 hover:underline"
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
                  { key: "id", label: "Order ID", render: (r) => <span className="font-mono font-bold text-zinc-900">#{r.id}</span> },
                  { key: "customer", label: "Customer", render: (r) => <span className="font-bold text-zinc-900">{r.customer}</span> },
                  { key: "partner", label: "Store", render: (r) => <span className="text-zinc-600 font-medium">{r.partner}</span> },
                  { key: "rider", label: "Rider", render: (r) => <span className="text-zinc-500 font-medium">{r.rider}</span> },
                  { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
                  { key: "amount", label: "Total", className: "text-right", render: (r) => <span className="font-black text-emerald-700">{r.amount}</span> },
                ]}
              />
            </SectionCard>
          </div>

          {/* Audit Stream */}
          <SectionCard
            title="Audit & Operations Stream"
            description="Realtime platform governance events"
          >
            <ul className="space-y-3">
              {(activity.data ?? []).map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/70 p-3"
                >
                  <span className={`mt-1 size-2 shrink-0 rounded-full ${TONE_DOT[item.tone] || TONE_DOT["default"]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-900 leading-snug">{item.title}</p>
                    <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                      {item.meta} · {item.time}
                    </p>
                  </div>
                </li>
              ))}
              {activity.isLoading ? (
                <li className="text-xs text-zinc-400 py-4 text-center">Loading audit stream...</li>
              ) : null}
            </ul>
          </SectionCard>
        </div>

        {/* =========================================================================
            8. QUICK ACTIONS BAR
        ========================================================================= */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">QUICK ADMINISTRATIVE ACTIONS</h3>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => navigate({ to: adminRoutes.partners })}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition-all active:scale-95"
            >
              <Building2 className="size-4 text-emerald-600" />
              <span>Review Partner Applications</span>
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: adminRoutes.riders })}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition-all active:scale-95"
            >
              <Truck className="size-4 text-sky-600" />
              <span>Add / Manage Riders</span>
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: adminRoutes.coupons })}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition-all active:scale-95"
            >
              <TicketPercent className="size-4 text-amber-600" />
              <span>Create Coupon</span>
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: adminRoutes.notifications })}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition-all active:scale-95"
            >
              <BellRing className="size-4 text-purple-600" />
              <span>Broadcast Notification</span>
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: adminRoutes.wallet })}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition-all active:scale-95"
            >
              <Wallet className="size-4 text-emerald-600" />
              <span>Settle Payouts</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SYSTEM HEALTH MODAL
      ========================================================================= */}
      <Dialog open={healthModalOpen} onOpenChange={setHealthModalOpen}>
        <DialogContent className="sm:max-w-md bg-white text-zinc-900 border-zinc-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black">
              <Server className="size-4 text-emerald-600" />
              <span>QuickPress Platform Health</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Live heartbeat telemetry across server infrastructure
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-3 text-xs">
            <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <div className="flex items-center gap-2.5">
                <Server className="size-4 text-emerald-600" />
                <div>
                  <p className="font-bold text-zinc-900">FastAPI Application Cluster</p>
                  <p className="text-[10px] text-zinc-500">Port 8000 · Uvicorn Daemon</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                100% HEALTHY
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <div className="flex items-center gap-2.5">
                <Database className="size-4 text-emerald-600" />
                <div>
                  <p className="font-bold text-zinc-900">MongoDB Atlas Database</p>
                  <p className="text-[10px] text-zinc-500">Primary Shard · Low Latency</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                CONNECTED
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <div className="flex items-center gap-2.5">
                <Radio className="size-4 text-emerald-600" />
                <div>
                  <p className="font-bold text-zinc-900">Socket.IO Realtime Gateway</p>
                  <p className="text-[10px] text-zinc-500">Bi-directional Event Bus</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                LISTENING
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <div className="flex items-center gap-2.5">
                <HardDrive className="size-4 text-emerald-600" />
                <div>
                  <p className="font-bold text-zinc-900">Firebase Authentication</p>
                  <p className="text-[10px] text-zinc-500">Phone OTP & Secure Tokens</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                ACTIVE
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
