import { Banknote, Wallet as WalletIcon } from "lucide-react";

import { useCountUp } from "../../hooks/use-count-up";
import { formatInr, type WalletSummary } from "../../data/partner-wallet-mock";

/**
 * Sprint 3.6 — wallet hero card. Keeps the existing partner gradient hero
 * treatment and adds a counter animation on the balance.
 */
export function WalletBalanceCard({
  summary,
  onWithdraw,
}: {
  summary: WalletSummary;
  onWithdraw: () => void;
}) {
  const balance = useCountUp(summary.balance);

  return (
    <section className="animate-slide-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand-dark to-brand-green p-5 shadow-soft">
      <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-primary/25 blur-2xl" />

      <div className="relative flex items-center gap-2 text-background/70">
        <WalletIcon className="size-4" />
        <p className="text-[0.68rem] font-semibold uppercase tracking-widest">Wallet Balance</p>
      </div>
      <p className="relative mt-1 text-3xl font-black tracking-tight text-background">
        {formatInr(balance)}
      </p>
      <p className="relative mt-1 text-[0.7rem] font-semibold text-background/70">
        {formatInr(summary.pendingSettlement)} pending settlement · Lifetime{" "}
        {formatInr(summary.lifetime)}
      </p>

      <div className="relative mt-4 grid grid-cols-3 gap-2">
        {[
          { label: "Today", value: summary.today },
          { label: "This Week", value: summary.week },
          { label: "This Month", value: summary.month },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-background/12 px-3 py-2">
            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-background/70">
              {item.label}
            </p>
            <p className="mt-0.5 text-sm font-black tracking-tight text-background">
              {formatInr(item.value)}
            </p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onWithdraw}
        className="ripple relative mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97]"
      >
        <Banknote className="size-4" />
        Withdraw to Bank
      </button>
    </section>
  );
}
