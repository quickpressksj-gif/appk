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
import { SectionHeading, StatCard } from "../components/PartnerPrimitives";
import { usePartnerResource } from "../hooks/use-partner-resource";
import { partnerRoutes } from "../navigation/partner-routes";
import { fetchEarnings } from "@/api/partner/partner-earnings-api";
import { fetchPartnerProfile, requestPartnerWithdraw } from "@/api/partner/partner-profile-api";

const RANGES = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
] as const;

const PAYOUT_TONE: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  processing: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  failed: "bg-destructive/15 text-destructive",
};

export function EarningsScreen() {
  const navigate = useNavigate();
  const { data: earnings, mutate } = usePartnerResource(fetchEarnings);
  const { data: profile } = usePartnerResource(fetchPartnerProfile);

  const [activeSubTab, setActiveSubTab] = useState<"payouts" | "invoices">("payouts");
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("week");
  const [selectedPastRange, setSelectedPastRange] = useState("16 Jul - 16 Aug'26");
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const total = earnings ? earnings[range] : 0;
  const peak = earnings ? Math.max(...earnings.trend.map((p) => p.amount), 1) : 1;

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
      void mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to initiate payout");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleDownloadReport = () => {
    toast.success(`Generating settlement statement for ${selectedPastRange}...`);
  };

  return (
    <PartnerLayout
      activeTab="earnings"
      title="Payouts & Finance"
      subtitle="Track settlements, payout cycles and download GST invoices"
    >
      {/* ========================================================================= */}
      {/* MOBILE ZOMATO FINANCE VIEW (< md) Matching Screenshot 3                    */}
      {/* ========================================================================= */}
      <div className="min-h-screen bg-[#F4F5F7] pb-28 text-zinc-900 md:hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white px-4 pt-3.5 pb-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-base font-black tracking-tight text-zinc-900">
                  {profile?.businessName || profile?.ownerName || "QuickPress Partner"}
                </h1>
                <ChevronDown className="size-4 text-zinc-500 shrink-0" />
              </div>
              <p className="mt-0.5 truncate text-[11px] font-medium text-zinc-500">
                ID: {profile?.partnerId || "Store Account"} • {profile?.city ? `${profile.city}` : "Settlement Account"}
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

        {activeSubTab === "invoices" ? (
          /* Invoices & Taxes Tab View */
          <div className="space-y-4 p-4">
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm text-center">
              <FileText className="mx-auto size-10 text-zinc-400" />
              <h3 className="mt-3 text-sm font-black text-zinc-900">GST Invoices & Statements</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Monthly commission invoices are generated on the 1st of every calendar month.
              </p>
              <button
                type="button"
                onClick={() => toast.success("No GST invoice pending for download.")}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-sm active:scale-95"
              >
                <Download className="size-3.5" />
                <span>Download Latest GST Invoice</span>
              </button>
            </div>
          </div>
        ) : (
          /* Payouts Tab View */
          <div className="space-y-4 p-4">
            {/* Current Cycle Card */}
            <div>
              <h2 className="text-base font-black tracking-tight text-zinc-900">Current cycle</h2>
              <div className="mt-2 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold text-zinc-500">
                  Est. payout ({new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })} - Weekly Cycle)
                </p>
                <p className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
                  ₹{earnings ? earnings.today.toFixed(2) : "0.00"}
                </p>
                <p className="mt-0.5 text-xs font-medium text-zinc-500">
                  {earnings ? `${earnings.completedOrders} orders settled` : "0 orders"}
                </p>

                <div className="my-4 border-t border-dashed border-zinc-200" />

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[11px] text-zinc-400 font-bold uppercase">Payout for</p>
                    <p className="font-bold text-zinc-800">Current Week</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-400 font-bold uppercase">Payout date</p>
                    <p className="font-bold text-zinc-800">Daily T+1 (Instant)</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setWithdrawModalOpen(true)}
                    className="text-xs font-black text-blue-600 flex items-center gap-1 hover:underline"
                  >
                    Request instant withdrawal →
                  </button>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                    Net 80%
                  </span>
                </div>
              </div>
            </div>

            {/* Past Cycles Section */}
            <div>
              <h2 className="text-base font-black tracking-tight text-zinc-900">Past cycles</h2>
              <div className="mt-2.5 flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    value={selectedPastRange}
                    onChange={(e) => setSelectedPastRange(e.target.value)}
                    className="h-11 w-full appearance-none rounded-2xl border border-zinc-200 bg-white pl-4 pr-10 text-xs font-black text-zinc-800 shadow-xs focus:border-zinc-400 focus:outline-none"
                  >
                    <option value="16 Jul - 16 Aug'26">16 Jul - 16 Aug'26</option>
                    <option value="16 Jun - 15 Jul'26">16 Jun - 15 Jul'26</option>
                    <option value="16 May - 15 Jun'26">16 May - 15 Jun'26</option>
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

              {/* Past Cycles List or Empty State */}
              <div className="mt-3">
                {(!earnings?.payouts || earnings.payouts.length === 0) ? (
                  <div className="rounded-2xl border border-zinc-200/80 bg-white p-8 text-center shadow-sm">
                    <p className="text-xs font-bold text-zinc-400">
                      No past payouts are available for the selected date range
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
                    {earnings.payouts.map((payout) => (
                      <div key={payout.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-xs font-black text-zinc-900">{payout.reference}</p>
                          <p className="text-[10px] font-medium text-zinc-500">{payout.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-zinc-900">₹{payout.amount.toLocaleString("en-IN")}</p>
                          <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700 uppercase">
                            {payout.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP FINANCE VIEW (>= md)                                              */}
      {/* ========================================================================= */}
      <div className="hidden mx-auto w-full max-w-7xl px-4 py-4 md:block md:px-8 md:py-6">
        {!earnings ? (
          <PartnerCardsSkeleton />
        ) : (
          <div className="animate-soft-fade space-y-6 pb-12">
            {/* Top Period Selector */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5 rounded-2xl border border-border bg-card p-1 shadow-sm">
                {RANGES.map((item) => {
                  const isActive = item.id === range;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRange(item.id)}
                      className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                        isActive
                          ? "bg-primary text-brand-dark shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setWithdrawModalOpen(true)}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
              >
                <ArrowDownToLine className="size-4" />
                <span>Request Payout</span>
              </button>
            </div>

            {/* Main Balance Banner & Metric Cards */}
            <div className="grid gap-6 lg:grid-cols-3">
              <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-zinc-900 to-brand-green p-6 text-white shadow-soft lg:col-span-1">
                <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-primary/25 blur-2xl" />
                <p className="text-xs font-bold uppercase tracking-widest text-white/70">
                  {RANGES.find((r) => r.id === range)?.label} Earnings
                </p>
                <p className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
                  ₹{total.toLocaleString("en-IN")}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-white/80">
                  <TrendingUp className="size-4 text-emerald-400" />
                  Avg order: ₹{earnings.avgOrderValue} · {earnings.completedOrders} orders
                </p>
              </section>

              <div className="grid grid-cols-2 gap-4 lg:col-span-2">
                <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/20 text-brand-dark">
                      <Wallet className="size-5" />
                    </span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Withdrawable Balance
                      </p>
                      <p className="text-2xl font-black text-foreground">₹{total}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600">
                      <DollarSign className="size-5" />
                    </span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Partner Net Rate
                      </p>
                      <p className="text-2xl font-black text-foreground">80%</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600">
                      <Clock3 className="size-5" />
                    </span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Settlement Cycle
                      </p>
                      <p className="text-lg font-black text-foreground">T+1 Daily</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-600">
                      <Building className="size-5" />
                    </span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Direct Bank Transfer
                      </p>
                      <p className="text-lg font-black text-foreground">IMPS / NEFT</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 7-Day Trend Chart */}
            <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
              <SectionHeading title="Daily Earnings Trend" />
              <div className="mt-6 flex h-44 items-end justify-between gap-3 border-b border-border/70 pb-2">
                {earnings.trend.map((point) => (
                  <div key={point.label} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] font-bold text-foreground">₹{point.amount}</span>
                    <div
                      style={{
                        height: `${Math.max(12, Math.round((point.amount / peak) * 100))}%`,
                      }}
                      className="w-full max-w-[40px] rounded-t-xl bg-gradient-to-t from-primary/80 to-primary transition-all duration-500"
                    />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      {point.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Instant Withdrawal Modal */}
      {withdrawModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setWithdrawModalOpen(false)}
            className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-black text-foreground">Request Instant Bank Transfer</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Transfer your store earnings directly to your verified bank account.
            </p>

            <form onSubmit={handleWithdraw} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground">
                  Withdrawal Amount (₹)
                </label>
                <input
                  type="number"
                  min="100"
                  step="1"
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount (min ₹100)"
                  className="mt-1.5 h-12 w-full rounded-2xl border border-border bg-muted/30 px-4 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="rounded-2xl border border-border/80 bg-muted/40 p-3.5 text-xs space-y-1.5">
                <div className="flex justify-between text-muted-foreground">
                  <span>Available Balance:</span>
                  <span className="font-bold text-foreground">₹{total}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Settlement Fee:</span>
                  <span className="font-bold text-emerald-600">FREE (Instant IMPS)</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="flex-1 rounded-2xl border border-border py-3 text-xs font-bold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWithdrawing}
                  className="flex-1 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isWithdrawing ? "Processing..." : "Confirm & Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <Toaster />
    </PartnerLayout>
  );
}
