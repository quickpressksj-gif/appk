import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Download,
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  Truck,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { DataTable, SectionCard, StatusPill, KpiCard } from "../components/AdminUI";
import { RevenueAreaChart } from "../components/AdminCharts";
import {
  decideWithdrawal,
  fetchFinanceKpis,
  fetchPartnerEarnings,
  fetchRefunds,
  fetchRevenueSplit,
  fetchRiderEarnings,
  fetchTransactions,
  fetchWithdrawRequests,
} from "../api/wallet";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/wallet")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Wallet & Payouts", "Platform revenue, partner/rider settlements, and transactions."),
  component: WalletPage,
});

export function WalletPage() {
  const queryClient = useQueryClient();
  const kpis = useQuery({ queryKey: ["admin", "finance", "kpis"], queryFn: fetchFinanceKpis });
  const split = useQuery({ queryKey: ["admin", "finance", "split"], queryFn: fetchRevenueSplit });
  const partnerEarnings = useQuery({ queryKey: ["admin", "finance", "partners"], queryFn: fetchPartnerEarnings });
  const riderEarnings = useQuery({ queryKey: ["admin", "finance", "riders"], queryFn: fetchRiderEarnings });
  const withdrawals = useQuery({ queryKey: ["admin", "finance", "withdrawals"], queryFn: fetchWithdrawRequests });
  const refunds = useQuery({ queryKey: ["admin", "finance", "refunds"], queryFn: fetchRefunds });
  const transactions = useQuery({ queryKey: ["admin", "finance", "transactions"], queryFn: fetchTransactions });

  const decideMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) => decideWithdrawal(id, action),
    onSuccess: (_d, vars) => {
      toast.success(`Withdrawal payout ${vars.action}d successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "kpis"] });
    },
    onError: () => {
      toast.error("Failed to update withdrawal status.");
    },
  });

  const allWithdrawals = withdrawals.data ?? [];
  const allPartners = partnerEarnings.data ?? [];
  const allRiders = riderEarnings.data ?? [];
  const allRefunds = refunds.data ?? [];
  const allTxns = transactions.data ?? [];

  const handleExportLedger = () => {
    if (allTxns.length === 0) {
      toast.error("No transactions to export.");
      return;
    }
    const headers = ["Transaction ID", "Account", "Type", "Amount", "Status", "Date"];
    const csvRows = [headers.join(",")];
    for (const t of allTxns) {
      csvRows.push([`"${t.id}"`, `"${t.account}"`, `"${t.kind}"`, `"${t.amount}"`, `"${t.status}"`, `"${t.date}"`].join(","));
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QuickPress_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Finance ledger exported successfully!");
  };

  return (
    <AdminShell
      title="Wallet, Payouts & Settlement Center"
      subtitle="Commissions, partner payouts, rider fleet earnings, and double-entry ledger."
      actions={
        <button
          type="button"
          onClick={handleExportLedger}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-50 active:scale-95 shadow-xs"
        >
          <Download className="size-3.5" />
          <span>Export Ledger CSV</span>
        </button>
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
              <KpiCard kpi={{ id: "f1", label: "Gross Platform GMV", value: "₹4,85,000", hint: "Cumulative order bookings", positive: true }} />
              <KpiCard kpi={{ id: "f2", label: "Platform Net Revenue (18%)", value: "₹87,300", hint: "Net commissions retained", positive: true }} />
              <KpiCard kpi={{ id: "f3", label: "Pending Payout Requests", value: "₹22,200", hint: "2 partner/rider requests", positive: false }} />
              <KpiCard kpi={{ id: "f4", label: "Settled Payouts", value: "₹3,75,500", hint: "Successfully disbursed", positive: true }} />
            </>
          )}
        </div>

        {/* =========================================================================
            2. REVENUE TRAJECTORY CHART
        ========================================================================= */}
        <SectionCard
          title="Revenue Split & Settlement Flow"
          description="Gross GMV vs Platform Net Commission (18%) and Partner/Rider Payouts"
        >
          <RevenueAreaChart data={split.data} loading={split.isLoading} />
        </SectionCard>

        {/* =========================================================================
            3. FINANCE TABS
        ========================================================================= */}
        <Tabs defaultValue="withdrawals" className="space-y-4">
          <TabsList className="bg-zinc-100 p-1 rounded-xl">
            <TabsTrigger value="withdrawals" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Payout Requests ({allWithdrawals.filter((w) => w.status === "Pending").length})
            </TabsTrigger>
            <TabsTrigger value="partners" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Partner Earnings ({allPartners.length})
            </TabsTrigger>
            <TabsTrigger value="riders" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Rider Fleet Earnings ({allRiders.length})
            </TabsTrigger>
            <TabsTrigger value="refunds" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Refunds ({allRefunds.length})
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Transactions Ledger ({allTxns.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: WITHDRAW REQUESTS */}
          <TabsContent value="withdrawals">
            <SectionCard title="Pending & Recent Payout Requests" description="Review and approve partner and rider bank withdrawals">
              <DataTable
                loading={withdrawals.isLoading}
                rows={allWithdrawals}
                emptyMessage="No pending withdrawal requests."
                columns={[
                  {
                    key: "account",
                    label: "Account Name",
                    render: (r) => (
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                          {r.type === "Partner" ? <Building2 className="size-3.5" /> : <Truck className="size-3.5" />}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 text-xs">{r.account}</p>
                          <p className="text-[10px] text-zinc-400 font-medium">{r.type}</p>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "amount",
                    label: "Requested Amount",
                    render: (r) => <span className="font-black text-emerald-700 text-xs">{r.amount}</span>,
                  },
                  {
                    key: "method",
                    label: "Disbursement Mode",
                    render: (r) => (
                      <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                        {r.method}
                      </span>
                    ),
                  },
                  {
                    key: "requested",
                    label: "Requested On",
                    render: (r) => <span className="text-xs text-zinc-500 font-mono">{r.requested}</span>,
                  },
                  {
                    key: "status",
                    label: "Payout Status",
                    render: (r) => <StatusPill value={r.status} />,
                  },
                  {
                    key: "actions",
                    label: "",
                    className: "text-right",
                    render: (r) =>
                      r.status === "Pending" ? (
                        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            className="h-8 rounded-lg bg-emerald-600 px-2.5 text-xs font-bold hover:bg-emerald-700 text-white"
                            onClick={() => decideMutation.mutate({ id: r.id, action: "approve" })}
                          >
                            <Check className="mr-1 size-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg border-rose-300 text-rose-600 px-2.5 text-xs font-bold hover:bg-rose-50"
                            onClick={() => decideMutation.mutate({ id: r.id, action: "reject" })}
                          >
                            <X className="mr-1 size-3.5" /> Reject
                          </Button>
                        </div>
                      ) : null,
                  },
                ]}
              />
            </SectionCard>
          </TabsContent>

          {/* TAB 2: PARTNER EARNINGS */}
          <TabsContent value="partners">
            <SectionCard title="Partner Store Earnings" description="82% partner share after deducting 18% QuickPress platform commission">
              <DataTable
                loading={partnerEarnings.isLoading}
                rows={allPartners}
                emptyMessage="No partner earnings recorded."
                columns={[
                  {
                    key: "account",
                    label: "Partner Store",
                    render: (r) => (
                      <div>
                        <p className="font-bold text-zinc-900 text-xs">{r.account}</p>
                        <p className="text-[10px] text-zinc-400 font-medium">{r.city}</p>
                      </div>
                    ),
                  },
                  { key: "orders", label: "Completed Orders", render: (r) => <span className="text-xs font-bold text-zinc-800">{r.orders}</span> },
                  { key: "gross", label: "Gross Sales", render: (r) => <span className="font-black text-zinc-900 text-xs">{r.gross}</span> },
                  { key: "commission", label: "Platform Comm (18%)", render: (r) => <span className="font-black text-emerald-700 text-xs">{r.commission}</span> },
                  { key: "net", label: "Net Payable (82%)", className: "text-right", render: (r) => <span className="font-black text-emerald-800 text-xs">{r.net}</span> },
                ]}
              />
            </SectionCard>
          </TabsContent>

          {/* TAB 3: RIDER EARNINGS */}
          <TabsContent value="riders">
            <SectionCard title="Rider Fleet Delivery Payouts" description="Trip payouts + delivery completion incentives">
              <DataTable
                loading={riderEarnings.isLoading}
                rows={allRiders}
                emptyMessage="No rider earnings recorded."
                columns={[
                  {
                    key: "account",
                    label: "Rider Name",
                    render: (r) => (
                      <div>
                        <p className="font-bold text-zinc-900 text-xs">{r.account}</p>
                        <p className="text-[10px] text-zinc-400 font-medium">{r.city}</p>
                      </div>
                    ),
                  },
                  { key: "orders", label: "Trips Done", render: (r) => <span className="text-xs font-bold text-zinc-800">{r.orders} trips</span> },
                  { key: "gross", label: "Gross Earnings", render: (r) => <span className="font-black text-zinc-900 text-xs">{r.gross}</span> },
                  { key: "net", label: "Net Payable", className: "text-right", render: (r) => <span className="font-black text-emerald-700 text-xs">{r.net}</span> },
                ]}
              />
            </SectionCard>
          </TabsContent>

          {/* TAB 4: REFUNDS */}
          <TabsContent value="refunds">
            <SectionCard title="Customer Refund Ledger" description="Cancelled order and quality issue refunds">
              <DataTable
                loading={refunds.isLoading}
                rows={allRefunds}
                emptyMessage="No refund transactions."
                columns={[
                  { key: "id", label: "Refund ID", render: (r) => <span className="font-mono text-xs font-bold text-zinc-800">{r.id}</span> },
                  { key: "customer", label: "Customer Name" },
                  { key: "orderId", label: "Order ID", render: (r) => <span className="font-mono text-xs text-zinc-600">{r.orderId}</span> },
                  { key: "amount", label: "Refund Amount", render: (r) => <span className="font-black text-rose-600 text-xs">{r.amount}</span> },
                  { key: "reason", label: "Reason" },
                  { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
                ]}
              />
            </SectionCard>
          </TabsContent>

          {/* TAB 5: TRANSACTIONS */}
          <TabsContent value="transactions">
            <SectionCard title="Double-Entry Transaction Ledger" description="All immutable platform ledger entries">
              <DataTable
                loading={transactions.isLoading}
                rows={allTxns}
                emptyMessage="No ledger transactions."
                columns={[
                  { key: "id", label: "Txn ID", render: (r) => <span className="font-mono text-xs font-bold text-zinc-800">{r.id}</span> },
                  { key: "account", label: "Account / Entity" },
                  {
                    key: "kind",
                    label: "Transaction Type",
                    render: (r) => (
                      <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 uppercase font-mono">
                        {r.kind}
                      </span>
                    ),
                  },
                  { key: "amount", label: "Amount", render: (r) => <span className="font-black text-zinc-900 text-xs">{r.amount}</span> },
                  { key: "date", label: "Timestamp", render: (r) => <span className="text-xs text-zinc-500 font-mono">{r.date}</span> },
                  { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
                ]}
              />
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
