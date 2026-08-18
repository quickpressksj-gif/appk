import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { RiderBellAction, RiderTopBar } from "../../components/RiderTopBar";
import { PullToRefreshShell } from "../../components/wallet/PullToRefreshShell";
import { TransactionList } from "../../components/wallet/TransactionList";
import { WalletFilters } from "../../components/wallet/WalletFilters";
import { TransactionListSkeleton } from "../../components/wallet/WalletSkeletons";
import { WalletOfflineBanner, WalletStateView } from "../../components/wallet/WalletStates";
import { useRiderResource } from "../../hooks/use-rider-resource";
import {
  filterTransactions,
  formatINR,
  type TransactionType,
  type WalletRangeId,
} from "../../data/rider-wallet-mock";
import { loadWalletData } from "../../data/rider-wallet-adapter";

/** Transactions Screen — searchable, filterable ledger of wallet activity. */
export function TransactionsScreen() {
  const { data, isLoading } = useRiderResource(loadWalletData);
  const [range, setRange] = useState<WalletRangeId>("month");
  const [type, setType] = useState<TransactionType | "all">("all");
  const [customFrom, setCustomFrom] = useState("2026-08-01");
  const [customTo, setCustomTo] = useState("2026-08-07");
  const [offline, setOffline] = useState(false);
  const [nonce, setNonce] = useState(0);

  const rows = useMemo(
    () => filterTransactions(data?.transactions ?? [], range, type, customFrom, customTo),
    [data, range, type, customFrom, customTo],
  );

  const credited = rows
    .filter((row) => ["credit", "incentive", "tip", "refund"].includes(row.type))
    .reduce((sum, row) => sum + row.amount, 0);
  const debited = rows
    .filter((row) => ["debit", "settlement"].includes(row.type))
    .reduce((sum, row) => sum + row.amount, 0);

  const refresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    setNonce((value) => value + 1);
    toast.success("Transactions refreshed");
  }, []);

  const resetFilters = () => {
    setRange("month");
    setType("all");
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Transactions"
          subtitle="Credits, debits, tips and settlements"
          action={<RiderBellAction count={1} />}
        />

        {offline ? <WalletOfflineBanner onRetry={() => setOffline(false)} /> : null}

        {isLoading || !data ? (
          <TransactionListSkeleton />
        ) : (
          <PullToRefreshShell onRefresh={refresh}>
            <div key={nonce} className="px-5 pb-32 pt-4">
              <WalletFilters
                range={range}
                onRange={setRange}
                customFrom={customFrom}
                customTo={customTo}
                onCustomFrom={setCustomFrom}
                onCustomTo={setCustomTo}
                type={type}
                onType={setType}
                showTypes
                onExport={() => toast("Statement export is not available yet")}
              />

              <section className="mt-4 grid grid-cols-2 gap-3">
                <div className="card-soft animate-rise border border-border p-4">
                  <p className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
                    Credited
                  </p>
                  <p className="mt-1 text-lg font-black tracking-tight text-brand-green">
                    +{formatINR(credited)}
                  </p>
                </div>
                <div className="card-soft animate-rise border border-border p-4">
                  <p className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
                    Debited
                  </p>
                  <p className="mt-1 text-lg font-black tracking-tight text-foreground">
                    −{formatINR(debited)}
                  </p>
                </div>
              </section>

              <p className="mt-4 text-[0.7rem] font-semibold text-muted-foreground">
                {rows.length} {rows.length === 1 ? "transaction" : "transactions"}
              </p>

              <div className="mt-3">
                {rows.length === 0 ? (
                  <WalletStateView state="no-transactions" onAction={resetFilters} />
                ) : (
                  <TransactionList rows={rows} />
                )}
              </div>

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