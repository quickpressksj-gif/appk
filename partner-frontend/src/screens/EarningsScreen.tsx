import { useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  BadgeIndianRupee,
  Bell,
  Building,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock3,
  DollarSign,
  Download,
  FileText,
  HelpCircle,
  Menu,
  PackageCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerLayout } from "../components/layout/PartnerLayout";
import { PartnerCardsSkeleton } from "../components/PartnerSkeletons";
import { usePartnerResource } from "../hooks/use-partner-resource";
import { partnerRoutes } from "../navigation/partner-routes";
import { fetchPartnerProfile, requestPartnerWithdraw } from "@/api/partner/partner-profile-api";
import {
  type FinanceOverviewResponse,
  type TaxInvoice,
  fetchFinanceOverview,
  fetchFinanceTaxInvoices,
  downloadSettlementReport,
} from "@/api/partner/partner-finance-api";
import { SettlementSummaryModal } from "../components/finance/SettlementSummaryModal";

export function EarningsScreen() {
  const navigate = useNavigate();
  const { data: profile } = usePartnerResource(fetchPartnerProfile);

  const [financeData, setFinanceData] = useState<FinanceOverviewResponse | null>(null);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeSubTab, setActiveSubTab] = useState<"payouts" | "invoices">("payouts");
  const [selectedPastRange, setSelectedPastRange] = useState<string>("");
  const [selectedCycleForModal, setSelectedCycleForModal] = useState<string | null>(null);

  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchFinanceOverview().catch(() => null),
      fetchFinanceTaxInvoices().catch(() => ({ invoices: [] })),
    ]).then(([overview, invRes]) => {
      if (!alive) return;
      if (overview) {
        setFinanceData(overview);
        if (overview.filterOptions?.length && !selectedPastRange) {
          setSelectedPastRange(overview.filterOptions[0]);
        }
      }
      if (invRes?.invoices) {
        setInvoices(invRes.invoices);
      }
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const handleDownloadReport = async () => {
    const cycle = financeData?.pastCycles.find((c) => c.period === selectedPastRange) || financeData?.pastCycles[0];
    if (!cycle) {
      toast.error("No statement available for selected range");
      return;
    }
    toast.success(`Generating settlement statement for ${selectedPastRange}...`);
    try {
      const res = await downloadSettlementReport(cycle.cycleId);
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(res.data, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", res.filename || `QuickPress_Statement_${cycle.cycleId}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Statement downloaded successfully!");
    } catch {
      toast.error("Failed to generate report");
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }
    if (amount < 100) {
      toast.error("Minimum withdrawal amount is ₹100");
      return;
    }
    setIsWithdrawing(true);
    try {
      await requestPartnerWithdraw(amount);
      toast.success(`Withdrawal of ₹${amount} initiated to registered bank account!`);
      setWithdrawModalOpen(false);
      setWithdrawAmount("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to initiate payout");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const currentCycle = financeData?.currentCycle;
  const pastCycles = financeData?.pastCycles || [];

  return (
    <PartnerLayout
      activeTab="earnings"
      title="Payouts & Finance"
      subtitle="Track settlements, payout cycles and download GST invoices"
    >
      {/* ========================================================================= */}
      {/* MOBILE VIEW (< md) Matching Exact Reference Screenshots                    */}
      {/* ========================================================================= */}
      <div className="min-h-screen bg-[#F4F5F7] pb-28 text-zinc-900 md:hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white px-4 pt-3.5 pb-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-base font-black tracking-tight text-zinc-900">
                  {profile?.businessName || profile?.ownerName || "QuickPress Laundry Store"}
                </h1>
                <ChevronDown className="size-4 text-zinc-500 shrink-0" />
              </div>
              <p className="mt-0.5 truncate text-[11px] font-semibold text-zinc-500">
                ID: {profile?.partnerId || "22391793"} • {profile?.city ? `${profile.city} Locality, ${profile.city}` : "Kasganj Locality, Kasganj"}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={partnerRoutes.notifications}
                className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 transition-transform active:scale-95"
              >
                <Bell className="size-4" />
              </Link>
              <div className="flex size-9 items-center justify-center rounded-full bg-blue-600 text-white font-black text-xs shadow-sm">
                <Sparkles className="size-4 fill-current" />
              </div>
              <Link
                to={partnerRoutes.profile}
                className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-800"
              >
                <Menu className="size-5" />
              </Link>
            </div>
          </div>

          {/* Subtabs: Payouts vs Invoices & Taxes */}
          <div className="mt-3.5 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab("payouts")}
              className={`rounded-full px-5 py-2 text-xs font-black transition-all active:scale-95 ${
                activeSubTab === "payouts"
                  ? "bg-zinc-950 text-white shadow-sm"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
              }`}
            >
              Payouts
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("invoices")}
              className={`rounded-full px-5 py-2 text-xs font-black transition-all active:scale-95 ${
                activeSubTab === "invoices"
                  ? "bg-zinc-950 text-white shadow-sm"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
              }`}
            >
              Invoices & Taxes
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex h-96 flex-col items-center justify-center gap-3">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs font-bold text-zinc-500">Loading payout accounts...</p>
          </div>
        ) : activeSubTab === "invoices" ? (
          /* ========================================================================= */
          /* INVOICES & TAXES TAB VIEW                                                 */
          /* ========================================================================= */
          <div className="space-y-4 p-4">
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-black text-zinc-900">GST Commission Invoices</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Monthly commission tax invoices generated for input tax credit (ITC).
              </p>

              <div className="mt-4 divide-y divide-zinc-100">
                {invoices.map((inv) => (
                  <div key={inv.invoiceNumber} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-xs font-black text-zinc-900">{inv.invoiceNumber}</p>
                      <p className="text-[10px] font-medium text-zinc-500">{inv.period} • Generated on {inv.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-zinc-900">₹{inv.amount.toFixed(2)}</p>
                      <button
                        type="button"
                        onClick={() => toast.success(`Downloading invoice ${inv.invoiceNumber}...`)}
                        className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-black text-blue-600 hover:underline"
                      >
                        <Download className="size-2.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* PAYOUTS TAB VIEW (Matching Reference Screenshot 2)                        */
          /* ========================================================================= */
          <div className="space-y-4 p-4">
            
            {/* Current Ongoing Cycle Card */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold text-zinc-500">Payout for</p>
                  <p className="mt-0.5 text-xs font-black text-zinc-900">
                    {currentCycle?.period || "31 Aug - 06 Sep'26"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-zinc-500">Payout date</p>
                  <p className="mt-0.5 text-xs font-black text-zinc-900">
                    {currentCycle?.payoutDate || "-"}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-zinc-100 pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedCycleForModal("current")}
                  className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>View details</span>
                  <span>→</span>
                </button>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">
                  {currentCycle?.status || "PROCESSING"}
                </span>
              </div>
            </div>

            {/* Past Cycles Section */}
            <div>
              <h2 className="text-base font-black tracking-tight text-zinc-900">Past cycles</h2>
              
              {/* Date Filter Dropdown & Get Report Button */}
              <div className="mt-2.5 flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    value={selectedPastRange}
                    onChange={(e) => setSelectedPastRange(e.target.value)}
                    className="h-11 w-full appearance-none rounded-2xl border border-zinc-200 bg-white pl-4 pr-10 text-xs font-black text-zinc-800 shadow-xs focus:border-zinc-400 focus:outline-none"
                  >
                    {financeData?.filterOptions?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    {!financeData?.filterOptions?.length && (
                      <option value="02 - 08 Feb'26">02 - 08 Feb'26</option>
                    )}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                </div>

                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="flex h-11 items-center gap-1.5 rounded-2xl bg-zinc-950 px-4 text-xs font-black text-white shadow-sm transition-transform active:scale-95"
                >
                  <Download className="size-3.5" />
                  <span>Get report</span>
                </button>
              </div>

              {/* Selected Filter Range Result Card */}
              {pastCycles.length > 0 && (
                <div className="mt-3 space-y-3">
                  <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-zinc-500">Est. net payout</p>
                        <p className="mt-0.5 text-2xl font-black text-zinc-900">
                          ₹{pastCycles[0].netPayout.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-bold text-zinc-500">Orders</p>
                        <p className="mt-0.5 text-xs font-black text-zinc-900">{pastCycles[0].orderCount}</p>
                      </div>
                    </div>

                    {/* Yellow Info Banner */}
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#FEF6E8] p-3 text-zinc-800">
                      <HelpCircle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                      <p className="text-[11px] font-medium leading-relaxed text-zinc-700">
                        This is based on transactions for the selected date range. Details of the involved payout cycles are given below
                      </p>
                    </div>

                    <div className="mt-3 border-t border-zinc-100 pt-3">
                      <button
                        type="button"
                        onClick={() => setSelectedCycleForModal(pastCycles[0].cycleId)}
                        className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <span>View details</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Settled Past Cycle Cards */}
                  {pastCycles.map((cycle) => (
                    <div key={cycle.cycleId} className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-zinc-500">Net payout</p>
                          <p className="mt-0.5 text-xl font-black text-zinc-900">
                            ₹{cycle.netPayout.toFixed(2)}
                          </p>
                          <p className="text-[10px] font-medium text-zinc-400">{cycle.orderCount} orders</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold text-zinc-500">Status</p>
                          <span className="mt-1 inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                            {cycle.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-dashed border-zinc-100 pt-2.5 text-xs">
                        <div>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase">Payout for</p>
                          <p className="font-bold text-zinc-800">{cycle.period}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-zinc-400 font-bold uppercase">Payout date</p>
                          <p className="font-bold text-zinc-800">{cycle.payoutDate}</p>
                        </div>
                      </div>

                      <div className="mt-3 border-t border-zinc-100 pt-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCycleForModal(cycle.cycleId)}
                          className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <span>View details</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP VIEW (>= md)                                                      */}
      {/* ========================================================================= */}
      <div className="hidden mx-auto w-full max-w-7xl px-4 py-4 md:block md:px-8 md:py-6">
        {loading ? (
          <PartnerCardsSkeleton />
        ) : (
          <div className="space-y-6 pb-12">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-foreground">Partner Finance & Settlements</h1>
                <p className="text-xs text-muted-foreground">
                  Track itemized settlement breakdowns, commission deductions, TDS 194-O, and bank payouts.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCycleForModal("current")}
                  className="flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-zinc-800 active:scale-95"
                >
                  <FileText className="size-4" />
                  <span>Current Cycle Statement</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(true)}
                  className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-700 active:scale-95"
                >
                  <ArrowDownToLine className="size-4" />
                  <span>Request Withdrawal</span>
                </button>
              </div>
            </div>

            {/* Desktop Overview Grid */}
            <div className="grid grid-cols-3 gap-6">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Current Week Accrued Payout
                </p>
                <p className="mt-2 text-3xl font-black text-foreground">
                  ₹{currentCycle?.estPayout ? currentCycle.estPayout.toFixed(2) : "0.00"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{currentCycle?.period}</p>
                <button
                  type="button"
                  onClick={() => setSelectedCycleForModal("current")}
                  className="mt-4 text-xs font-black text-blue-600 hover:underline"
                >
                  View itemized breakdown →
                </button>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm col-span-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-foreground">Settlement History</h2>
                  <button
                    type="button"
                    onClick={handleDownloadReport}
                    className="flex items-center gap-1.5 text-xs font-black text-zinc-900 hover:underline"
                  >
                    <Download className="size-3.5" />
                    <span>Download Selected Statement</span>
                  </button>
                </div>

                <div className="mt-4 divide-y divide-border">
                  {pastCycles.map((cycle) => (
                    <div key={cycle.cycleId} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-xs font-black text-foreground">{cycle.period}</p>
                        <p className="text-[11px] text-muted-foreground">{cycle.orderCount} orders settled on {cycle.payoutDate}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-foreground">₹{cycle.netPayout.toFixed(2)}</span>
                        <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-600">
                          {cycle.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedCycleForModal(cycle.cycleId)}
                          className="text-xs font-black text-blue-600 hover:underline"
                        >
                          Details →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SETTLEMENT SUMMARY MODAL (DRILLDOWN VIEW)                                 */}
      {/* ========================================================================= */}
      {selectedCycleForModal && (
        <SettlementSummaryModal
          cycleId={selectedCycleForModal}
          onClose={() => setSelectedCycleForModal(null)}
        />
      )}

      {/* Manual Instant Withdrawal Modal */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl text-foreground">
            <h3 className="text-base font-black">Request Instant Bank Withdrawal</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Transfer eligible earnings directly to your verified bank account via IMPS (0 fees).
            </p>

            <form onSubmit={handleWithdraw} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Amount (₹)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-500">₹</span>
                  <input
                    type="number"
                    min="100"
                    step="1"
                    placeholder="500"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-border bg-background pl-8 pr-4 text-sm font-black text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="h-11 flex-1 rounded-2xl border border-border bg-background text-xs font-bold text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWithdrawing}
                  className="h-11 flex-1 rounded-2xl bg-emerald-600 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isWithdrawing ? "Processing..." : "Transfer Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toaster />
    </PartnerLayout>
  );
}
