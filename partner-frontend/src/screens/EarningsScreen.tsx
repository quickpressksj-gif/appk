import { useNavigate } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  BadgeIndianRupee,
  Building,
  CheckCircle2,
  Clock3,
  DollarSign,
  PackageCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerLayout } from "../components/layout/PartnerLayout";
import { PartnerCardsSkeleton } from "../components/PartnerSkeletons";
import { SectionHeading, StatCard } from "../components/PartnerPrimitives";
import { usePartnerResource } from "../hooks/use-partner-resource";
import { partnerRoutes } from "../navigation/partner-routes";
import { fetchEarnings } from "@/api/partner/partner-earnings-api";
import { requestPartnerWithdraw } from "@/api/partner/partner-profile-api";

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
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("week");
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

  return (
    <PartnerLayout
      activeTab="earnings"
      title="Payouts & Earnings"
      subtitle="Financial overview, earnings rate (80% net), and automated bank settlement"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-8 md:py-6">
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

            {/* Payout Settlements Ledger */}
            <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
              <SectionHeading title="Recent Payout Settlements" />
              <div className="mt-4 divide-y divide-border/60">
                {earnings.payouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground">
                        <BadgeIndianRupee className="size-4" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-foreground">{payout.reference}</p>
                        <p className="text-[10px] text-muted-foreground">{payout.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-foreground">
                        ₹{payout.amount.toLocaleString("en-IN")}
                      </p>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                          PAYOUT_TONE[payout.status] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {payout.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {withdrawModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setWithdrawModalOpen(false)}
            className="absolute inset-0 bg-brand-dark/50 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-black text-foreground">Request Bank Payout</h3>
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

              <div className="rounded-2xl border border-border/80 bg-muted/40 p-3 text-xs space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Gross Balance:</span>
                  <span className="font-bold text-foreground">₹{total}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Transfer Fee:</span>
                  <span className="font-bold text-emerald-600">FREE (Instant)</span>
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
                  {isWithdrawing ? "Processing..." : "Confirm Transfer"}
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
