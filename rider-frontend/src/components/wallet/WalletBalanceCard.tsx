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
    <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-lg border border-slate-800">
      <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-emerald-500/15 blur-2xl" />

      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
          Available Wallet Balance
        </p>
        <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-300 backdrop-blur">
          <Landmark className="size-3 text-emerald-400" />
          ••{bankLast4 || "4821"}
        </span>
      </div>

      <p className="mt-2 flex items-center text-3xl font-black tracking-tight text-white sm:text-4xl">
        <IndianRupee className="size-7" strokeWidth={2.6} />
        {balance.toLocaleString("en-IN")}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">
        Ready for instant bank payout · Min {formatINR(summary.minimumWithdraw)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white/5 p-2.5 border border-white/5">
          <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            <Clock3 className="size-3 text-amber-400" />
            Pending Settlement
          </p>
          <p className="mt-0.5 text-sm font-black tracking-tight text-white">
            {formatINR(summary.pendingSettlement)}
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 p-2.5 border border-white/5">
          <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            <Banknote className="size-3 text-emerald-400" />
            Lifetime Earnings
          </p>
          <p className="mt-0.5 text-sm font-black tracking-tight text-emerald-400">
            {formatINR(summary.lifetimeEarnings)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onWithdraw}
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 text-xs font-black tracking-tight text-slate-950 transition-all hover:bg-emerald-400 active:scale-[0.97]"
      >
        <ArrowUpRight className="size-4" strokeWidth={2.5} />
        Request Instant Withdrawal
      </button>
    </section>
  );
}