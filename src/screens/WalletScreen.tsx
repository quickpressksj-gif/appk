import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";

import { Toaster } from "@shared/ui/sonner";

import { PartnerTopBar, PartnerBellAction } from "../components/PartnerTopBar";
import { PartnerBottomNav } from "../components/PartnerBottomNav";
import { PullToRefresh } from "../components/dashboard/PullToRefresh";
import { BankAccountCard } from "../components/wallet/BankAccountCard";
import { EarningsBreakdownCard } from "../components/wallet/EarningsBreakdownCard";
import { SettlementHistoryReal } from "../components/wallet/SettlementHistoryReal";
import { WalletBalanceCard } from "../components/wallet/WalletBalanceCard";
import { WalletLedgerList } from "../components/wallet/WalletLedgerList";
import { WalletScreenSkeleton } from "../components/wallet/WalletSkeletons";
import {
  usePartnerEarnings,
  usePartnerLedger,
  usePartnerSettlements,
  usePartnerWithdrawals,
} from "../hooks/use-partner-payments";
import { partnerRoutes } from "../navigation/partner-routes";
import { bankAccount as fallbackBankAccount } from "../data/partner-wallet-mock";

/**
 * Sprint 5.6 — Wallet & Earnings dashboard backed by the real wallet ledger,
 * earnings and settlements API (backend/src/payments/wallet-ledger-api.ts).
 */
export function WalletScreen() {
  const navigate = useNavigate();

  const earnings = usePartnerEarnings();
  const ledger = usePartnerLedger(50);
  const settlements = usePartnerSettlements();
  const withdrawals = usePartnerWithdrawals();

  const isLoading = earnings.isLoading || ledger.isLoading || settlements.isLoading || withdrawals.isLoading;
  const hasError = earnings.isError || ledger.isError || settlements.isError || withdrawals.isError;

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      earnings.refetch(),
      ledger.refetch(),
      settlements.refetch(),
      withdrawals.refetch(),
    ]);
    toast.success("Wallet refreshed");
  }, [earnings, ledger, settlements, withdrawals]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <PartnerTopBar
          title="Wallet & Earnings"
          subtitle="Balance, payouts and settlements"
          onBack={() => navigate({ to: partnerRoutes.dashboard })}
          action={<PartnerBellAction count={1} />}
        />

        {isLoading ? (
          <WalletScreenSkeleton />
        ) : hasError || !earnings.data || !ledger.data || !settlements.data || !withdrawals.data ? (
          <div className="px-5 pb-32 pt-10 text-center">
            <p className="text-sm font-bold text-foreground">Couldn't load your wallet</p>
            <p className="mt-1 text-[0.72rem] font-medium text-muted-foreground">
              Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-4 rounded-2xl bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground"
            >
              Retry
            </button>
          </div>
        ) : (
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="animate-fade-in px-5 pb-32 pt-4">
              <WalletBalanceCard
                summary={{
                  balance: withdrawals.data.available,
                  today: earnings.data.today,
                  week: earnings.data.week,
                  month: earnings.data.month,
                  pendingSettlement: earnings.data.pendingSettlement,
                  lifetime: earnings.data.lifetime,
                  minWithdraw: withdrawals.data.minimumAmount,
                  settlementEta: "24–48 working hours",
                }}
                onWithdraw={() => navigate({ to: partnerRoutes.walletWithdraw })}
              />

              <EarningsBreakdownCard earnings={earnings.data} />

              <section className="mt-6">
                <p className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
                  Wallet Ledger
                </p>
                <div className="mt-3">
                  <WalletLedgerList entries={ledger.data.entries} />
                </div>
              </section>

              <SettlementHistoryReal settlements={settlements.data.items} />

              <div className="mt-6">
                <BankAccountCard account={fallbackBankAccount} onSave={() => toast.success("Bank account updated")} />
              </div>
            </div>
          </PullToRefresh>
        )}

        <PartnerBottomNav active="wallet" />
      </div>
      <Toaster />
    </main>
  );
}
