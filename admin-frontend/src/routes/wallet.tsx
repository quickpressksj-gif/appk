import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Download, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { DataTable, KpiGrid, SectionCard, StatusPill } from "../components/AdminUI";
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
  head: () => adminHead("Wallet & payments", "Revenue, payouts, refunds and transactions across QuickPress."),
  component: WalletPage,
});

function WalletPage() {
  const queryClient = useQueryClient();
  const kpis = useQuery({ queryKey: ["admin", "finance", "kpis"], queryFn: fetchFinanceKpis });
  const split = useQuery({ queryKey: ["admin", "finance", "split"], queryFn: fetchRevenueSplit });
  const partnerEarnings = useQuery({ queryKey: ["admin", "finance", "partners"], queryFn: fetchPartnerEarnings });
  const riderEarnings = useQuery({ queryKey: ["admin", "finance", "riders"], queryFn: fetchRiderEarnings });
  const withdrawals = useQuery({ queryKey: ["admin", "finance", "withdrawals"], queryFn: fetchWithdrawRequests });
  const refunds = useQuery({ queryKey: ["admin", "finance", "refunds"], queryFn: fetchRefunds });
  const transactions = useQuery({ queryKey: ["admin", "finance", "transactions"], queryFn: fetchTransactions });

  const decide = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) => decideWithdrawal(id, action),
    onSuccess: (_d, vars) => {
      toast.success(`Withdrawal ${vars.action}d`);
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "withdrawals"] });
    },
  });

  const earningColumns = [
    { key: "account" as const, label: "Account" },
    { key: "city" as const, label: "City" },
    { key: "orders" as const, label: "Orders" },
    { key: "gross" as const, label: "Gross" },
    { key: "commission" as const, label: "Commission" },
    { key: "net" as const, label: "Net payable", className: "text-right" },
  ];

  return (
    <AdminShell
      title="Wallet & payments"
      subtitle="Revenue, commissions, payouts and refunds."
      actions={
        <Button size="sm" variant="outline" onClick={() => toast.success("Ledger export queued")}>
          <Download className="mr-2 h-4 w-4" /> Export ledger
        </Button>
      }
    >
      <div className="space-y-6">
        <KpiGrid kpis={kpis.data} loading={kpis.isLoading} />

        <SectionCard title="Revenue split" description="Platform commission vs partner and rider payouts">
          <RevenueAreaChart data={split.data} loading={split.isLoading} />
        </SectionCard>

        <Tabs defaultValue="withdrawals" className="space-y-4">
          <TabsList>
            <TabsTrigger value="withdrawals">Withdraw requests</TabsTrigger>
            <TabsTrigger value="partners">Partner earnings</TabsTrigger>
            <TabsTrigger value="riders">Rider earnings</TabsTrigger>
            <TabsTrigger value="refunds">Refunds</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals">
            <SectionCard title="Withdraw requests" description="Approve or reject partner and rider payouts">
              <DataTable
                loading={withdrawals.isLoading}
                rows={withdrawals.data ?? []}
                columns={[
                  { key: "account", label: "Account" },
                  { key: "type", label: "Type" },
                  { key: "amount", label: "Amount" },
                  { key: "method", label: "Method" },
                  { key: "requested", label: "Requested" },
                  { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
                  {
                    key: "actions",
                    label: "",
                    className: "text-right",
                    render: (r) =>
                      r.status === "Pending" ? (
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" onClick={() => decide.mutate({ id: r.id, action: "approve" })}>
                            <Check className="mr-1 h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: r.id, action: "reject" })}>
                            <X className="mr-1 h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      ) : null,
                  },
                ]}
              />
            </SectionCard>
          </TabsContent>

          <TabsContent value="partners">
            <SectionCard title="Partner earnings">
              <DataTable loading={partnerEarnings.isLoading} rows={partnerEarnings.data ?? []} columns={earningColumns} />
            </SectionCard>
          </TabsContent>

          <TabsContent value="riders">
            <SectionCard title="Rider earnings">
              <DataTable loading={riderEarnings.isLoading} rows={riderEarnings.data ?? []} columns={earningColumns} />
            </SectionCard>
          </TabsContent>

          <TabsContent value="refunds">
            <SectionCard title="Refunds" description="Customer refunds issued from orders">
              <DataTable
                loading={refunds.isLoading}
                rows={refunds.data ?? []}
                columns={[
                  { key: "id", label: "Reference" },
                  { key: "party", label: "Customer" },
                  { key: "amount", label: "Amount" },
                  { key: "date", label: "Date" },
                  { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
                ]}
              />
            </SectionCard>
          </TabsContent>

          <TabsContent value="transactions">
            <SectionCard title="Transaction history" description="Complete money movement ledger">
              <DataTable
                loading={transactions.isLoading}
                rows={transactions.data ?? []}
                columns={[
                  { key: "id", label: "Reference" },
                  { key: "party", label: "Party" },
                  { key: "kind", label: "Type" },
                  { key: "amount", label: "Amount" },
                  { key: "date", label: "Date" },
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
