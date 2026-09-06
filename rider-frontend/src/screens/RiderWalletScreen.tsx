import { useState, useEffect, useCallback } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock,
  IndianRupee,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
  CreditCard,
  Building2,
  Send,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { RiderLayout } from "../components/layout/RiderLayout";
import {
  fetchRiderWallet,
  fetchRiderTransactions,
  withdrawRiderEarnings,
} from "../api/rider/rider-wallet-api";
import type { RiderTransaction } from "@/shared/types/rider";
import { triggerHaptic, playSuccessChime } from "../lib/captain-audio";

export function RiderWalletScreen() {
  const [balance, setBalance] = useState(0);
  const [pendingSettlement, setPendingSettlement] = useState(0);
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0);
  const [transactions, setTransactions] = useState<RiderTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Load real wallet data from backend
  const loadWalletData = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const [walletRes, txnsRes] = await Promise.all([
        fetchRiderWallet().catch(() => ({ availableBalance: 0, pendingSettlement: 0, lifetimeEarnings: 0 })),
        fetchRiderTransactions().catch(() => []),
      ]);

      setBalance(walletRes.availableBalance || 0);
      setPendingSettlement(walletRes.pendingSettlement || 0);
      setLifetimeEarnings(walletRes.lifetimeEarnings || 0);
      setTransactions(txnsRes || []);

      if (showToast) toast.success("Wallet ledger refreshed from server");
    } catch {
      if (showToast) toast.error("Could not refresh wallet");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadWalletData();
    const interval = setInterval(() => void loadWalletData(), 20000);
    return () => clearInterval(interval);
  }, [loadWalletData]);

  const handleInstantWithdraw = async () => {
    const amt = Number(withdrawAmount || balance);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }
    if (amt > balance) {
      toast.error(`Cannot withdraw more than available balance (₹${balance})`);
      return;
    }

    setWithdrawing(true);
    triggerHaptic([50, 50]);

    try {
      await withdrawRiderEarnings(amt);
      playSuccessChime();
      toast.success(`₹${amt} Instant Payout initiated to linked UPI/Bank Account! 🎉`);
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      await loadWalletData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to initiate withdrawal");
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <RiderLayout
      activeTab="wallet"
      title="Earnings & Payouts"
      subtitle="Live Wallet Ledger · Auto Payout Rail & Instant Transfer"
    >
      <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6 select-none">
        {/* ========================================================================= */}
        {/* 1. MAIN WALLET BALANCE HERO CARD (White & Dark Green Theme)                */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-800 bg-white p-6 shadow-sm">
          <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-emerald-500/10 blur-2xl" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  Available Wallet Balance
                </span>
                <button
                  type="button"
                  onClick={() => void loadWalletData(true)}
                  disabled={refreshing}
                  className="text-slate-400 hover:text-emerald-800 transition-colors cursor-pointer"
                  title="Refresh Balance"
                >
                  <RefreshCw className={`size-3 ${refreshing ? "animate-spin text-emerald-800" : ""}`} />
                </button>
              </div>

              <p className="mt-1 flex items-center text-4xl sm:text-5xl font-black tracking-tight text-emerald-950">
                <IndianRupee className="size-8 sm:size-10 text-emerald-800" strokeWidth={2.6} />
                {balance.toLocaleString("en-IN")}
              </p>
            </div>

            {/* ACTION BUTTONS: INSTANT PAYOUT & AUTO 2-DAY STATUS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setWithdrawAmount(String(balance));
                  setShowWithdrawModal(true);
                }}
                disabled={balance < 1}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white px-5 py-3 text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Zap className="size-4 text-emerald-300" />
                <span>INSTANT PAYOUT</span>
              </button>

              <div className="rounded-2xl border-2 border-emerald-800 bg-emerald-50 px-4 py-2.5 space-y-0.5 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <span className="flex size-2 rounded-full bg-emerald-600 animate-ping" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950">
                    AUTO PAYOUT: 48H
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-emerald-800">
                  Zero fee automatic rail
                </p>
              </div>
            </div>
          </div>

          {/* Metrics: Pending Settlement & Lifetime Earnings */}
          <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-emerald-100 text-xs">
            <div className="rounded-2xl bg-emerald-50/50 p-3.5 border border-emerald-100">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Pending Settlement</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">
                ₹{pendingSettlement.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50/50 p-3.5 border border-emerald-100">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Lifetime Earnings</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">
                ₹{lifetimeEarnings.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. INSTANT WITHDRAWAL MODAL / DIALOG                                      */}
        {/* ========================================================================= */}
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border-2 border-emerald-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-950">
                  <div className="size-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center">
                    <Zap className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Instant UPI Payout</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Immediate transfer to Bank Account</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="size-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-emerald-900">
                  Withdrawal Amount (₹)
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-emerald-800" />
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="h-12 w-full rounded-2xl border-2 border-emerald-300 bg-white pl-10 pr-4 text-lg font-black text-slate-900 focus:border-emerald-800 focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Available: ₹{balance}</span>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(String(balance))}
                    className="text-emerald-800 font-bold hover:underline cursor-pointer"
                  >
                    Withdraw Full Balance
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-700" />
                  <span>Direct Bank Payout Guarantee</span>
                </p>
                <p className="text-[11px] text-emerald-700">
                  Funds will be sent via IMPS/UPI directly to your registered bank account on file.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 h-12 rounded-2xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInstantWithdraw}
                  disabled={withdrawing}
                  className="flex-1 h-12 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {withdrawing ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  <span>{withdrawing ? "Processing..." : "Transfer Now"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. AUTO PAYOUT CYCLE POLICY BANNER (White & Dark Green)                    */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2.5 text-emerald-950">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-xs">
              <Clock className="size-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">
                Automated 48-Hour Payout Rail
              </h3>
              <p className="text-[11px] font-medium text-slate-500">
                100% Direct &amp; Seamless Bank Transfer
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed pt-1">
            All your delivery trip payouts, incentives, and surge bonuses are automatically balanced and credited directly every <strong>2 days</strong>. You can also use <strong>Instant Payout</strong> anytime for immediate UPI transfers.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 4. RECENT PAYOUT TRANSACTIONS (Real Backend Ledger)                       */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900">
              Recent Payout Transactions ({transactions.length})
            </h3>
            <button
              type="button"
              onClick={() => void loadWalletData(true)}
              className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
            >
              Refresh Ledger
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
              Loading wallet transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/20 p-8 text-center space-y-1">
              <p className="text-sm font-bold text-slate-800">No transactions recorded yet</p>
              <p className="text-xs text-slate-500">
                When you accept and complete customer laundry pickup trips, your earnings will record here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                      {tx.direction === "credit" ? (
                        <ArrowDownLeft className="size-4.5" />
                      ) : (
                        <ArrowUpRight className="size-4.5" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{tx.title}</p>
                      <p className="text-[10px] font-medium text-slate-400">{tx.date}</p>
                    </div>
                  </div>

                  <span
                    className={`text-sm font-black ${
                      tx.direction === "credit" ? "text-emerald-800" : "text-slate-900"
                    }`}
                  >
                    {tx.direction === "credit" ? "+" : "-"}₹{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RiderLayout>
  );
}
