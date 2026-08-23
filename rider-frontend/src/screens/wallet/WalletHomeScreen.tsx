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
import { RiderBellAction, RiderTopBar } from "../../components/RiderTopBar";
import { PullToRefreshShell } from "../../components/wallet/PullToRefreshShell";
import { WalletBalanceCard } from "../../components/wallet/WalletBalanceCard";
import { CounterCard, QuickActionTile } from "../../components/wallet/WalletPrimitives";
import { WalletHomeSkeleton } from "../../components/wallet/WalletSkeletons";
import { WalletOfflineBanner } from "../../components/wallet/WalletStates";
import { useRiderResource } from "../../hooks/use-rider-resource";
import { riderRoutes } from "../../navigation/rider-routes";
import { loadWalletData } from "../../data/rider-wallet-adapter";

/** Wallet Home — balance, earnings summary, and recent activity. */
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
    <main className="relative min-h-screen bg-slate-50/50 pb-28 text-slate-900">
      <div className="mx-auto w-full max-w-md lg:max-w-3xl">
        <RiderTopBar
          title="Rider Wallet"
          subtitle="Payouts, settlements & earnings breakdown"
          action={<RiderBellAction count={0} />}
        />

        {offline ? <WalletOfflineBanner onRetry={() => setOffline(false)} /> : null}

        {isLoading || !data || !summary ? (
          <div className="p-4">
            <WalletHomeSkeleton />
          </div>
        ) : (
          <PullToRefreshShell onRefresh={refresh}>
            <div key={nonce} className="space-y-4 px-4 pt-3.5">
              <WalletBalanceCard
                summary={summary}
                bankLast4={data.bank.accountNumber.slice(-4)}
                onWithdraw={() => navigate({ to: riderRoutes.walletWithdraw })}
              />

              {/* Quick Actions Grid */}
              <section className="grid grid-cols-4 gap-2">
                <QuickActionTile
                  icon={TrendingUp}
                  label="Earnings"
                  onClick={() => navigate({ to: riderRoutes.walletEarnings })}
                />
                <QuickActionTile
                  icon={Receipt}
                  label="Ledger"
                  onClick={() => navigate({ to: riderRoutes.walletTransactions })}
                />
                <QuickActionTile
                  icon={Gift}
                  label="Incentives"
                  onClick={() => navigate({ to: riderRoutes.walletIncentives })}
                />
                <QuickActionTile
                  icon={Landmark}
                  label="Bank Info"
                  onClick={() => navigate({ to: riderRoutes.walletBank })}
                />
              </section>

              {/* Earnings Breakdown */}
              <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
                  Earnings Period Breakdown
                </h2>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  <CounterCard
                    icon={CalendarDays}
                    label="Today's Earnings"
                    value={summary.todayEarnings ?? 0}
                    prefix="₹"
                    hint="Fulfilled orders"
                    delay={0}
                  />
                  <CounterCard
                    icon={CalendarRange}
                    label="Weekly Earnings"
                    value={summary.weeklyEarnings ?? 0}
                    prefix="₹"
                    tone="green"
                    hint="Past 7 days"
                    delay={60}
                  />
                  <CounterCard
                    icon={BadgeIndianRupee}
                    label="Monthly Earnings"
                    value={summary.monthlyEarnings ?? 0}
                    prefix="₹"
                    tone="muted"
                    hint="Past 30 days"
                    delay={120}
                  />
                  <CounterCard
                    icon={Clock3}
                    label="Pending Payout"
                    value={summary.pendingSettlement ?? 0}
                    prefix="₹"
                    hint="Scheduled payout"
                    delay={180}
                  />
                  <CounterCard
                    icon={Banknote}
                    label="Lifetime Total"
                    value={summary.lifetimeEarnings ?? 0}
                    prefix="₹"
                    tone="green"
                    hint="All-time earnings"
                    delay={240}
                  />
                  <CounterCard
                    icon={WalletIcon}
                    label="Current Balance"
                    value={summary.currentBalance ?? 0}
                    prefix="₹"
                    hint="Available for withdrawal"
                    delay={300}
                  />
                </div>
              </section>
            </div>
          </PullToRefreshShell>
        )}

        <RiderBottomNav active="wallet" />
      </div>
      <Toaster />
    </main>
  );
}