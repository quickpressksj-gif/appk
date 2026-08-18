import { useNavigate } from "@tanstack/react-router";
import { Banknote, Clock3, Landmark, Loader2, ShieldCheck, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@shared/ui/sonner";

import { PartnerTopBar } from "../components/PartnerTopBar";
import { WalletSuccessOverlay } from "../components/wallet/WalletSuccessOverlay";
import { WalletRowsSkeleton } from "../components/wallet/WalletSkeletons";
import { usePartnerWithdrawals, useRequestPartnerWithdrawal } from "../hooks/use-partner-payments";
import { partnerRoutes } from "../navigation/partner-routes";
import { formatInr } from "../data/partner-wallet-mock";

/** Sprint 5.6 — Withdraw screen wired to the real withdrawal request API. */
export function WalletWithdrawScreen() {
  const navigate = useNavigate();
  const { data, isLoading } = usePartnerWithdrawals();
  const requestWithdrawal = useRequestPartnerWithdrawal();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"bank" | "upi">("bank");
  const [destination, setDestination] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const numericAmount = Number(amount || 0);

  const handleSubmit = () => {
    if (!data) return;
    if (!numericAmount || numericAmount < data.minimumAmount) {
      setError(`Minimum withdrawal is ${formatInr(data.minimumAmount)}`);
      return;
    }
    if (numericAmount > data.available) {
      setError("Amount exceeds available balance");
      return;
    }
    setError(null);
    requestWithdrawal.mutate(
      { amount: numericAmount, method, ...(destination ? { destination } : {}) },
      {
        onSuccess: () => setSuccess("Withdrawal request submitted"),
        onError: (err) => {
          const message = err instanceof Error ? err.message : "Could not submit withdrawal";
          setError(message);
          toast.error(message);
        },
      },
    );
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <PartnerTopBar
          title="Withdraw"
          subtitle="Transfer wallet balance to your bank"
          onBack={() => navigate({ to: partnerRoutes.wallet })}
        />

        {isLoading || !data ? (
          <div className="px-5 pb-32 pt-4">
            <WalletRowsSkeleton rows={5} />
          </div>
        ) : (
          <div className="animate-fade-in px-5 pb-32 pt-4">
            <section className="animate-slide-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand-dark to-brand-green p-5 shadow-soft">
              <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-primary/25 blur-2xl" />
              <div className="relative flex items-center gap-2 text-background/70">
                <Wallet className="size-4" />
                <p className="text-[0.68rem] font-semibold uppercase tracking-widest">
                  Available Balance
                </p>
              </div>
              <p className="relative mt-1 text-3xl font-black tracking-tight text-background">
                {formatInr(data.available)}
              </p>
              <div className="relative mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-background/12 px-3 py-2">
                  <p className="text-[0.6rem] font-bold uppercase tracking-widest text-background/70">
                    Min Withdraw
                  </p>
                  <p className="mt-0.5 text-sm font-black tracking-tight text-background">
                    {formatInr(data.minimumAmount)}
                  </p>
                </div>
                <div className="rounded-2xl bg-background/12 px-3 py-2">
                  <p className="text-[0.6rem] font-bold uppercase tracking-widest text-background/70">
                    Pending
                  </p>
                  <p className="mt-0.5 text-sm font-black tracking-tight text-background">
                    {formatInr(data.pendingAmount)}
                  </p>
                </div>
              </div>
            </section>

            <section className="card-soft animate-slide-up stagger-1 mt-5 border border-border p-4">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                  <Landmark className="size-4" />
                </span>
                <p className="text-sm font-bold tracking-tight text-foreground">Withdrawal details</p>
              </div>

              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
                    Amount
                  </span>
                  <div className="field-focus mt-1.5 flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3">
                    <span className="text-sm font-black text-muted-foreground">₹</span>
                    <input
                      inputMode="numeric"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="0"
                      className="w-full bg-transparent text-sm font-bold text-foreground outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setAmount(String(data.available))}
                      className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-widest text-brand-dark"
                    >
                      Max
                    </button>
                  </div>
                </label>

                <div className="flex gap-2">
                  {(["bank", "upi"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMethod(option)}
                      className={`flex-1 rounded-2xl border px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-colors ${
                        method === option
                          ? "border-brand-green bg-secondary/10 text-brand-green"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {option === "bank" ? "Bank Transfer" : "UPI"}
                    </button>
                  ))}
                </div>

                <label className="block">
                  <span className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
                    {method === "bank" ? "Bank Account / IFSC" : "UPI ID"}
                  </span>
                  <input
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    placeholder={method === "bank" ? "Account number · IFSC" : "name@upi"}
                    className="field-focus mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground outline-none"
                  />
                </label>
              </div>

              {error ? (
                <p className="mt-3 text-[0.72rem] font-bold text-destructive">{error}</p>
              ) : null}
            </section>

            <div className="animate-slide-up stagger-2 mt-4 flex items-start gap-2 rounded-2xl bg-muted px-4 py-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-green" />
              <p className="text-[0.68rem] font-medium text-muted-foreground">
                Withdrawals are reviewed before payout by the admin team.
              </p>
            </div>

            <div className="mt-3 flex items-center gap-2 text-muted-foreground">
              <Clock3 className="size-3.5" />
              <p className="text-[0.66rem] font-semibold">
                Pending settlement {formatInr(data.pendingAmount)}
              </p>
            </div>

            <button
              type="button"
              disabled={requestWithdrawal.isPending}
              onClick={handleSubmit}
              className="ripple mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97] disabled:opacity-60"
            >
              {requestWithdrawal.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Banknote className="size-4" />
              )}
              Request Withdrawal
            </button>
          </div>
        )}
      </div>

      <WalletSuccessOverlay
        message={success}
        onDone={() => {
          setSuccess(null);
          toast.success("Withdrawal request submitted");
          navigate({ to: partnerRoutes.wallet });
        }}
      />
      <Toaster />
    </main>
  );
}
