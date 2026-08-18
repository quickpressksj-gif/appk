import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Landmark, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { RiderPrimaryButton, SectionHeading } from "../../components/RiderPrimitives";
import { RiderTopBar } from "../../components/RiderTopBar";
import { SummaryRow, WalletPanel } from "../../components/wallet/WalletPrimitives";
import { WalletHomeSkeleton } from "../../components/wallet/WalletSkeletons";
import { WalletStateView } from "../../components/wallet/WalletStates";
import { WalletSuccessOverlay } from "../../components/wallet/WalletSuccessOverlay";
import { useRiderResource } from "../../hooks/use-rider-resource";
import { riderRoutes } from "../../navigation/rider-routes";
import { formatINR, maskAccountNumber } from "../../data/rider-wallet-mock";
import { loadWalletData, withdrawRiderEarnings } from "../../data/rider-wallet-adapter";

const QUICK_AMOUNTS = [500, 1000, 2000];
const MIN_WITHDRAWAL = 100;

/**
 * Withdraw Screen — amount entry, validation and confirmation.
 * The withdrawal itself is executed by the real backend
 * (POST /api/rider/wallet/withdraw); the balance shown afterwards is
 * re-read from the backend, never adjusted locally.
 */
export function WithdrawScreen() {
  const navigate = useNavigate();
  const { data, isLoading, setData } = useRiderResource(loadWalletData);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const balance = data?.summary.currentBalance ?? 0;
  const parsed = Number(amount || 0);

  const error = useMemo(() => {
    if (amount === "") return null;
    if (Number.isNaN(parsed) || parsed <= 0) return "Enter a valid amount";
    if (parsed < MIN_WITHDRAWAL) return `Minimum withdrawal is ${formatINR(MIN_WITHDRAWAL)}`;
    if (parsed > balance) return "Amount exceeds available balance";
    return null;
  }, [amount, parsed, balance]);

  const canSubmit = amount !== "" && error === null && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await withdrawRiderEarnings(parsed);
      // Re-read the authoritative balance/ledger from the backend.
      setData(await loadWalletData());
      setAmount("");
      setSuccess(true);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Withdrawal could not be completed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Withdraw"
          subtitle="Move earnings to your bank"
          onBack={() => navigate({ to: riderRoutes.wallet })}
        />

        {isLoading || !data ? (
          <WalletHomeSkeleton />
        ) : balance < MIN_WITHDRAWAL ? (
          <div className="px-5 pt-6">
            <WalletStateView
              state="no-earnings"
              onAction={() => navigate({ to: riderRoutes.wallet })}
            />
          </div>
        ) : (
          <div className="px-5 pb-32 pt-4">
            <section className="animate-rise overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand-dark to-brand-green p-5 shadow-soft">
              <p className="text-[0.68rem] font-semibold uppercase tracking-widest text-background/70">
                Available balance
              </p>
              <p className="mt-1 text-3xl font-black tracking-tight text-background">
                {formatINR(balance)}
              </p>
              <p className="mt-1 text-[0.7rem] font-medium text-background/70">
                To {data.bank.bankName} {maskAccountNumber(data.bank.accountNumber)}
              </p>
            </section>

            <section className="card-soft animate-rise mt-5 border border-border p-5">
              <label className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
                Withdrawal amount
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-card px-4">
                <span className="text-xl font-black text-muted-foreground">₹</span>
                <input
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="0"
                  className="min-h-14 w-full bg-transparent text-2xl font-black tracking-tight text-foreground outline-none"
                />
              </div>
              {error ? (
                <p className="mt-2 text-[0.7rem] font-semibold text-destructive">{error}</p>
              ) : (
                <p className="mt-2 text-[0.7rem] font-medium text-muted-foreground">
                  Minimum {formatINR(MIN_WITHDRAWAL)} per withdrawal.
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_AMOUNTS.filter((value) => value <= balance).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(String(value))}
                    className="min-h-11 rounded-full border border-border px-4 text-xs font-bold text-foreground transition-colors active:scale-[0.97]"
                  >
                    {formatINR(value)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount(String(Math.floor(balance)))}
                  className="min-h-11 rounded-full bg-primary/15 px-4 text-xs font-bold text-brand-dark transition-colors active:scale-[0.97]"
                >
                  Withdraw all
                </button>
              </div>
            </section>

            <section className="mt-5">
              <SectionHeading title="Payout" />
              <WalletPanel className="mt-3">
                <SummaryRow
                  icon={Landmark}
                  label="Payout account"
                  value={`${data.bank.bankName} ${maskAccountNumber(data.bank.accountNumber)}`}
                />
                <SummaryRow
                  icon={ShieldCheck}
                  label="You receive"
                  value={formatINR(Math.max(0, parsed))}
                  accent
                />
              </WalletPanel>
              <p className="mt-3 rounded-2xl bg-muted p-3 text-[0.68rem] font-medium text-muted-foreground">
                Transfer-speed options and processing fees are not available yet — the backend
                processes a single standard withdrawal against your real wallet balance.
              </p>
            </section>

            <div className="mt-6">
              <RiderPrimaryButton onClick={() => void submit()} disabled={!canSubmit}>
                {submitting ? "Processing withdrawal…" : "Confirm withdrawal"}
              </RiderPrimaryButton>
            </div>
          </div>
        )}
      </div>

      <WalletSuccessOverlay
        open={success}
        title="Withdrawal requested"
        body="Money will reach your bank shortly. Track it under transactions."
        onDone={() => {
          setSuccess(false);
          void navigate({ to: riderRoutes.walletTransactions });
        }}
      />
      <Toaster />
    </main>
  );
}
