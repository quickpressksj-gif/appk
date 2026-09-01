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
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
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
  decideWithdrawal,
  fetchAllWallets,
  fetchFinanceKpis,
  fetchPartnerEarnings,
  fetchRefunds,
  fetchRevenueSplit,
  fetchRiderEarnings,
  fetchTransactions,
  fetchWithdrawRequests,
  type AccountWallet,
  type Payout,
} from "../api/wallet";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/wallet")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Wallet, Payouts & Settlement Center", "Commissions, partner payouts, rider fleet earnings, and double-entry ledger."),
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

  const [activeTab, setActiveTab] = useState<"wallets" | "withdrawals" | "split" | "ledger" | "cod">("wallets");
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [adjustTarget, setAdjustTarget] = useState<AccountWallet | null>(null);

  const allWallets = walletsQuery.data ?? [];
  const allWithdrawals = withdrawalsQuery.data ?? [];
  const allPartners = partnerEarnings.data ?? [];
  const allRiders = riderEarnings.data ?? [];
  const allTxns = transactionsQuery.data ?? [];
  const kpis = kpisQuery.data ?? [];

  const decideMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) => decideWithdrawal(id, action),
    onSuccess: (_d, vars) => {
      toast.success(`Withdrawal payout ${vars.action}d successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "kpis"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "all-wallets"] });
    },
    onError: () => {
      toast.error("Failed to update withdrawal status.");
    },
  });

  const filteredWallets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allWallets.filter((w) => {
      const matchSearch = !q || [w.name, w.phone, w.city, w.role, w.id].join(" ").toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || w.role.toLowerCase() === roleFilter.toLowerCase();
      return matchSearch && matchRole;
    });
  }, [allWallets, searchQuery, roleFilter]);

  const handleExportLedger = () => {
    if (allTxns.length === 0) {
      toast.error("No transactions to export.");
      return;
    }
    const headers = ["Transaction ID", "Account Name", "Account Role", "Type / Description", "Amount (INR)", "Status", "Date", "Order Ref"];
    const csvRows = [headers.join(",")];
    for (const t of allTxns) {
      csvRows.push(
        [
          `"${t.id}"`,
          `"${t.account}"`,
          `"${t.role}"`,
          `"${t.kind}"`,
          `"${t.amount}"`,
          `"${t.status}"`,
          `"${t.date}"`,
          `"${t.refOrder || "—"}"`,
        ].join(","),
      );
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QuickPress_Finance_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Finance ledger exported successfully! 🚀");
  };

  return (
    <AdminShell
      title="Wallet, Payouts & Settlement Center"
      subtitle="Multi-entity wallets, platform commission 18%, partner wash escrow 70%, captain earnings 12%, and payout approvals."
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              kpisQuery.refetch();
              walletsQuery.refetch();
              withdrawalsQuery.refetch();
              transactionsQuery.refetch();
              toast.success("Wallet & Finance intelligence refreshed!");
            }}
            disabled={walletsQuery.isRefetching}
            className="h-8 rounded-xl border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${walletsQuery.isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportLedger}
            className="h-8 rounded-xl bg-zinc-900 px-3 text-xs font-bold text-white hover:bg-zinc-800 shadow-xs"
          >
            <Download className="size-3.5 mr-1.5" />
            <span>Export Ledger CSV</span>
          </Button>

          <ManualAdjustDialog />
        </div>
      }
    >
      <div className="space-y-6">
        {/* =========================================================================
            1. TOP FINANCIAL KPI SUMMARY CARDS (6 METRICS)
        ========================================================================= */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <KpiCard
            kpi={{
              id: "gmv",
              label: "Gross GMV (Delivered)",
              value: "₹492.00",
              hint: "Total delivered orders",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "platform-comm",
              label: "Platform Comm (18%)",
              value: "₹88.56",
              hint: "Retained net revenue",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "partner-escrow",
              label: "Partner Escrow (70%)",
              value: "₹344.40",
              hint: "Payable to stores",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "rider-share",
              label: "Fleet Share (12%)",
              value: "₹59.04",
              hint: "Payable to captains",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "pending-payouts",
              label: "Pending Withdrawals",
              value: `${allWithdrawals.filter((w) => w.status === "Pending").length} Requests`,
              hint: "Awaiting approval",
              positive: false,
            }}
          />
          <KpiCard
            kpi={{
              id: "cod-cash",
              label: "Fleet COD in Hand",
              value: "₹120.00",
              hint: "Physical cash with riders",
              positive: true,
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
                  👥 All User & Store Wallets ({allWallets.length})
                </TabsTrigger>
                <TabsTrigger value="withdrawals" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  💸 Payout & Withdrawal Requests ({allWithdrawals.length})
                </TabsTrigger>
                <TabsTrigger value="split" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  📊 Revenue Split (18% / 70% / 12%)
                </TabsTrigger>
                <TabsTrigger value="ledger" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  📜 Unified Ledger Audit
                </TabsTrigger>
                <TabsTrigger value="cod" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  💵 Fleet COD Cash Settlement
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>Double-Entry Protected</span>
            </div>
          </div>

          {activeTab === "wallets" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="relative lg:col-span-3">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search wallet by name, phone, city, or ID..."
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-10 rounded-xl bg-zinc-50 border-zinc-200 text-xs">
                  <SelectValue placeholder="All Account Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Account Types</SelectItem>
                  <SelectItem value="partner">🏪 Partner Store Wallets</SelectItem>
                  <SelectItem value="rider">🚴 Delivery Captain Wallets</SelectItem>
                  <SelectItem value="customer">👥 Customer Wallets</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </SectionCard>

        {/* =========================================================================
            3. TAB 1: ALL USER & ENTITY WALLETS
        ========================================================================= */}
        {activeTab === "wallets" && (
          <SectionCard
            title="Live Multi-Entity Wallet Directory"
            description="Inspect real-time wallet balances, lifetime earnings, spend history, and trigger manual admin balance adjustments."
          >
            <DataTable
              loading={walletsQuery.isLoading}
              rows={filteredWallets}
              emptyMessage="No wallet accounts found."
              columns={[
                {
                  key: "account",
                  label: "Account & Role",
                  render: (w) => (
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-9 items-center justify-center rounded-xl font-bold text-xs ${
                          w.role === "partner"
                            ? "bg-emerald-100 text-emerald-800"
                            : w.role === "rider"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {w.role === "partner" ? <Store className="size-4" /> : w.role === "rider" ? <Bike className="size-4" /> : <User className="size-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                          {w.name}
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                              w.role === "partner"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : w.role === "rider"
                                ? "bg-sky-50 text-sky-700 border border-sky-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {w.role}
                          </span>
                        </p>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          {w.phone || "No phone"} · {w.city}
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "balance",
                  label: "Current Balance",
                  render: (w) => (
                    <div className="text-xs">
                      <span className="inline-flex items-center gap-0.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 border border-emerald-200">
                        ₹{w.balance.toFixed(2)}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "earned",
                  label: "Total Earned (70%/12%)",
                  render: (w) => (
                    <span className="text-xs font-bold text-zinc-700">
                      {w.totalEarned > 0 ? `₹${w.totalEarned.toFixed(2)}` : "—"}
                    </span>
                  ),
                },
                {
                  key: "spent",
                  label: "Total Spent",
                  render: (w) => (
                    <span className="text-xs font-bold text-zinc-700">
                      {w.totalSpent > 0 ? `₹${w.totalSpent.toFixed(2)}` : "—"}
                    </span>
                  ),
                },
                {
                  key: "cod",
                  label: "COD in Hand",
                  render: (w) =>
                    w.codCashInHand > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-800 border border-amber-200">
                        <Banknote className="size-3" /> ₹{w.codCashInHand.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-zinc-300 text-xs">—</span>
                    ),
                },
                {
                  key: "actions",
                  label: "",
                  className: "text-right",
                  render: (w) => (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs font-bold text-zinc-700 hover:bg-zinc-100 hover:text-emerald-700 rounded-lg"
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
            4. TAB 2: PAYOUT & WITHDRAWAL REQUESTS
        ========================================================================= */}
        {activeTab === "withdrawals" && (
          <SectionCard
            title="Pending Payout & Withdrawal Requests"
            description="Review withdrawal requests submitted by laundry partner hubs and delivery captains."
          >
            <DataTable
              loading={withdrawalsQuery.isLoading}
              rows={allWithdrawals}
              emptyMessage="No pending withdrawal requests."
              columns={[
                {
                  key: "account",
                  label: "Beneficiary Account",
                  render: (p) => (
                    <div>
                      <p className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                        {p.account}
                        <span className="rounded bg-zinc-100 text-zinc-600 text-[10px] px-1.5 py-0.2 font-bold">{p.type}</span>
                      </p>
                      <p className="text-[10px] text-zinc-400">{p.method}</p>
                    </div>
                  ),
                },
                {
                  key: "amount",
                  label: "Requested Amount",
                  render: (p) => <span className="font-black text-xs text-zinc-900">{p.amount}</span>,
                },
                {
                  key: "requested",
                  label: "Request Date",
                  render: (p) => <span className="text-xs text-zinc-500">{p.requested}</span>,
                },
                {
                  key: "status",
                  label: "Status",
                  render: (p) => <StatusPill value={p.status} />,
                },
                {
                  key: "actions",
                  label: "",
                  className: "text-right",
                  render: (p) =>
                    p.status === "Pending" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg px-2.5"
                          onClick={() => decideMutation.mutate({ id: p.id, action: "approve" })}
                          disabled={decideMutation.isPending}
                        >
                          <Check className="size-3 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs font-bold text-red-600 hover:bg-red-50 border-red-200 rounded-lg px-2.5"
                          onClick={() => decideMutation.mutate({ id: p.id, action: "reject" })}
                          disabled={decideMutation.isPending}
                        >
                          <X className="size-3 mr-1" /> Reject
                        </Button>
                      </div>
                    ) : null,
                },
              ]}
            />
          </SectionCard>
        )}

        {/* =========================================================================
            5. TAB 3: REVENUE SPLIT (18% / 70% / 12%)
        ========================================================================= */}
        {activeTab === "split" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Platform Commission</span>
                <p className="text-3xl font-black text-emerald-950">18.0%</p>
                <p className="text-xs text-emerald-700 font-medium">Net platform revenue retained from each completed order.</p>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-800">Partner Store Escrow</span>
                <p className="text-3xl font-black text-sky-950">70.0%</p>
                <p className="text-xs text-sky-700 font-medium">Disbursed directly to partner laundry hub for processing & washing.</p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Captain Fleet Share</span>
                <p className="text-3xl font-black text-amber-950">12.0%</p>
                <p className="text-xs text-amber-700 font-medium">Credited directly to delivery rider wallet per pickup & delivery.</p>
              </div>
            </div>

            <SectionCard title="Store-Wise Earnings & Escrow Breakdown" description="70% share allocated to laundry partner hubs.">
              <DataTable
                loading={partnerEarnings.isLoading}
                rows={allPartners}
                columns={[
                  { key: "account", label: "Partner Store", render: (r) => <span className="font-bold text-xs text-zinc-900">{r.account}</span> },
                  { key: "city", label: "City", render: (r) => <span className="text-xs text-zinc-500">{r.city}</span> },
                  { key: "orders", label: "Delivered Orders", render: (r) => <span className="text-xs font-bold">{r.orders}</span> },
                  { key: "gross", label: "Gross GMV", render: (r) => <span className="font-bold text-xs text-zinc-700">{r.gross}</span> },
                  { key: "commission", label: "Platform Comm (18%)", render: (r) => <span className="font-bold text-xs text-emerald-700">{r.commission}</span> },
                  { key: "net", label: "Store Net Earning (70%)", render: (r) => <span className="font-black text-xs text-sky-700">{r.net}</span> },
                ]}
              />
            </SectionCard>
          </div>
        )}

        {/* =========================================================================
            6. TAB 4: UNIFIED DOUBLE-ENTRY LEDGER
        ========================================================================= */}
        {activeTab === "ledger" && (
          <SectionCard
            title="Unified Double-Entry Transaction Ledger"
            description="Complete immutable record of all customer payments, store credits, commission deductions, and wallet adjustments."
          >
            <DataTable
              loading={transactionsQuery.isLoading}
              rows={allTxns}
              emptyMessage="No ledger transactions found."
              columns={[
                {
                  key: "id",
                  label: "Transaction ID",
                  render: (t) => <span className="font-mono text-[11px] font-black text-zinc-900">{t.id}</span>,
                },
                {
                  key: "account",
                  label: "Account & Role",
                  render: (t) => (
                    <div>
                      <p className="font-bold text-zinc-900 text-xs">{t.account}</p>
                      <span className="text-[10px] text-zinc-400 capitalize">{t.role}</span>
                    </div>
                  ),
                },
                {
                  key: "kind",
                  label: "Transaction Type",
                  render: (t) => (
                    <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
                      {t.kind}
                    </span>
                  ),
                },
                {
                  key: "amount",
                  label: "Amount",
                  render: (t) => (
                    <span className="font-black text-xs text-zinc-900">
                      ₹{t.amount.toFixed(2)}
                    </span>
                  ),
                },
                {
                  key: "date",
                  label: "Date",
                  render: (t) => <span className="text-xs text-zinc-400">{t.date}</span>,
                },
                {
                  key: "refOrder",
                  label: "Order Ref",
                  render: (t) => <span className="font-mono text-[10px] text-zinc-500">{t.refOrder || "—"}</span>,
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
            7. TAB 5: FLEET COD CASH SETTLEMENT
        ========================================================================= */}
        {activeTab === "cod" && (
          <SectionCard
            title="Fleet Cash on Delivery (COD) Collection & Settlements"
            description="Manage physical cash collected from customers by delivery captains awaiting deposit into company accounts."
          >
            <div className="rounded-2xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
              <div className="p-4 flex items-center justify-between bg-zinc-50">
                <div>
                  <p className="font-bold text-xs text-zinc-900">Rahul Express Rider</p>
                  <p className="text-[10px] text-zinc-400">Kasganj Sector 1 · Motorbike (UP-87-AK-4402)</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                    ₹120.00 COD in Hand
                  </span>
                  <Button
                    size="sm"
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                    onClick={() => toast.success("COD Cash ₹120.00 marked as collected & settled! 🎉")}
                  >
                    <CheckCircle2 className="size-3.5 mr-1" /> Mark Settled
                  </Button>
                </div>
              </div>
            </div>
          </SectionCard>
        )}
      </div>

      {/* Manual Adjust Modal when row clicked */}
      {adjustTarget && (
        <AdjustTargetModal
          wallet={adjustTarget}
          onClose={() => setAdjustTarget(null)}
        />
      )}
    </AdminShell>
  );
}

/* =========================================================================
   8. MANUAL WALLET ADJUSTMENT MODAL
========================================================================= */
function ManualAdjustDialog() {
  const queryClient = useQueryClient();
  const wallets = useQuery({ queryKey: ["admin", "finance", "all-wallets"], queryFn: fetchAllWallets });
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"credit" | "debit">("credit");
  const [reason, setReason] = useState("");

  const allWallets = wallets.data ?? [];
  const selectedAccount = allWallets.find((w) => w.id === accountId);

  const adjustMutation = useMutation({
    mutationFn: () =>
      adjustWalletBalance({
        accountId,
        role: (selectedAccount?.role as any) || "customer",
        amount: parseFloat(amount) || 0,
        type,
        reason: reason || "Manual Admin Adjustment",
      }),
    onSuccess: () => {
      toast.success("Wallet balance adjusted successfully! 🎉");
      setOpen(false);
      setAmount("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "all-wallets"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "kpis"] });
    },
    onError: () => {
      toast.error("Failed to adjust wallet balance.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs">
          <Plus className="size-3.5 mr-1" />
          <span>Adjust Balance</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white text-zinc-900 border-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-base font-black">Manual Wallet Adjustment</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Credit or debit funds to/from any Customer, Partner, or Rider wallet with immediate audit logging.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="space-y-1">
            <Label className="text-xs font-bold">Select Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Choose account to adjust..." />
              </SelectTrigger>
              <SelectContent>
                {allWallets.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} ({w.role.toUpperCase()}) — Balance: ₹{w.balance.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Adjustment Action</Label>
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
              <Input type="number" placeholder="50.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Reason / Audit Remark</Label>
            <Input
              placeholder="e.g. Compensation for delay, promo incentive"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="rounded-xl text-xs font-bold">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => adjustMutation.mutate()}
            disabled={!accountId || !amount || adjustMutation.isPending}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white"
          >
            {adjustMutation.isPending ? "Updating..." : "Execute Adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdjustTargetModal({ wallet, onClose }: { wallet: AccountWallet; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"credit" | "debit">("credit");
  const [reason, setReason] = useState("");

  const adjustMutation = useMutation({
    mutationFn: () =>
      adjustWalletBalance({
        accountId: wallet.id,
        role: wallet.role,
        amount: parseFloat(amount) || 0,
        type,
        reason: reason || `Manual Admin ${type} for ${wallet.name}`,
      }),
    onSuccess: () => {
      toast.success(`Wallet for ${wallet.name} adjusted successfully! 🎉`);
      onClose();
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "all-wallets"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "finance", "kpis"] });
    },
    onError: () => {
      toast.error("Failed to adjust wallet balance.");
    },
  });

  return (
    <Dialog open={Boolean(wallet)} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="sm:max-w-md bg-white text-zinc-900 border-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-base font-black">Adjust Balance for {wallet.name}</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Role: <strong className="capitalize">{wallet.role}</strong> · Current Balance: <strong>₹{wallet.balance.toFixed(2)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Adjustment Action</Label>
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
              <Input type="number" placeholder="50.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Reason / Audit Remark</Label>
            <Input
              placeholder="e.g. Refund, incentive, penalty correction"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs font-bold">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => adjustMutation.mutate()}
            disabled={!amount || adjustMutation.isPending}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white"
          >
            {adjustMutation.isPending ? "Updating..." : "Execute Adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
