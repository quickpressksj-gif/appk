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
} from "lucide-react";
import { toast } from "sonner";
import { RiderLayout } from "../components/layout/RiderLayout";
import {
  fetchRiderWallet,
  fetchRiderTransactions,
} from "../api/rider/rider-wallet-api";
import type { RiderTransaction } from "@/shared/types/rider";

export function RiderWalletScreen() {
  const [balance, setBalance] = useState(0);
  const [pendingSettlement, setPendingSettlement] = useState(0);
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0);
  const [transactions, setTransactions] = useState<RiderTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <RiderLayout
      activeTab="wallet"
      title="Earnings & Payouts"
      subtitle="Live Wallet Ledger · Auto Payout Every 2 Days"
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

            {/* AUTO PAYMENT 2 DAYS BADGE (Replaces Instant Withdraw) */}
            <div className="rounded-2xl border-2 border-emerald-800 bg-emerald-50 px-5 py-3.5 space-y-1 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="flex size-2.5 rounded-full bg-emerald-600 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
                  AUTO PAYOUT: EVERY 2 DAYS
                </span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-800">
                Transferred automatically every 48 hours
              </p>
            </div>
          </div>

          {/* Metrics: Pending Settlement & Lifetime Earnings */}
          <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-emerald-100 text-xs">
            <div className="rounded-2xl bg-emerald-50/50 p-3 border border-emerald-100">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Pending Settlement</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">
                ₹{pendingSettlement.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50/50 p-3 border border-emerald-100">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Lifetime Earnings</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">
                ₹{lifetimeEarnings.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. AUTO PAYOUT CYCLE POLICY BANNER (White & Dark Green)                    */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2.5 text-emerald-950">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-xs">
              <Clock className="size-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">
                Automated 2-Day Payout Rail
              </h3>
              <p className="text-[11px] font-medium text-slate-500">
                100% Direct &amp; Seamless Transfer
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed pt-1">
            All your delivery trip payouts, incentives, and cash collections are automatically balanced and credited directly every <strong>2 days</strong>. You do not need to submit manual withdrawal requests.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 3. RECENT PAYOUT TRANSACTIONS (Real Backend Ledger)                       */}
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
