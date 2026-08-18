import { useCallback, useMemo, useState } from "react";
import { BadgeIndianRupee, Coins, Gift, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { SectionHeading } from "../../components/RiderPrimitives";
import { RiderBellAction, RiderTopBar } from "../../components/RiderTopBar";
import { PullToRefreshShell } from "../../components/wallet/PullToRefreshShell";
import { WalletFilters } from "../../components/wallet/WalletFilters";
import { SummaryRow, WalletPanel } from "../../components/wallet/WalletPrimitives";
import { WalletKpiSkeleton } from "../../components/wallet/WalletSkeletons";
import { WalletOfflineBanner, WalletStateView } from "../../components/wallet/WalletStates";
import { useRiderResource } from "../../hooks/use-rider-resource";
import {
  WALLET_RANGES,
  formatINR,
  type WalletRangeId,
} from "../../data/rider-wallet-mock";
import { loadWalletData } from "../../data/rider-wallet-adapter";

/** Earnings Screen — range filters, animated KPI grid and payout summary. */
export function EarningsScreen() {
  const { data, isLoading } = useRiderResource(loadWalletData);
  const [range, setRange] = useState<WalletRangeId>("today");
  const [customFrom, setCustomFrom] = useState("2026-08-01");
  const [customTo, setCustomTo] = useState("2026-08-07");
  const [offline, setOffline] = useState(false);
  const [nonce, setNonce] = useState(0);

  const rangeLabel = WALLET_RANGES.find((item) => item.id === range)?.label ?? "Today";

  const refresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    setNonce((value) => value + 1);
    toast.success("Earnings refreshed");
  }, []);

  const totalEarnings = useMemo(() => {
    if (!data) return 0;
    if (range === "today") return data.summary.todayEarnings;
    if (range === "week") return data.summary.weeklyEarnings;
    if (range === "month") return data.summary.monthlyEarnings;
    return 0;
  }, [data, range]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Earnings"
          subtitle="Daily, weekly and monthly performance"
          action={<RiderBellAction count={1} />}
        />

        {offline ? <WalletOfflineBanner onRetry={() => setOffline(false)} /> : null}

        {isLoading || !data ? (
          <WalletKpiSkeleton />
        ) : (
          <PullToRefreshShell onRefresh={refresh}>
            <div key={`${range}-${nonce}`} className="px-5 pb-32 pt-4">
              <WalletFilters
                range={range}
                onRange={setRange}
                customFrom={customFrom}
                customTo={customTo}
                onCustomFrom={setCustomFrom}
                onCustomTo={setCustomTo}
                onExport={() => toast("Statement export is not available yet")}
              />

              <section className="animate-rise mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand-dark to-brand-green p-5 shadow-soft">
                <p className="text-[0.68rem] font-semibold uppercase tracking-widest text-background/70">
                  {rangeLabel} earnings
                </p>
                <p className="mt-1 text-3xl font-black tracking-tight text-background">
                  {formatINR(totalEarnings)}
                </p>
                <p className="mt-1 text-[0.7rem] font-medium text-background/70">
                  Includes base fare, distance pay, surge, incentives and tips.
                </p>
              </section>

              {totalEarnings === 0 ? (
                <WalletStateView state="no-earnings" />
              ) : null}

              <section className="mt-6">
                <SectionHeading title="Payout Summary" />
                <WalletPanel className="mt-3">
                  <SummaryRow
                    icon={WalletIcon}
                    label="Current balance"
                    value={formatINR(data.summary.currentBalance)}
                  />
                  <SummaryRow
                    icon={Coins}
                    label="Pending settlement"
                    value={formatINR(data.summary.pendingSettlement)}
                  />
                  <SummaryRow
                    icon={BadgeIndianRupee}
                    label="Lifetime earnings"
                    value={formatINR(data.summary.lifetimeEarnings)}
                    accent
                  />
                  <SummaryRow
                    icon={Gift}
                    label="Next settlement"
                    value={data.summary.nextSettlementOn}
                  />
                </WalletPanel>
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
      </div>

      <Toaster />
    </main>
  );
}