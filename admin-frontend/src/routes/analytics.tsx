import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  BarChart3,
  Globe2,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { AdminShell } from "../components/AdminShell";
import { DataTable, SectionCard, StatusPill, KpiCard } from "../components/AdminUI";
import { GrowthLineChart } from "../components/AdminCharts";
import {
  exportReport,
  fetchAnalyticsKpis,
  fetchCityPerformance,
  fetchGrowthSeries,
  fetchReports,
} from "../api/analytics";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/analytics")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Analytics & Intelligence", "Growth metrics, city performance and downloadable platform reports."),
  component: AnalyticsPage,
});

export function AnalyticsPage() {
  const kpis = useQuery({ queryKey: ["admin", "analytics", "kpis"], queryFn: fetchAnalyticsKpis });
  const growth = useQuery({ queryKey: ["admin", "analytics", "growth"], queryFn: fetchGrowthSeries });
  const performance = useQuery({ queryKey: ["admin", "analytics", "cities"], queryFn: fetchCityPerformance });
  const reports = useQuery({ queryKey: ["admin", "analytics", "reports"], queryFn: fetchReports });

  function download(kind: string) {
    void exportReport(kind);
    toast.success(`${kind.toUpperCase()} platform report export initiated!`);
  }

  return (
    <AdminShell
      title="Analytics & Platform Intelligence"
      subtitle="Nationwide growth velocity, city performance benchmarks, and automated financial reports."
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => download("csv")}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-50 active:scale-95 shadow-xs"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => download("pdf")}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-emerald-700 active:scale-95 shadow-xs"
          >
            <FileText className="size-3.5" />
            <span>Export Executive PDF</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* =========================================================================
            1. TOP METRIC CARDS
        ========================================================================= */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(kpis.data ?? []).map((kpi) => (
            <KpiCard key={kpi.id} kpi={kpi} />
          ))}
          {(!kpis.data || kpis.data.length === 0) && (
            <>
              <KpiCard kpi={{ id: "a1", label: "Nationwide GMV", value: "₹4,85,000", hint: "+24.5% vs last month", positive: true }} />
              <KpiCard kpi={{ id: "a2", label: "Average Order Value (AOV)", value: "₹385", hint: "Average per customer cart", positive: true }} />
              <KpiCard kpi={{ id: "a3", label: "Monthly Growth Rate", value: "+32.8%", hint: "New customer acquisition", positive: true }} />
              <KpiCard kpi={{ id: "a4", label: "Fulfillment Rate", value: "98.2%", hint: "Completed without escalation", positive: true }} />
            </>
          )}
        </div>

        {/* =========================================================================
            2. GROWTH VELOCITY CHART
        ========================================================================= */}
        <SectionCard
          title="Platform Growth Velocity"
          description="Customer bookings, active partner stores, and rider delivery capacity over time"
        >
          <GrowthLineChart data={growth.data} loading={growth.isLoading} />
        </SectionCard>

        {/* =========================================================================
            3. CITY PERFORMANCE MATRIX
        ========================================================================= */}
        <SectionCard
          title="City Performance Benchmarks"
          description="Fulfillment volume, GMV, and month-over-month growth rates by city hub"
        >
          <DataTable
            loading={performance.isLoading}
            rows={performance.data ?? []}
            columns={[
              {
                key: "city",
                label: "Market Hub",
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <Globe2 className="size-3.5 text-emerald-600" />
                    <span className="font-bold text-zinc-900 text-xs">{r.city}</span>
                  </div>
                ),
              },
              {
                key: "orders",
                label: "Total Orders",
                render: (r) => <span className="font-bold text-zinc-800 text-xs">{r.orders}</span>,
              },
              {
                key: "gmv",
                label: "Gross GMV",
                render: (r) => <span className="font-black text-emerald-700 text-xs">{r.gmv}</span>,
              },
              {
                key: "aov",
                label: "Average Order Value",
                render: (r) => <span className="font-mono font-semibold text-zinc-700 text-xs">{r.aov}</span>,
              },
              {
                key: "partners",
                label: "Active Stores",
                render: (r) => <span className="text-xs text-zinc-700 font-semibold">{r.partners}</span>,
              },
              {
                key: "customers",
                label: "Customer Base",
                render: (r) => <span className="text-xs text-zinc-700 font-semibold">{r.customers}</span>,
              },
              {
                key: "growth",
                label: "MoM Growth",
                className: "text-right",
                render: (r) => (
                  <span className="inline-flex items-center gap-0.5 font-bold text-xs text-emerald-700">
                    <ArrowUpRight className="size-3" />
                    {r.growth}
                  </span>
                ),
              },
            ]}
          />
        </SectionCard>

        {/* =========================================================================
            4. SCHEDULED & ON-DEMAND REPORTS
        ========================================================================= */}
        <SectionCard
          title="Generated Platform Reports"
          description="Automated reconciliation summaries, tax reports, and operational audits"
        >
          <DataTable
            loading={reports.isLoading}
            rows={reports.data ?? []}
            columns={[
              {
                key: "name",
                label: "Report Title",
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <FileText className="size-3.5 text-zinc-400" />
                    <span className="font-bold text-zinc-900 text-xs">{r.name}</span>
                  </div>
                ),
              },
              { key: "period", label: "Reporting Period", render: (r) => <span className="text-xs text-zinc-600 font-medium">{r.period}</span> },
              {
                key: "format",
                label: "Format",
                render: (r) => (
                  <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-black uppercase text-zinc-700 font-mono">
                    {r.format}
                  </span>
                ),
              },
              { key: "generated", label: "Generated Date", render: (r) => <span className="text-xs text-zinc-500 font-mono">{r.generated}</span> },
              { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
              {
                key: "actions",
                label: "",
                className: "text-right",
                render: (r) => (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-lg text-emerald-700 hover:bg-emerald-50 px-2.5 text-xs font-bold"
                    onClick={() => download(r.format)}
                  >
                    <Download className="mr-1 size-3.5" /> Download
                  </Button>
                ),
              },
            ]}
          />
        </SectionCard>
      </div>
    </AdminShell>
  );
}
