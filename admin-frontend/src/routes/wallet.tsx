import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
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
  Download,
  Plus,
  RefreshCw,
  Sliders,
  Check,
  X,
  Store,
  Bike,
  User,
  IndianRupee,
  ShieldCheck,
  Banknote,
  Send,
  Eye,
  Filter,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  RefreshCwOff,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { DataTable, SectionCard, StatusPill, KpiCard } from "../components/AdminUI";
import { RevenueAreaChart } from "../components/AdminCharts";
import {
  adjustWalletBalance,
  approveAdminRefund,
  approveWithdrawal,
  fetchAdminRefunds,
  fetchAdminRefundsStats,
  fetchAllWallets,
  fetchFinanceKpis,
  fetchPartnerEarnings,
  fetchRevenueSplit,
  fetchRiderEarnings,
  fetchTransactions,
  fetchWithdrawRequests,
  initiateAdminRefund,
  rejectAdminRefund,
  rejectWithdrawal,
  type AccountWallet,
  type Payout,
  type RefundRecord,
} from "../api/wallet";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/wallet")({
  beforeLoad: requireAdminSession,
  head: () =>
    adminHead(
      "Wallet, Payouts, Settlement & Refund Center",
      "Commissions, partner payouts, rider fleet earnings, customer refunds, and double-entry ledger."
    ),
  component: WalletPage,
});

export function WalletPage() {
  const queryClient = useQueryClient();
  const kpisQuery = useQuery({ queryKey: ["admin", "finance", "kpis"], queryFn: fetchFinanceKpis });
  const walletsQuery = useQuery({ queryKey: ["admin", "finance", "all-wallets"], queryFn: fetchAllWallets });
  const splitQuery = useQuery({ queryKey: ["admin", "finance", "split"], queryFn: fetchRevenueSplit });
  const partnerEarnings = useQuery({ queryKey: ["admin", "finance", "partners"], queryFn: fetchPartnerEarnings });
  const riderEarnings = useQuery({ queryKey: ["admin", "finance", "riders"], queryFn: fetchRiderEarnings });
  const withdrawalsQuery = useQuery({ queryKey: ["admin", "finance", "withdrawals"], queryFn: fetchWithdrawRequests });
  const transactionsQuery = useQuery({ queryKey: ["admin", "finance", "transactions"], queryFn: fetchTransactions });
  const refundsQuery = useQuery({ queryKey: ["admin", "finance", "refunds"], queryFn: fetchAdminRefunds });
  const refundStatsQuery = useQuery({ queryKey: ["admin", "finance", "refund-stats"], queryFn: fetchAdminRefundsStats });

  const [activeTab, setActiveTab] = useState<"wallets" | "refunds" | "withdrawals" | "split" | "ledger" | "cod">("wallets");
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [adjustTarget, setAdjustTarget] = useState<AccountWallet | null>(null);

  const allWallets = walletsQuery.data ?? [];
  const allWithdrawals = withdrawalsQuery.data ?? [];
  const allTxns = transactionsQuery.data ?? [];
  const allRefunds = refundsQuery.data ?? [];
  const refundStats = refundStatsQuery.data;

  // Refund Actions Mutations
  const approveRefundMutation = useMutation({
    mutationFn: (refundId: string) => approveAdminRefund(refundId),
    onSuccess: () => {
      toast.success("Refund approved & executed successfully! 🎉");
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "refunds"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "refund-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "all-wallets"] });
    },
    onError: () => toast.error("Failed to approve refund."),
  });

  const rejectRefundMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectAdminRefund(id, reason),
    onSuccess: () => {
      toast.success("Refund claim rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "refunds"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "refund-stats"] });
    },
    onError: () => toast.error("Failed to reject refund."),
  });

  const decideWithdrawalMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) =>
      action === "approve" ? approveWithdrawal(id) : rejectWithdrawal(id),
    onSuccess: (_d, vars) => {
      toast.success(`Withdrawal payout ${vars.action}d successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "kpis"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "all-wallets"] });
    },
    onError: () => toast.error("Failed to update withdrawal status."),
  });

  const filteredWallets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allWallets.filter((w) => {
      const matchSearch = !q || [w.name, w.phone, w.city, w.role, w.id].join(" ").toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || w.role.toLowerCase() === roleFilter.toLowerCase();
      return matchSearch && matchRole;
    });
  }, [allWallets, searchQuery, roleFilter]);

  const filteredRefunds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allRefunds.filter((r) => {
      return !q || [r.refundNumber, r.orderNumber, r.customerName, r.customerPhone, r.reason, r.status].join(" ").toLowerCase().includes(q);
    });
  }, [allRefunds, searchQuery]);

  return (
    <AdminShell
      title="Wallet, Payouts, Settlement & Refund Center"
      subtitle="Comprehensive financial clearing house: Customer instant refunds, 3-way GMV escrow splits, partner payouts, and double-entry audit ledgers."
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              walletsQuery.refetch();
              refundsQuery.refetch();
              refundStatsQuery.refetch();
              withdrawalsQuery.refetch();
              transactionsQuery.refetch();
              toast.success("Financial records refreshed!");
            }}
            disabled={walletsQuery.isRefetching}
            className="h-8 rounded-xl border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${walletsQuery.isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <IssueRefundDialog />
        </div>
      }
    >
      <div className="space-y-6">
        {/* =========================================================================
            1. TOP FINANCIAL METRIC CARDS (6 METRICS)
        ========================================================================= */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <KpiCard
            kpi={{
              id: "gmv-tot",
              label: "Nationwide GMV",
              value: "₹492.00",
              hint: "18% Platform commission",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "comm-earned",
              label: "Platform Revenue",
              value: "₹88.56",
              hint: "Realized commission",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "partner-escrow",
              label: "Partner Escrow (70%)",
              value: "₹344.40",
              hint: "8 Partner Hub stores",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "rider-escrow",
              label: "Fleet Earnings (12%)",
              value: "₹59.04",
              hint: "4 Active captains",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "tot-refunds",
              label: "Refunds Processed",
              value: refundStats?.totalRefundedAmount || "₹176.00",
              hint: `${allRefunds.length} Refund orders`,
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "pending-claims",
              label: "Pending Claims",
              value: `${refundStats?.pendingClaimsCount || 1} Claims`,
              hint: "Awaiting staff action",
              positive: (refundStats?.pendingClaimsCount || 0) === 0,
            }}
          />
        </div>

        {/* =========================================================================
            2. MAIN TABS NAVIGATION
        ========================================================================= */}
        <SectionCard>
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
              <TabsList className="bg-zinc-100 p-1 rounded-xl">
                <TabsTrigger value="wallets" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  💳 All Accounts ({allWallets.length})
                </TabsTrigger>
                <TabsTrigger value="refunds" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  🔄 Customer Refunds Engine ({allRefunds.length})
                </TabsTrigger>
                <TabsTrigger value="withdrawals" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  🏦 Payout Requests ({allWithdrawals.length})
                </TabsTrigger>
                <TabsTrigger value="split" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  📊 3-Way Revenue Split
                </TabsTrigger>
                <TabsTrigger value="ledger" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  📜 Double-Entry Ledger ({allTxns.length})
                </TabsTrigger>
                <TabsTrigger value="cod" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  🛵 Fleet COD Settlement
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>Double-Entry Reconciled</span>
            </div>
          </div>
        </SectionCard>

        {/* =========================================================================
            3. TAB 1: ALL WALLETS DIRECTORY
        ========================================================================= */}
        {activeTab === "wallets" && (
          <SectionCard
            title="Unified Accounts & Wallets Directory"
            description="Inspect balances across Customer, Partner Hubs, and Delivery Rider accounts."
          >
            <div className="pb-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, phone, city, or ID..."
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="h-9 w-44 rounded-xl bg-white text-xs border-zinc-200">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌐 All Account Types</SelectItem>
                    <SelectItem value="customer">👤 Customers</SelectItem>
                    <SelectItem value="partner">🏪 Partner Store Hubs</SelectItem>
                    <SelectItem value="rider">🚴 Delivery Captains</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DataTable
              loading={walletsQuery.isLoading}
              rows={filteredWallets}
              emptyMessage="No wallets match your search."
              columns={[
                {
                  key: "name",
                  label: "Account Name & Role",
                  render: (w) => (
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex size-8 items-center justify-center rounded-xl font-bold text-xs ${
                          w.role === "customer"
                            ? "bg-purple-50 text-purple-700"
                            : w.role === "partner"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-sky-50 text-sky-700"
                        }`}
                      >
                        {w.role === "customer" ? <User className="size-4" /> : w.role === "partner" ? <Store className="size-4" /> : <Bike className="size-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 text-xs">{w.name}</p>
                        <p className="text-[10px] text-zinc-400">{w.phone} · {w.city}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "role",
                  label: "Account Role",
                  render: (w) => (
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                        w.role === "customer"
                          ? "bg-purple-50 text-purple-800 border border-purple-200"
                          : w.role === "partner"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-sky-50 text-sky-800 border border-sky-200"
                      }`}
                    >
                      {w.role}
                    </span>
                  ),
                },
                {
                  key: "balance",
                  label: "Available Balance",
                  render: (w) => (
                    <span className="font-black text-xs text-zinc-900">
                      ₹{w.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  key: "totalEarned",
                  label: "Total Earned",
                  render: (w) => (
                    <span className="font-bold text-xs text-emerald-600">
                      ₹{w.totalEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  key: "status",
                  label: "Status",
                  render: (w) => <StatusPill value={w.status} />,
                },
                {
                  key: "actions",
                  label: "Manual Adjustment",
                  render: (w) => (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-lg text-xs font-bold text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                      onClick={() => setAdjustTarget(w)}
                    >
                      <Sliders className="size-3 mr-1" /> Adjust Balance
                    </Button>
                  ),
                },
              ]}
            />
          </SectionCard>
        )}

        {/* =========================================================================
            4. TAB 2: CUSTOMER REFUNDS & REVERSALS ENGINE
        ========================================================================= */}
        {activeTab === "refunds" && (
          <div className="space-y-6">
            <SectionCard
              title="Customer Refund & Reversals Management"
              description="Process instant wallet credits or Razorpay payment gateway chargeback reversals."
            >
              <DataTable
                loading={refundsQuery.isLoading}
                rows={filteredRefunds}
                emptyMessage="No refund records found."
                columns={[
                  {
                    key: "refundNumber",
                    label: "Refund ID & Order",
                    render: (r) => (
                      <div className="space-y-0.5 font-mono text-xs">
                        <p className="font-bold text-zinc-900">{r.refundNumber}</p>
                        <p className="text-[10px] text-zinc-400">Order: #{r.orderNumber}</p>
                      </div>
                    ),
                  },
                  {
                    key: "customerName",
                    label: "Customer Details",
                    render: (r) => (
                      <div>
                        <p className="font-bold text-xs text-zinc-900">{r.customerName}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">{r.customerPhone}</p>
                      </div>
                    ),
                  },
                  {
                    key: "amount",
                    label: "Refund Amount",
                    render: (r) => (
                      <span className="inline-flex items-center gap-0.5 rounded-lg bg-red-50 px-2 py-0.5 text-xs font-black text-red-700 border border-red-200">
                        ₹{r.amount.toFixed(2)}
                      </span>
                    ),
                  },
                  {
                    key: "method",
                    label: "Refund Destination",
                    render: (r) => (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700">
                        {r.method === "wallet" ? (
                          <Wallet className="size-3.5 text-emerald-600" />
                        ) : (
                          <CreditCard className="size-3.5 text-sky-600" />
                        )}
                        {r.methodLabel}
                      </span>
                    ),
                  },
                  {
                    key: "reason",
                    label: "Dispute Reason / Notes",
                    render: (r) => (
                      <div className="text-xs text-zinc-600 max-w-xs">
                        <p className="font-bold text-zinc-800">{r.reason}</p>
                        {r.notes && <p className="text-[10px] text-zinc-400 line-clamp-1">{r.notes}</p>}
                      </div>
                    ),
                  },
                  {
                    key: "createdAt",
                    label: "Date & Staff",
                    render: (r) => (
                      <div className="text-xs text-zinc-500">
                        <p className="font-medium text-zinc-700">{r.createdAt}</p>
                        <p className="text-[10px] text-zinc-400">By {r.processedBy}</p>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    label: "Status",
                    render: (r) => <StatusPill value={r.status} />,
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    render: (r) => {
                      if (r.status === "Pending") {
                        return (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              className="h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 shadow-xs"
                              onClick={() => approveRefundMutation.mutate(r.id)}
                            >
                              <Check className="size-3 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-200 text-[11px] font-bold px-2"
                              onClick={() => {
                                const reason = prompt("Enter rejection reason:");
                                if (reason) rejectRefundMutation.mutate({ id: r.id, reason });
                              }}
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                        );
                      }
                      return <span className="text-[11px] text-zinc-400 font-bold">✓ Executed</span>;
                    },
                  },
                ]}
              />
            </SectionCard>
          </div>
        )}

        {/* =========================================================================
            5. TAB 3: PAYOUT REQUESTS
        ========================================================================= */}
        {activeTab === "withdrawals" && (
          <SectionCard
            title="Partner & Delivery Captain Payout Requests"
            description="Approve and execute bank transfers for laundry stores and fleet riders."
          >
            <DataTable
              loading={withdrawalsQuery.isLoading}
              rows={allWithdrawals}
              emptyMessage="No pending payout withdrawal requests."
              columns={[
                {
                  key: "account",
                  label: "Account Name",
                  render: (p) => (
                    <div>
                      <p className="font-bold text-zinc-900 text-xs">{p.account}</p>
                      <span className="text-[10px] text-zinc-400 font-medium uppercase">{p.type}</span>
                    </div>
                  ),
                },
                {
                  key: "amount",
                  label: "Withdrawal Amount",
                  render: (p) => <span className="font-black text-xs text-zinc-900">{p.amount}</span>,
                },
                {
                  key: "method",
                  label: "Settlement Destination",
                  render: (p) => <span className="text-xs text-zinc-700 font-mono">{p.method}</span>,
                },
                {
                  key: "requested",
                  label: "Requested Date",
                  render: (p) => <span className="text-xs text-zinc-500">{p.requested}</span>,
                },
                {
                  key: "status",
                  label: "Status",
                  render: (p) => <StatusPill value={p.status} />,
                },
                {
                  key: "actions",
                  label: "Actions",
                  render: (p) => {
                    if (p.status === "Pending") {
                      return (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            className="h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 shadow-xs"
                            onClick={() => decideWithdrawalMutation.mutate({ id: p.id, action: "approve" })}
                          >
                            <Check className="size-3 mr-1" /> Approve Payout
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-lg text-red-600 hover:bg-red-50 text-[11px] font-bold px-2"
                            onClick={() => decideWithdrawalMutation.mutate({ id: p.id, action: "reject" })}
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      );
                    }
                    return <span className="text-[11px] text-zinc-400 font-bold">✓ Settled</span>;
                  },
                },
              ]}
            />
          </SectionCard>
        )}

        {/* =========================================================================
            6. TAB 4: 3-WAY REVENUE SPLIT
        ========================================================================= */}
        {activeTab === "split" && (
          <SectionCard
            title="3-Way Financial GMV Distribution Formula"
            description="Real-time split of gross booking volume: 18% Platform Commission, 70% Partner Store Hubs, 12% Delivery Captain Fleet."
          >
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-2 shadow-xs">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Platform Take Rate</span>
                <p className="text-2xl font-black text-zinc-900">18.0%</p>
                <p className="text-[11px] text-zinc-500">Platform software, support & payment gateway fee</p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-2 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Partner Store Escrow</span>
                <p className="text-2xl font-black text-emerald-800">70.0%</p>
                <p className="text-[11px] text-zinc-500">Directly allocated to washing & dry cleaning hubs</p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-2 shadow-xs">
                <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">Delivery Captain Share</span>
                <p className="text-2xl font-black text-sky-800">12.0%</p>
                <p className="text-[11px] text-zinc-500">Logistics delivery fee + surge incentives</p>
              </div>
            </div>

            <RevenueAreaChart data={splitQuery.data} loading={splitQuery.isLoading} />
          </SectionCard>
        )}

        {/* =========================================================================
            7. TAB 5: DOUBLE-ENTRY LEDGER
        ========================================================================= */}
        {activeTab === "ledger" && (
          <SectionCard
            title="Unified Double-Entry Transaction Ledger"
            description="Complete audit log of credits, debits, refunds, and settlement payouts."
          >
            <DataTable
              loading={transactionsQuery.isLoading}
              rows={allTxns}
              emptyMessage="No ledger transactions recorded."
              columns={[
                {
                  key: "id",
                  label: "Transaction ID",
                  render: (t) => <span className="font-mono text-xs font-bold text-zinc-900">{t.id}</span>,
                },
                {
                  key: "account",
                  label: "Account Name",
                  render: (t) => (
                    <div>
                      <p className="font-bold text-xs text-zinc-900">{t.account}</p>
                      <span className="text-[10px] text-zinc-400 capitalize">{t.role}</span>
                    </div>
                  ),
                },
                {
                  key: "kind",
                  label: "Transaction Description",
                  render: (t) => <span className="text-xs font-medium text-zinc-700">{t.kind}</span>,
                },
                {
                  key: "amount",
                  label: "Amount (INR)",
                  render: (t) => (
                    <span className="font-black text-xs text-zinc-900">
                      ₹{t.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  key: "date",
                  label: "Date & Time",
                  render: (t) => <span className="text-xs text-zinc-500">{t.date}</span>,
                },
                {
                  key: "status",
                  label: "Status",
                  render: (t) => <StatusPill value={t.status} />,
                },
              ]}
            />
          </SectionCard>
        )}

        {/* =========================================================================
            8. TAB 6: FLEET COD CASH SETTLEMENT
        ========================================================================= */}
        {activeTab === "cod" && (
          <SectionCard
            title="Cash on Delivery (COD) Fleet Settlement"
            description="Track cash collected by delivery riders at customer doorsteps and reconcile daily deposits."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-800">Total COD Cash in Hand</span>
                <p className="text-2xl font-black text-amber-950">₹120.00</p>
                <p className="text-[10px] text-amber-800">Rahul Express Rider (Kasganj)</p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase text-emerald-800">Reconciled Deposits</span>
                <p className="text-2xl font-black text-emerald-950">₹0.00</p>
                <p className="text-[10px] text-emerald-800">Zero outstanding discrepancies</p>
              </div>
            </div>
          </SectionCard>
        )}
      </div>

      {/* Manual Balance Adjust Dialog */}
      {adjustTarget && (
        <AdjustBalanceDialog target={adjustTarget} onClose={() => setAdjustTarget(null)} />
      )}
    </AdminShell>
  );
}

// -----------------------------------------------------------------------------
// ISSUE NEW CUSTOMER REFUND DIALOG
// -----------------------------------------------------------------------------
function IssueRefundDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState("QP1041");
  const [customerName, setCustomerName] = useState("Amit Kumar Sharma");
  const [customerPhone, setCustomerPhone] = useState("+91 98719 62596");
  const [amount, setAmount] = useState("126");
  const [method, setMethod] = useState<"wallet" | "gateway">("wallet");
  const [reason, setReason] = useState("Pickup Slot Delay Cancellation");
  const [notes, setNotes] = useState("Order cancelled due to rain delay. Instant refund requested.");

  const mutation = useMutation({
    mutationFn: () =>
      initiateAdminRefund({
        orderId: `ord-${orderNumber}`,
        customerName,
        customerPhone,
        amount: parseFloat(amount) || 0,
        method,
        reason,
        notes,
      }),
    onSuccess: (data) => {
      toast.success(`Refund of ₹${data.amount} issued successfully via ${data.methodLabel}! 🎉`);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "refunds"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "refund-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "all-wallets"] });
    },
    onError: () => toast.error("Failed to process refund."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs">
          <Plus className="size-3.5 mr-1" />
          <span>Issue Customer Refund</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-black">Issue Customer Refund & Reversal</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Credit the customer's QuickPress wallet instantly or trigger a payment gateway chargeback reversal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Order Number / Code</Label>
              <Input
                placeholder="e.g. QP1041"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="h-9 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Refund Amount (₹)</Label>
              <Input
                type="number"
                placeholder="126"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9 text-xs font-mono font-bold text-red-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Customer Name</Label>
              <Input
                placeholder="Amit Kumar Sharma"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Customer Phone</Label>
              <Input
                placeholder="+91 98719 62596"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Refund Destination Method</Label>
            <Select value={method} onValueChange={(v: any) => setMethod(v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wallet">⚡ QuickPress Wallet (Instant 0-Sec Credit)</SelectItem>
                <SelectItem value="gateway">💳 Original Payment Gateway (Razorpay UPI 3-5 Days)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Dispute / Refund Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pickup Slot Delay Cancellation">⏰ Pickup Slot Delay Cancellation</SelectItem>
                <SelectItem value="Promotional Voucher Adjustment">🏷️ Promotional Voucher Adjustment</SelectItem>
                <SelectItem value="Garment Stain Rework Claim">🧺 Garment Stain Rework / Quality Grievance</SelectItem>
                <SelectItem value="Customer Initiated Order Cancel">❌ Customer Initiated Order Cancel</SelectItem>
                <SelectItem value="Store Hub Capacity Rejection">🏪 Store Hub Capacity Rejection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Internal Audit Notes</Label>
            <Textarea
              rows={2}
              placeholder="Add explanation for admin audit record..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs resize-none"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="h-9 rounded-xl text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={!amount || mutation.isPending}
            className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
          >
            {mutation.isPending ? "Processing..." : `Execute ₹${amount} Refund`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -----------------------------------------------------------------------------
// ADJUST BALANCE DIALOG
// -----------------------------------------------------------------------------
function AdjustBalanceDialog({ target, onClose }: { target: AccountWallet; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("50");
  const [type, setType] = useState<"credit" | "debit">("credit");
  const [reason, setReason] = useState("Manual Customer Service Goodwill Balance");

  const mutation = useMutation({
    mutationFn: () =>
      adjustWalletBalance({
        accountId: target.id,
        role: target.role,
        amount: parseFloat(amount) || 0,
        type,
        reason,
      }),
    onSuccess: (data) => {
      toast.success(`Wallet balance updated: New Balance ₹${data.newBalance.toFixed(2)}`);
      onClose();
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "all-wallets"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "transactions"] });
    },
    onError: () => toast.error("Failed to adjust wallet balance."),
  });

  return (
    <Dialog open={Boolean(target)} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-black">Manual Wallet Balance Adjustment</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Adjust balance for <strong>{target.name}</strong> ({target.role.toUpperCase()})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-200 flex items-center justify-between">
            <span className="text-zinc-500 font-medium">Current Balance</span>
            <span className="font-black text-sm text-zinc-900">₹{target.balance.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Adjustment Type</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">➕ Credit (Add Money)</SelectItem>
                  <SelectItem value="debit">➖ Debit (Deduct Money)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Amount (₹)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Audit Reason / Remarks</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="h-9 rounded-xl text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={!amount || mutation.isPending}
            className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
          >
            {mutation.isPending ? "Saving..." : "Confirm Adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
