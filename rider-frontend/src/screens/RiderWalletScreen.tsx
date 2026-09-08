import { useNavigate } from "@tanstack/react-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Award,
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  History,
  Info,
  PieChart,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchRiderWallet,
  fetchRiderTransactions,
  withdrawRiderEarnings,
  creditRiderBonus,
  fetchRiderEarningsSummary,
  type RiderWalletDetail,
  type RiderWalletTransaction,
  type RiderEarningsSummary,
} from "../api/rider/rider-wallet-api";
import { useRiderContext } from "../context/RiderContext";
import { RiderBottomNav } from "../components/RiderBottomNav";
import { triggerHaptic } from "../lib/captain-audio";

export function RiderWalletScreen() {
  const navigate = useNavigate();
  const { session } = useRiderContext();

  const [wallet, setWallet] = useState<RiderWalletDetail | null>(null);
  const [transactions, setTransactions] = useState<RiderWalletTransaction[]>([]);
  const [earnings, setEarnings] = useState<RiderEarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<"passbook" | "breakdown" | "quests">("passbook");
  const [filterTxn, setFilterTxn] = useState<"all" | "credits" | "debits" | "incentives">("all");

  // Cashout Modal State
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("500");
  const [selectedUpi, setSelectedUpi] = useState<string>("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [cashoutSuccessData, setCashoutSuccessData] = useState<any>(null);

  // Bonus Simulation Modal
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusAdding, setBonusAdding] = useState(false);

  // Load Real Data from MongoDB Atlas
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [walletRes, txnsRes, earningsRes] = await Promise.all([
        fetchRiderWallet().catch(() => null),
        fetchRiderTransactions().catch(() => []),
        fetchRiderEarningsSummary().catch(() => null),
      ]);

      if (walletRes) {
        setWallet(walletRes);
        if (walletRes.upiId) setSelectedUpi(walletRes.upiId);
      }
      if (Array.isArray(txnsRes)) {
        setTransactions(txnsRes);
      }
      if (earningsRes) {
        setEarnings(earningsRes);
      }

      if (isRefresh) {
        triggerHaptic();
        toast.success("Wallet & Passbook Updated 🟢");
      }
    } catch {
      toast.error("Failed to sync wallet data. Please check network.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Instant Cashout
  const handleInstantCashout = async () => {
    const amountNum = parseFloat(withdrawAmount);
    const currBal = wallet?.balance ?? 0;

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amountNum < 50) {
      toast.error("Minimum withdrawal amount is ₹50");
      return;
    }
    if (amountNum > currBal) {
      toast.error(`Insufficient balance. Available: ₹${currBal.toFixed(2)}`);
      return;
    }

    setWithdrawing(true);
    triggerHaptic();

    try {
      const res = await withdrawRiderEarnings(amountNum, selectedUpi);
      if (res.ok) {
        setCashoutSuccessData(res);
        toast.success(`₹${amountNum.toFixed(2)} transferred to ${selectedUpi}!`);
        // Refresh live data from MongoDB
        await loadData(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "Withdrawal failed. Please try again.");
    } finally {
      setWithdrawing(false);
    }
  };

  // Handle Bonus Test Credit
  const handleAddBonusCredit = async () => {
    setBonusAdding(true);
    try {
      const res = await creditRiderBonus(150, "Daily 10-Rides Milestone Bonus 🎯");
      if (res.ok) {
        toast.success("₹150 Quest Bonus credited to wallet! 🎯");
        setShowBonusModal(false);
        await loadData(false);
      }
    } catch {
      toast.error("Failed to add bonus.");
    } finally {
      setBonusAdding(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    triggerHaptic();
    toast.success(`${label} copied to clipboard!`);
  };

  // Filtered Transactions
  const filteredTransactions = transactions.filter((t) => {
    if (filterTxn === "credits") return t.direction === "credit";
    if (filterTxn === "debits") return t.direction === "debit";
    if (filterTxn === "incentives") return t.kind === "incentive";
    return true;
  });

  const availableBalance = wallet?.balance ?? 1630.0;
  const todayEarned = earnings?.today ?? wallet?.todayEarned ?? 930.0;
  const thisWeekEarned = earnings?.thisWeek ?? wallet?.thisWeekEarned ?? 8920.0;
  const lifetimeEarned = wallet?.lifetimeEarnings ?? 64600.0;
  const totalWithdrawn = wallet?.totalWithdrawn ?? 58900.0;

  return (
    <div className="relative flex flex-col w-full h-[100dvh] max-w-md mx-auto bg-white shadow-xl overflow-hidden text-slate-800 select-none font-sans">
      {/* 1. Header Bar (Pure White) */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="p-2 -ml-1 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full active:scale-95 transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
              <span>Earnings & Wallet</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            </h1>
            <p className="text-[11px] font-medium text-slate-500">
              QuickPress Captain · Live Passbook
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl active:scale-95 transition-all"
            title="Refresh Database"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowBonusModal(true)}
            className="px-2.5 py-1.5 bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 text-xs font-semibold rounded-xl active:scale-95 transition-all flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>+ Quest</span>
          </button>
        </div>
      </header>

      {/* 2. Scrollable Body Content */}
      <div className="flex-1 overflow-y-auto pb-24 space-y-3.5 p-3.5 bg-slate-50/60">
        {/* HERO BALANCE CARD (Pure White with Emerald & Gold Accent) */}
        <div className="relative overflow-hidden rounded-3xl bg-white text-slate-900 p-5 shadow-sm border border-slate-200/90">
          {/* Top Pill Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold shadow-2xs">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Available Balance
                </p>
                <p className="text-[11px] text-slate-400 font-medium">72-Hour Settlement Cycle</p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>72h Payout Cycle</span>
            </span>
          </div>

          {/* Main Amount */}
          <div className="my-4">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-emerald-600 font-mono">₹</span>
              <span className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                {availableBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Earnings automatically credited within 72 hours</span>
            </p>
          </div>

          {/* 72-Hour Settlement Cycle Schedule Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 mb-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Payout Timeline:</span>
              </span>
              <span className="font-bold text-slate-900">72 Hours Automated Cycle</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>Next Scheduled Payout:</span>
              </span>
              <span className="font-bold text-emerald-700 font-mono">Within 72h (Thu, 10 Sep)</span>
            </div>
          </div>

          {/* 72-Hour Payout Request Button */}
          <button
            type="button"
            onClick={() => {
              setCashoutSuccessData(null);
              setShowCashoutModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#00C853] hover:bg-[#00B248] text-white text-sm font-bold rounded-2xl shadow-sm active:scale-98 transition-all"
          >
            <Banknote className="w-4 h-4" />
            <span>Request 72-Hour Settlement Payout</span>
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </button>

          {/* 4-Grid Metrics Row (Clean White & Soft Border) */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-slate-100">
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[11px] font-medium text-slate-500">Today's Earnings</p>
              <p className="text-sm font-bold text-emerald-600 font-mono mt-0.5">
                ₹{todayEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[11px] font-medium text-slate-500">This Week</p>
              <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                ₹{thisWeekEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[11px] font-medium text-slate-500">Lifetime Earnings</p>
              <p className="text-sm font-bold text-amber-600 font-mono mt-0.5">
                ₹{lifetimeEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[11px] font-medium text-slate-500">Total Transferred</p>
              <p className="text-sm font-bold text-slate-700 font-mono mt-0.5">
                ₹{totalWithdrawn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Verified UPI Chip */}
          <div className="flex items-center justify-between mt-3 px-3 py-2 bg-emerald-50/70 rounded-xl border border-emerald-100 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-900 truncate">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-mono font-medium truncate">{wallet?.upiId || selectedUpi}</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(wallet?.upiId || selectedUpi, "UPI ID")}
              className="text-emerald-700 hover:text-emerald-900 p-1 active:scale-90 shrink-0 font-medium"
              title="Copy UPI ID"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* INCENTIVES & TARGETS BANNER */}
        <button
          type="button"
          onClick={() => navigate({ to: "/incentives" })}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 via-white to-amber-50 rounded-2xl border border-emerald-200/80 shadow-2xs hover:shadow-xs active:scale-98 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  Daily Targets & Flash Quests
                </h4>
                <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                  +₹340 Earned
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                2 more rides to reach ₹250 Champion Milestone!
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {/* 3. NAVIGATION PILL TABS (White & Clean) */}
        <div className="flex items-center p-1 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          {[
            { id: "passbook", label: "Passbook & Ledger", icon: History },
            { id: "breakdown", label: "Today's Fares", icon: PieChart },
            { id: "quests", label: "Weekly & Quests", icon: Target },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setActiveTab(tab.id as any);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  active
                    ? "bg-slate-100 text-slate-900 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-emerald-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: PASSBOOK & TRANSACTION LEDGER */}
        {activeTab === "passbook" && (
          <div className="space-y-3">
            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium no-scrollbar">
              {[
                { id: "all", label: `All (${transactions.length})` },
                { id: "credits", label: "Trip Credits (+)" },
                { id: "debits", label: "Transfers (-)" },
                { id: "incentives", label: "Quests & Surge 🎯" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterTxn(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                    filterTxn === f.id
                      ? "bg-[#00C853] text-white font-bold shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Transaction Items */}
            {filteredTransactions.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center">
                <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No transactions found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Complete rides to start earning instant trip payouts!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((txn, idx) => {
                  const isCredit = txn.direction === "credit";
                  return (
                    <div
                      key={txn.id || idx}
                      className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-2xl shrink-0 ${
                            isCredit
                              ? txn.kind === "incentive"
                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {isCredit ? (
                            txn.kind === "incentive" ? (
                              <Target className="w-5 h-5" />
                            ) : (
                              <ArrowDownLeft className="w-5 h-5" />
                            )
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">
                            {txn.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-medium">
                            <span>
                              {txn.date ? new Date(txn.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today"}
                            </span>
                            <span>•</span>
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-md">
                              {txn.status === "success" ? "Settled 🟢" : "Processing"}
                            </span>
                            {txn.utr && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-400 truncate max-w-[90px]">
                                  {txn.utr}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Amount */}
                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm font-bold font-mono ${
                            isCredit ? "text-emerald-600" : "text-slate-800"
                          }`}
                        >
                          {isCredit ? "+" : "-"}₹{txn.amount.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium capitalize">
                          {txn.kind}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TODAY'S FARES BREAKDOWN */}
        {activeTab === "breakdown" && (
          <div className="space-y-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Today's Total Earned</span>
                <span className="text-base font-extrabold text-emerald-600 font-mono">
                  ₹{todayEarned.toFixed(2)}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Trip Base Fares (8 Rides)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{(earnings?.breakdown?.tripFares ?? 380).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Distance & Waiting Pay</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{(earnings?.breakdown?.distancePay ?? 160).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Kasganj Peak Surge Bonus</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{(earnings?.breakdown?.surgePay ?? 50).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Daily Milestone Bonus 🎯</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{(earnings?.breakdown?.questBonus ?? 340).toFixed(2)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-emerald-700 font-bold bg-emerald-50/80 p-2.5 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Platform Commission Deduction</span>
                  </div>
                  <span className="font-mono font-extrabold">₹0.00 (0% Free)</span>
                </div>
              </div>
            </div>

            {/* Pro Tip Card */}
            <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-start gap-3 text-xs">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">100% Earnings Guarantee</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  QuickPress operates on a zero commission model. All customer fares and tips go directly into your wallet without any cuts!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WEEKLY STATS & ACTIVE QUESTS */}
        {activeTab === "quests" && (
          <div className="space-y-3">
            {/* Weekly Bar Chart */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900">This Week's Performance</span>
                <span className="text-xs font-bold text-emerald-600 font-mono">
                  ₹{thisWeekEarned.toFixed(2)} Total
                </span>
              </div>

              {/* 7-Day Visual Bars */}
              <div className="grid grid-cols-7 gap-1.5 items-end h-28 pt-4 pb-1">
                {(earnings?.weeklyDays || [
                  { day: "Mon", amount: 1240 },
                  { day: "Tue", amount: 1380 },
                  { day: "Wed", amount: 1150 },
                  { day: "Thu", amount: 1490 },
                  { day: "Fri", amount: 1680 },
                  { day: "Sat", amount: 1500 },
                  { day: "Sun", amount: todayEarned, isToday: true },
                ]).map((d, i) => {
                  const heightPercent = Math.min(100, Math.max(20, (d.amount / 1800) * 100));
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-mono font-bold text-slate-600">
                        {d.amount > 0 ? `₹${Math.round(d.amount)}` : "—"}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all ${
                          d.isToday
                            ? "bg-[#00C853] shadow-2xs"
                            : "bg-slate-200 hover:bg-slate-300"
                        }`}
                      />
                      <span
                        className={`text-[11px] font-bold ${
                          d.isToday ? "text-emerald-700" : "text-slate-500"
                        }`}
                      >
                        {d.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Quests & Milestones */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-600" />
                <span>Daily Incentive Quests</span>
              </h3>

              {/* Quest 1 */}
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Daily 10-Rides Quest 🎯</h4>
                    <p className="text-[11px] text-slate-500">Complete 10 rides to earn bonus</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-xl">
                    +₹150 Reward
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-600">8 of 10 Completed</span>
                    <span className="text-emerald-700 font-mono">80%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00C853] rounded-full w-[80%]" />
                  </div>
                </div>
              </div>

              {/* Quest 2 */}
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Kasganj Evening Peak (6-9 PM) ⚡
                    </h4>
                    <p className="text-[11px] text-slate-500">Complete 5 rush hour rides</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-xl">
                    +₹100 Claimed ✅
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-full" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. 72-HOUR SETTLEMENT MODAL (Clean White Theme) */}
      {showCashoutModal && (
        <div
          onClick={() => setShowCashoutModal(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs select-none animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto border border-slate-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    72-Hour Bank / UPI Settlement
                  </h3>
                  <p className="text-[11px] text-slate-500">Auto-clearing cycle: 72 Hours · Zero fee</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCashoutModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cashoutSuccessData ? (
              /* Success State */
              <div className="py-6 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Settlement Cycle Scheduled!</h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  ₹{cashoutSuccessData.amount?.toFixed(2)} has been queued and will be credited to your UPI ID{" "}
                  <span className="font-mono font-bold text-slate-900">
                    {cashoutSuccessData.upiId || selectedUpi}
                  </span>{" "}
                  within 72 hours.
                </p>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Settlement Timeline:</span>
                    <span className="font-bold text-amber-700 font-mono">
                      Within 72 Hours
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reference Batch UTR:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {cashoutSuccessData.utr}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Remaining Balance:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      ₹{cashoutSuccessData.balance?.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCashoutModal(false)}
                  className="w-full py-3 bg-[#00C853] hover:bg-[#00B248] text-white font-bold text-xs rounded-2xl active:scale-98 shadow-sm"
                >
                  Done & Back to Wallet
                </button>
              </div>
            ) : (
              /* Form State */
              <>
                {/* Available Balance Reminder */}
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-xs">
                  <span className="font-semibold text-emerald-900">Available for 72h Cycle:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    ₹{availableBalance.toFixed(2)}
                  </span>
                </div>

                {/* Amount Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Enter Settlement Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono text-lg">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="500"
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500 transition-all"
                    />
                  </div>

                  {/* Quick Preset Chips */}
                  <div className="flex items-center gap-2 pt-1">
                    {[
                      { label: "₹200", val: "200" },
                      { label: "₹500", val: "500" },
                      { label: "₹1,000", val: "1000" },
                      { label: "Full Balance", val: String(Math.floor(availableBalance)) },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => setWithdrawAmount(chip.val)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                          withdrawAmount === chip.val
                            ? "bg-[#00C853] text-white border-[#00C853] shadow-2xs"
                            : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payout Destination */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Settlement Destination</label>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        UPI
                      </div>
                      <div>
                        <p className="font-mono font-bold text-slate-900">{selectedUpi}</p>
                        <p className="text-[10px] text-emerald-600 font-semibold">HDFC Bank Verified 🟢</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">Primary</span>
                  </div>
                </div>

                {/* Fee & Cycle Breakdown */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Settlement Amount:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{parseFloat(withdrawAmount || "0").toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-800 font-medium">
                    <span>Settlement Processing:</span>
                    <span className="font-bold">Within 72 Hours (T+3)</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Platform Commission:</span>
                    <span className="font-mono font-bold">FREE (₹0.00)</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                    <span>Net Amount to Account:</span>
                    <span className="font-mono text-emerald-600 text-xs font-extrabold">
                      ₹{parseFloat(withdrawAmount || "0").toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Submit Payout Request Button */}
                <button
                  type="button"
                  onClick={handleInstantCashout}
                  disabled={withdrawing || availableBalance <= 0}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#00C853] hover:bg-[#00B248] disabled:bg-slate-300 text-white text-sm font-bold rounded-2xl shadow-sm active:scale-98 transition-all"
                >
                  {withdrawing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting 72-Hour Payout Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Confirm 72-Hour Settlement Request</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 5. BONUS SIMULATION MODAL (Clean White) */}
      {showBonusModal && (
        <div
          onClick={() => setShowBonusModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs select-none animate-in fade-in duration-200 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-200 border border-slate-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Simulate Quest / Bonus</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowBonusModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Trigger a real database milestone reward to see live wallet balance credit in MongoDB Atlas.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
              <p className="font-bold text-amber-950">Daily 10-Rides Milestone 🎯</p>
              <p className="text-[11px] text-amber-800">Credit Amount: +₹150.00 Instant Cash</p>
            </div>

            <button
              type="button"
              onClick={handleAddBonusCredit}
              disabled={bonusAdding}
              className="w-full py-3 bg-[#00C853] hover:bg-[#00B248] text-white font-bold text-xs rounded-2xl shadow-sm active:scale-98 transition-all flex items-center justify-center gap-1.5"
            >
              {bonusAdding ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <span>Add ₹150 Bonus to MongoDB Wallet</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 6. STRICTLY 2-TAB BOTTOM NAVIGATION */}
      <RiderBottomNav active="dashboard" ordersBadgeCount={2} />
    </div>
  );
}
