import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  Wallet as WalletIcon,
} from "lucide-react";
import { toast } from "sonner";
import { RiderLayout } from "../components/layout/RiderLayout";

export function RiderWalletScreen() {
  const [balance, setBalance] = useState(1250);
  const [withdrawing, setWithdrawing] = useState(false);

  const transactions = [
    { id: "TX-9821", title: "Order #QP-7821 Delivery Payout", amount: "+₹65", time: "Today, 1:45 PM", status: "credited" },
    { id: "TX-9820", title: "Order #QP-7819 Delivery Payout", amount: "+₹55", time: "Today, 12:10 PM", status: "credited" },
    { id: "TX-9815", title: "Weekly Bank Settlement #44", amount: "-₹3,450", time: "Yesterday, 6:00 PM", status: "settled" },
    { id: "TX-9811", title: "Customer Cash Tip #QP-7801", amount: "+₹40", time: "01 Sep 2026", status: "credited" },
  ];

  const handleWithdraw = () => {
    if (balance <= 0) {
      toast.error("Insufficient balance for withdrawal.");
      return;
    }
    setWithdrawing(true);
    setTimeout(() => {
      toast.success("Withdrawal request submitted! Payout will arrive in your bank account within 2 hours.");
      setBalance(0);
      setWithdrawing(false);
    }, 800);
  };

  return (
    <RiderLayout
      activeTab="wallet"
      title="Earnings & Payouts"
      subtitle="Track your daily income, weekly transfers & bank account"
    >
      <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6 select-none">
        {/* Main Wallet Balance Card (Partner style) */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-emerald-500/10 blur-2xl" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Available Wallet Balance
              </p>
              <p className="mt-1 flex items-center text-4xl sm:text-5xl font-black tracking-tight text-slate-950">
                <IndianRupee className="size-8 sm:size-10 text-emerald-600" strokeWidth={2.6} />
                {balance.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-700">
                ✓ Auto-settles every Monday directly to your bank account
              </p>
            </div>

            <button
              type="button"
              onClick={handleWithdraw}
              disabled={withdrawing || balance <= 0}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-5 py-3 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <WalletIcon className="size-4" />
              <span>{withdrawing ? "Processing..." : "Instant Withdraw"}</span>
            </button>
          </div>
        </div>

        {/* Bank Details Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Building2 className="size-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">Linked Bank Account</h3>
                <p className="text-[11px] font-medium text-slate-500">State Bank of India · **** 4321</p>
              </div>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200">
              <ShieldCheck className="size-3 text-emerald-600" />
              Verified
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Account Holder</p>
              <p className="font-bold text-slate-900">Delivery Captain</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">IFSC Code</p>
              <p className="font-bold text-slate-900">SBIN0001234</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Payout Cycle</p>
              <p className="font-bold text-emerald-700">Weekly (Every Monday)</p>
            </div>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
            Recent Payout Activity
          </h3>
          <div className="space-y-2.5">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-9 items-center justify-center rounded-xl ${
                      tx.status === "credited"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tx.status === "credited" ? (
                      <ArrowDownLeft className="size-4.5" />
                    ) : (
                      <ArrowUpRight className="size-4.5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{tx.title}</p>
                    <p className="text-[10px] font-medium text-slate-400">{tx.time}</p>
                  </div>
                </div>

                <span
                  className={`text-sm font-black ${
                    tx.status === "credited" ? "text-emerald-700" : "text-slate-900"
                  }`}
                >
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </RiderLayout>
  );
}
