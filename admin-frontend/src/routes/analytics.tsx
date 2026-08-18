import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { AdminShell } from "../components/AdminShell";
import { DataTable, KpiGrid, SectionCard, StatusPill } from "../components/AdminUI";
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
  head: () => adminHead("Analytics & reports", "Growth, city performance and downloadable QuickPress reports."),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const kpis = useQuery({ queryKey: ["admin", "analytics", "kpis"], queryFn: fetchAnalyticsKpis });
  const growth = useQuery({ queryKey: ["admin", "analytics", "growth"], queryFn: fetchGrowthSeries });
  const performance = useQuery({ queryKey: ["admin", "analytics", "cities"], queryFn: fetchCityPerformance });
  const reports = useQuery({ queryKey: ["admin", "analytics", "reports"], queryFn: fetchReports });

  function download(kind: string) {
    void exportReport(kind);
    toast.success(`${kind.toUpperCase()} export queued`);
  }

  return (
    <AdminShell
      title="Analytics & reports"
      subtitle="Growth trends, city performance and exports."
      actions={
        <>
          <Button size="sm" variant="outline" onClick={() => download("csv")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button size="sm" onClick={() => download("pdf")}>
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <KpiGrid kpis={kpis.data} loading={kpis.isLoading} />

        <SectionCard title="Growth" description="Customer, partner and rider growth over time">
          <GrowthLineChart data={growth.data} loading={growth.isLoading} />
        </SectionCard>

        <SectionCard title="City performance" description="Orders, GMV and growth by market">
          <DataTable
            loading={performance.isLoading}
            rows={performance.data ?? []}
            columns={[
              { key: "city", label: "City" },
              { key: "orders", label: "Orders" },
              { key: "gmv", label: "GMV" },
              { key: "aov", label: "AOV" },
              { key: "partners", label: "Partners" },
              { key: "customers", label: "Customers" },
              { key: "growth", label: "Growth", className: "text-right" },
            ]}
          />
        </SectionCard>

        <SectionCard title="Generated reports" description="Scheduled and on-demand exports">
          <DataTable
            loading={reports.isLoading}
            rows={reports.data ?? []}
            columns={[
              { key: "name", label: "Report" },
              { key: "period", label: "Period" },
              { key: "format", label: "Format" },
              { key: "generated", label: "Generated" },
              { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
              {
                key: "actions",
                label: "",
                className: "text-right",
                render: (r) => (
                  <Button size="sm" variant="ghost" onClick={() => download(r.format)}>
                    <Download className="h-3.5 w-3.5" />
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
