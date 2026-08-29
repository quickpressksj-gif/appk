import { ArrowUpRight, Banknote, Clock3, IndianRupee, Landmark } from "lucide-react";

import { useCountUp } from "../../hooks/use-count-up";
import { formatINR, type WalletSummary } from "../../data/rider-wallet-mock";

/** Hero balance card — sleek dark luxury card */
export function WalletBalanceCard({
  summary,
  onWithdraw,
  bankLast4,
}: {
  summary: WalletSummary;
  onWithdraw: () => void;
  bankLast4: string;
}) {
  const balance = useCountUp(summary.currentBalance, 1000);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-teal-50 p-5 text-slate-900 shadow-sm border border-emerald-200/80">
      <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-emerald-400/20 blur-2xl" />

      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
          Available Wallet Balance
        </p>
        <span className="flex items-center gap-1 rounded-full bg-white/80 border border-emerald-200/80 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 backdrop-blur">
          <Landmark className="size-3 text-emerald-600" />
          ••{bankLast4 || "4821"}
        </span>
      </div>

      <p className="mt-2 flex items-center text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
        <IndianRupee className="size-7 text-emerald-700" strokeWidth={2.6} />
        {balance.toLocaleString("en-IN")}
      </p>
      <p className="mt-0.5 text-xs text-slate-600 font-medium">
        Ready for instant bank payout · Min {formatINR(summary.minimumWithdraw)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white/80 p-2.5 border border-emerald-200/60 shadow-xs">
          <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
            <Clock3 className="size-3 text-amber-600" />
            Pending Settlement
          </p>
          <p className="mt-0.5 text-sm font-black tracking-tight text-slate-900">
            {formatINR(summary.pendingSettlement)}
          </p>
        </div>
        <div className="rounded-2xl bg-white/80 p-2.5 border border-emerald-200/60 shadow-xs">
          <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
            <Banknote className="size-3 text-emerald-600" />
            Lifetime Earnings
          </p>
          <p className="mt-0.5 text-sm font-black tracking-tight text-emerald-700">
            {formatINR(summary.lifetimeEarnings)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onWithdraw}
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-black tracking-tight text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-[0.97]"
      >
        <ArrowUpRight className="size-4" strokeWidth={2.5} />
        Request Instant Withdrawal
      </button>
    </section>
  );
}