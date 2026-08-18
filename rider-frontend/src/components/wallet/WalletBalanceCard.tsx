import { ArrowUpRight, Banknote, Clock3, IndianRupee } from "lucide-react";

import { useCountUp } from "../../hooks/use-count-up";
import { formatINR, type WalletSummary } from "../../data/rider-wallet-mock";

/** Hero balance card — gradient panel with animated balance counter. */
export function WalletBalanceCard({
  summary,
  onWithdraw,
  bankLast4,
}: {
  summary: WalletSummary;
  onWithdraw: () => void;
  bankLast4: string;
}) {
  const balance = useCountUp(summary.currentBalance, 1100);

  return (
    <section className="animate-rise overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand-dark to-brand-green p-5 shadow-soft sm:p-6">
      <p className="text-[0.68rem] font-semibold uppercase tracking-widest text-background/70">
        Current Wallet Balance
      </p>
      <p className="mt-1 flex items-center text-3xl font-black tracking-tight text-background sm:text-4xl">
        <IndianRupee className="size-6 sm:size-7" strokeWidth={2.6} />
        {balance.toLocaleString("en-IN")}
      </p>
      <p className="mt-1 text-[0.7rem] font-medium text-background/70">
        Linked bank ••{bankLast4} · Min withdraw {formatINR(summary.minimumWithdraw)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-background/12 p-3">
          <p className="flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-widest text-background/70">
            <Clock3 className="size-3" />
            Pending Settlement
          </p>
          <p className="mt-1 text-base font-black tracking-tight text-background">
            {formatINR(summary.pendingSettlement)}
          </p>
        </div>
        <div className="rounded-2xl bg-background/12 p-3">
          <p className="flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-widest text-background/70">
            <Banknote className="size-3" />
            Lifetime Earnings
          </p>
          <p className="mt-1 text-base font-black tracking-tight text-background">
            {formatINR(summary.lifetimeEarnings)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onWithdraw}
        className="ripple mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-background py-3.5 text-sm font-black tracking-tight text-brand-dark transition-all duration-300 active:scale-[0.97]"
      >
        <ArrowUpRight className="size-4" />
        Withdraw
      </button>
      <p className="mt-2 text-center text-[0.66rem] font-medium text-background/70">
        Next settlement {summary.nextSettlementOn} · {summary.settlementWindow}
      </p>
    </section>
  );
}