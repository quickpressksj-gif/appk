import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";

import { Button } from "@/shared/ui/button";
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
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Dashboard", "Live QuickPress operations: orders, revenue, fleet and growth."),
  component: DashboardPage,
});

const TONE_DOT: Record<string, string> = {
  default: "bg-muted-foreground",
  success: "bg-secondary",
  warning: "bg-primary",
  danger: "bg-destructive",
};

function DashboardPage() {
  const kpis = useQuery({ queryKey: ["admin", "dashboard", "kpis"], queryFn: fetchDashboardKpis });
  const revenue = useQuery({ queryKey: ["admin", "dashboard", "revenue"], queryFn: fetchRevenueSeries });
  const orders = useQuery({ queryKey: ["admin", "dashboard", "orders"], queryFn: fetchOrdersSeries });
  const activity = useQuery({ queryKey: ["admin", "dashboard", "activity"], queryFn: fetchRecentActivity });
  const latest = useQuery({ queryKey: ["admin", "dashboard", "latest"], queryFn: fetchLatestOrders });

  const latestRows = (latest.data?.rows ?? []).map((row, index) => ({
    id: String(row["id"] ?? index),
    customer: String(row["customer"] ?? "—"),
    partner: String(row["partner"] ?? "—"),
    status: String(row["status"] ?? "—"),
    amount: String(row["amount"] ?? "—"),
  }));

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Live QuickPress operations across every city."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => kpis.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" /> Export snapshot
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Sprint 5.5 — realtime operations feed (Socket.IO). */}
        <AdminLivePanel />
        <KpiGrid kpis={kpis.data} loading={kpis.isLoading} />

        <div className="grid gap-4 xl:grid-cols-2">
          <SectionCard title="Revenue" description="Gross volume this week vs last week">
            <RevenueAreaChart data={revenue.data} loading={revenue.isLoading} />
          </SectionCard>
          <SectionCard title="Orders" description="Completed orders vs cancellations">
            <OrdersBarChart data={orders.data} loading={orders.isLoading} />
          </SectionCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SectionCard title="Latest orders" description="Most recent activity across the network">
              <DataTable
                loading={latest.isLoading}
                rows={latestRows}
                columns={[
                  { key: "id", label: "Order" },
                  { key: "customer", label: "Customer" },
                  { key: "partner", label: "Partner" },
                  { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
                  { key: "amount", label: "Amount", className: "text-right" },
                ]}
              />
            </SectionCard>
          </div>

          <SectionCard title="Recent activities" description="Audit stream">
            <ul className="space-y-4">
              {(activity.data ?? []).map((item) => (
                <li key={item.id} className="flex gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE_DOT[item.tone]}`} />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.meta} · {item.time}
                    </p>
                  </div>
                </li>
              ))}
              {activity.isLoading ? <li className="text-sm text-muted-foreground">Loading…</li> : null}
            </ul>
          </SectionCard>
        </div>
      </div>
    </AdminShell>
  );
}
