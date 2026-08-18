import {
  BadgeIndianRupee,
  Banknote,
  CalendarDays,
  CalendarRange,
  Clock3,
  Gift,
  Landmark,
  Receipt,
  TrendingUp,
  Wallet as WalletIcon,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { RiderBottomNav } from "../../components/RiderBottomNav";
import { SectionHeading } from "../../components/RiderPrimitives";
import { RiderBellAction, RiderTopBar } from "../../components/RiderTopBar";
import { BankDetailsCard } from "../../components/wallet/BankDetailsCard";
import { IncentiveCardGrid } from "../../components/wallet/IncentiveCards";
import { PullToRefreshShell } from "../../components/wallet/PullToRefreshShell";
import { TransactionList } from "../../components/wallet/TransactionList";
import { WalletBalanceCard } from "../../components/wallet/WalletBalanceCard";
import { CounterCard, QuickActionTile } from "../../components/wallet/WalletPrimitives";
import { WalletHomeSkeleton } from "../../components/wallet/WalletSkeletons";
import { WalletOfflineBanner, WalletStateView } from "../../components/wallet/WalletStates";
import { useRiderResource } from "../../hooks/use-rider-resource";
import { riderRoutes } from "../../navigation/rider-routes";
import { loadWalletData } from "../../data/rider-wallet-adapter";

/** Wallet Home — balance, earnings summary, incentives and recent activity. */
export function WalletHomeScreen() {
  const navigate = useNavigate();
  const { data, isLoading } = useRiderResource(loadWalletData);
  const [offline, setOffline] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    setNonce((value) => value + 1);
    toast.success("Wallet refreshed");
  }, []);

  const summary = data?.summary;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Wallet"
          subtitle="Earnings, payouts and incentives"
          action={<RiderBellAction count={1} />}
        />

        {offline ? <WalletOfflineBanner onRetry={() => setOffline(false)} /> : null}

        {isLoading || !data || !summary ? (
          <WalletHomeSkeleton />
        ) : (
          <PullToRefreshShell onRefresh={refresh}>
            <div key={nonce} className="px-5 pb-32 pt-4">
              <WalletBalanceCard
                summary={summary}
                bankLast4={data.bank.accountNumber.slice(-4)}
                onWithdraw={() => navigate({ to: riderRoutes.walletWithdraw })}
              />

              <section className="mt-4 flex gap-2">
                <QuickActionTile
                  icon={TrendingUp}
                  label="Earnings"
                  onClick={() => navigate({ to: riderRoutes.walletEarnings })}
                />
                <QuickActionTile
                  icon={Receipt}
                  label="Transactions"
                  onClick={() => navigate({ to: riderRoutes.walletTransactions })}
                />
                <QuickActionTile
                  icon={Gift}
                  label="Incentives"
                  onClick={() => navigate({ to: riderRoutes.walletIncentives })}
                />
                <QuickActionTile
                  icon={Landmark}
                  label="Bank"
                  onClick={() => navigate({ to: riderRoutes.walletBank })}
                />
              </section>

              <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <CounterCard
                  icon={CalendarDays}
                  label="Today's Earnings"
                  value={summary.todayEarnings}
                  prefix="₹"
                  hint="18 deliveries"
                  delay={0}
                />
                <CounterCard
                  icon={CalendarRange}
                  label="Weekly Earnings"
                  value={summary.weeklyEarnings}
                  prefix="₹"
                  tone="green"
                  hint="112 deliveries"
                  delay={60}
                />
                <CounterCard
                  icon={BadgeIndianRupee}
                  label="Monthly Earnings"
                  value={summary.monthlyEarnings}
                  prefix="₹"
                  tone="muted"
                  hint="486 deliveries"
                  delay={120}
                />
                <CounterCard
                  icon={Clock3}
                  label="Pending Settlement"
                  value={summary.pendingSettlement}
                  prefix="₹"
                  hint={`Due ${summary.nextSettlementOn}`}
                  delay={180}
                />
                <CounterCard
                  icon={Banknote}
                  label="Lifetime Earnings"
                  value={summary.lifetimeEarnings}
                  prefix="₹"
                  tone="green"
                  hint="Since Jan 2025"
                  delay={240}
                />
                <CounterCard
                  icon={WalletIcon}
                  label="Current Balance"
                  value={summary.currentBalance}
                  prefix="₹"
                  tone="muted"
                  hint={`Last payout ${summary.lastSettlementOn}`}
                  delay={300}
                />
              </section>

              <section className="mt-6">
                <SectionHeading
                  title="Incentives"
                  action={
                    <button
                      type="button"
                      onClick={() => navigate({ to: riderRoutes.walletIncentives })}
                      className="text-[0.7rem] font-black tracking-tight text-brand-green"
                    >
                      View all
                    </button>
                  }
                />
                <div className="mt-3">
                  {data.incentivesAvailable && data.incentives.length > 0 ? (
                    <IncentiveCardGrid cards={data.incentives.slice(0, 2)} />
                  ) : (
                    <WalletStateView state="no-incentives" />
                  )}
                </div>
              </section>

              <section className="mt-6">
                <SectionHeading
                  title="Recent Transactions"
                  action={
                    <button
                      type="button"
                      onClick={() => navigate({ to: riderRoutes.walletTransactions })}
                      className="text-[0.7rem] font-black tracking-tight text-brand-green"
                    >
                      See all
                    </button>
                  }
                />
                <div className="mt-3">
                  {data.transactions.length === 0 ? (
                    <WalletStateView state="no-transactions" />
                  ) : (
                    <TransactionList rows={data.transactions.slice(0, 4)} />
                  )}
                </div>
              </section>

              <section className="mt-6">
                <BankDetailsCard
                  bank={data.bank}
                  onEdit={() => navigate({ to: riderRoutes.walletBank })}
                />
              </section>

              <button
                type="button"
                onClick={() => setOffline((value) => !value)}
                className="mt-6 w-full text-center text-[0.64rem] font-semibold text-muted-foreground underline"
              >
                {offline ? "Simulate back online" : "Simulate offline state"}
              </button>
            </div>
          </PullToRefreshShell>
        )}

        <RiderBottomNav active="wallet" />
      </div>
      <Toaster />
    </main>
  );
}