import { useNavigate } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Clock3,
  Landmark,
  Loader2,
  Wallet as WalletIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerTopBar } from "../components/PartnerTopBar";
import { PartnerBottomNav } from "../components/PartnerBottomNav";
import { PartnerCardsSkeleton } from "../components/PartnerSkeletons";
import { SectionHeading, StatCard } from "../components/PartnerPrimitives";
import { usePartnerResource } from "../hooks/use-partner-resource";
import { partnerRoutes } from "../navigation/partner-routes";
import {
  fetchPartnerWallet,
  fetchPartnerWalletTransactions,
  withdrawToBank,
} from "@/api/partner/partner-wallet-api";

export function WalletScreen() {
  const navigate = useNavigate();
  const walletState = usePartnerResource(fetchPartnerWallet);
  const txnState = usePartnerResource(fetchPartnerWalletTransactions);
  const wallet = walletState.data;
  const transactions = txnState.data;
  const [busy, setBusy] = useState(false);

  const handleWithdraw = async () => {
    if (!wallet) return;
    setBusy(true);
    try {
      const result = await withdrawToBank(wallet.availableBalance);
      walletState.setData({ ...wallet, availableBalance: result.wallet.balance });
      toast.success("Withdrawal requested — credited within 24 hours");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <PartnerTopBar title="Wallet" onBack={() => navigate({ to: partnerRoutes.dashboard })} />

        {!wallet || !transactions ? (
          <PartnerCardsSkeleton />
        ) : (
          <div className="px-5 pb-32 pt-4">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand-dark to-brand-green p-5 shadow-soft">
              <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-primary/25 blur-2xl" />
              <div className="relative flex items-center gap-2 text-background/70">
                <WalletIcon className="size-4" />
                <p className="text-[0.68rem] font-semibold uppercase tracking-widest">
                  Available Balance
                </p>
              </div>
              <p className="relative mt-1 text-3xl font-black tracking-tight text-background">
                ₹{wallet.availableBalance.toLocaleString("en-IN")}
              </p>
              <p className="relative mt-1 text-[0.7rem] font-semibold text-background/70">
                ₹{wallet.onHold.toLocaleString("en-IN")} on hold · Bank ••{wallet.bankLast4}
              </p>

              <button
                type="button"
                disabled={busy || wallet.availableBalance === 0}
                onClick={() => void handleWithdraw()}
                className="ripple relative mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97] disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Banknote className="size-4" />}
                Withdraw to Bank
              </button>
            </section>

            <section className="mt-5 grid grid-cols-2 gap-3">
              <StatCard
                icon={Landmark}
                label="Lifetime Earned"
                value={`₹${(wallet.lifetimeEarned / 1000).toFixed(1)}k`}
                delay={0}
              />
              <StatCard
                icon={Clock3}
                label="Auto Payout"
                value={wallet.autoPayout ? "On" : "Off"}
                hint="Every Friday"
                tone="green"
                delay={45}
              />
            </section>

            <section className="mt-7">
              <SectionHeading title="Transactions" />
              <div className="card-soft mt-4 divide-y divide-border border border-border">
                {transactions.map((txn) => {
                  const isCredit = txn.direction === "credit";
                  return (
                    <div key={txn.id} className="flex items-center gap-3 px-4 py-3.5">
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${
                          isCredit
                            ? "bg-secondary/10 text-brand-green"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="size-4" />
                        ) : (
                          <ArrowUpRight className="size-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold tracking-tight text-foreground">
                          {txn.title}
                        </p>
                        <p className="truncate text-[0.68rem] font-medium text-muted-foreground">
                          {txn.date}
                          {txn.status !== "success" ? ` · ${txn.status}` : ""}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-black tracking-tight ${
                          isCredit ? "text-brand-green" : "text-foreground"
                        }`}
                      >
                        {isCredit ? "+" : "−"}₹{txn.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        <PartnerBottomNav active="wallet" />
      </div>
      <Toaster />
    </main>
  );
}
