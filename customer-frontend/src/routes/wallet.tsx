import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Gift,
  Loader2,
  Plus,
  Receipt,
  RefreshCcw,
  Share2,
  Sparkles,
  Users,
  Wallet as WalletIcon,
  WifiOff,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { BottomNav } from "@/components/home/BottomNav";
import { WalletSkeleton } from "@/components/rewards/RewardsSkeletons";
import { NotificationBellAction, ScreenTopBar } from "@/components/rewards/ScreenTopBar";
import { Toaster } from "@/shared/ui/sonner";
import {
  QUICK_AMOUNTS,
  addFunds,
  fetchWallet,
  fetchWalletHistory,
  formatAmount,
  type TransactionKind,
  type TransactionStatus,
  type Wallet,
  type WalletTransaction,
} from "@/api/customer/wallet-api";
import {
  fetchPayments,
  fetchRefunds,
  type PaymentRecord,
  type RefundRecord,
} from "@/api/customer/payments-api";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — QuickPress Cashback & Rewards" },
      {
        name: "description",
        content:
          "Check your QuickPress wallet balance, cashback and reward points, add money, redeem rewards and track every laundry transaction in one place.",
      },
      { property: "og:title", content: "Wallet — QuickPress Cashback & Rewards" },
      {
        property: "og:description",
        content:
          "Wallet balance, cashback, reward points and referral earnings for your QuickPress laundry orders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WalletScreen,
});

const TXN_META: Record<TransactionKind, { icon: typeof Receipt; tone: string }> = {
  "order-cashback": { icon: Sparkles, tone: "bg-primary/15 text-brand-dark" },
  "referral-bonus": { icon: Users, tone: "bg-secondary/10 text-brand-green" },
  refund: { icon: RefreshCcw, tone: "bg-secondary/10 text-brand-green" },
  recharge: { icon: Plus, tone: "bg-primary/15 text-brand-dark" },
  "add-funds": { icon: Plus, tone: "bg-primary/15 text-brand-dark" },
  "reward-credit": { icon: Gift, tone: "bg-muted text-muted-foreground" },
  "membership-credit": { icon: Sparkles, tone: "bg-secondary/10 text-brand-green" },
  "order-payment": { icon: Receipt, tone: "bg-primary/15 text-brand-dark" },
};

const STATUS_TONE: Record<TransactionStatus, string> = {
  success: "bg-secondary/10 text-brand-green",
  pending: "bg-primary/15 text-brand-dark",
  failed: "bg-destructive/10 text-destructive",
};

const PAYMENT_STATUS_TONE: Record<string, string> = {
  paid: "bg-secondary/10 text-brand-green",
  completed: "bg-secondary/10 text-brand-green",
  pending: "bg-primary/15 text-brand-dark",
  processing: "bg-primary/15 text-brand-dark",
  created: "bg-primary/15 text-brand-dark",
  requested: "bg-primary/15 text-brand-dark",
  failed: "bg-destructive/10 text-destructive",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-destructive/10 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

function statusTone(status: string) {
  return PAYMENT_STATUS_TONE[status] ?? "bg-muted text-muted-foreground";
}

function WalletScreen() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[] | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [adding, setAdding] = useState(false);

  // GET /api/wallet + /api/wallet/history + /api/payments + /api/refunds
  const load = useCallback(async (forceRefresh = false) => {
    setError(null);
    try {
      const [walletResult, history] = await Promise.all([
        fetchWallet({ forceRefresh }),
        fetchWalletHistory({ forceRefresh }),
      ]);
      setWallet(walletResult);
      setTransactions(history.items);
      setOffline(walletResult.fromCache || history.fromCache);
      const [paymentsResult, refundsResult] = await Promise.allSettled([
        fetchPayments({ forceRefresh }),
        fetchRefunds({ forceRefresh }),
      ]);
      if (paymentsResult.status === "fulfilled") setPayments(paymentsResult.value.items);
      if (refundsResult.status === "fulfilled") setRefunds(refundsResult.value.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't load your wallet.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Auto-sync when the device comes back online.
  useEffect(() => {
    const onOnline = () => void load(true);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [load]);

  const handleRefresh = async () => {
    setBusy("refresh");
    await load(true);
    setBusy(null);
  };

  const submitAddFunds = async (value: number) => {
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter an amount greater than ₹0");
      return;
    }
    setAdding(true);
    try {
      const result = await addFunds(value);
      setWallet(result.wallet);
      toast.success(result.message);
      setAddOpen(false);
      setAmount("");
      await load(true);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Couldn't add money right now");
    } finally {
      setAdding(false);
    }
  };

  const handleShareReferral = async () => {
    const code = wallet?.referralCode ?? "QPRESS250";
    const text = `Use my QuickPress code ${code} and get ₹150 off your first laundry pickup!`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "QuickPress", text });
        return;
      } catch {
        /* user dismissed the share sheet */
      }
    }
    await navigator.clipboard?.writeText(text);
    toast.success("Referral link copied");
  };

  const quickActions = [
    { id: "add", label: "Add Money", icon: Plus, onClick: () => setAddOpen(true) },
    {
      id: "refresh",
      label: "Refresh",
      icon: RefreshCcw,
      onClick: () => void handleRefresh(),
    },
    {
      id: "redeem",
      label: "Redeem",
      icon: Gift,
      onClick: () => navigate({ to: "/offers" }),
    },
    {
      id: "history",
      label: "History",
      icon: Receipt,
      onClick: () =>
        document.getElementById("wallet-transactions")?.scrollIntoView({ behavior: "smooth" }),
    },
  ];

  const loading = !wallet || !transactions;

  return (
    <main className="relative min-h-screen overflow-x-hidden scroll-smooth bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <ScreenTopBar title="Wallet" action={<NotificationBellAction count={2} />} />

        {loading && !error ? (
          <WalletSkeleton />
        ) : error && !wallet ? (
          <div className="px-5 pb-32 pt-4">
            <section className="card-soft border border-border p-6 text-center">
              <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <WifiOff className="size-5" />
              </span>
              <p className="mt-3 text-sm font-black tracking-tight text-foreground">
                Wallet unavailable
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              <button
                type="button"
                onClick={() => void load(true)}
                className="mt-4 rounded-full bg-gradient-to-r from-brand-green to-primary px-5 py-2.5 text-xs font-black tracking-tight text-background shadow-cta transition-transform duration-300 active:scale-[0.96]"
              >
                Try again
              </button>
            </section>
          </div>
        ) : wallet ? (
          <div className="px-5 pb-32 pt-4">
            {offline ? (
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-dashed border-border bg-muted/60 px-4 py-2.5">
                <WifiOff className="size-4 shrink-0 text-muted-foreground" />
                <p className="text-[0.68rem] font-semibold text-muted-foreground">
                  Showing saved wallet data — it syncs when you're back online.
                </p>
              </div>
            ) : null}

            {/* Balance card — GET /api/wallet */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand-dark to-brand-green p-5 shadow-soft">
              <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-primary/25 blur-2xl" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-widest text-background/70">
                    Current Balance
                  </p>
                  <p className="mt-1 text-3xl font-black tracking-tight text-background">
                    {formatAmount(wallet.balances.currentBalance)}
                  </p>
                </div>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-background/15 text-background">
                  <WalletIcon className="size-5" />
                </span>
              </div>

              <div className="relative mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-background/12 px-4 py-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-background/70">
                    Pending
                  </p>
                  <p className="mt-0.5 text-lg font-black tracking-tight text-background">
                    {formatAmount(wallet.balances.pendingBalance)}
                  </p>
                </div>
                <div className="rounded-2xl bg-background/12 px-4 py-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-background/70">
                    Rewards
                  </p>
                  <p className="mt-0.5 text-lg font-black tracking-tight text-background">
                    {formatAmount(wallet.balances.rewardBalance)}
                  </p>
                </div>
                <div className="rounded-2xl bg-background/12 px-4 py-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-background/70">
                    Membership Credits
                  </p>
                  <p className="mt-0.5 text-lg font-black tracking-tight text-background">
                    {formatAmount(wallet.balances.membershipCredits)}
                  </p>
                </div>
                <div className="rounded-2xl bg-background/12 px-4 py-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-background/70">
                    Total
                  </p>
                  <p className="mt-0.5 text-lg font-black tracking-tight text-background">
                    {formatAmount(wallet.totalBalance)}
                  </p>
                </div>
              </div>
            </section>

            {/* Quick actions */}
            <section className="stagger-children mt-5 grid grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={action.onClick}
                  disabled={busy === action.id} className="card-soft ripple flex flex-col items-center gap-2 border border-border px-2 py-3 transition-all duration-300 hover:border-primary/60 active:scale-[0.96] disabled:opacity-70"
                >
                  <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                    {busy === action.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <action.icon className="size-4" strokeWidth={2.2} />
                    )}
                  </span>
                  <span className="text-[0.68rem] font-bold tracking-tight text-foreground">
                    {action.label}
                  </span>
                </button>
              ))}
            </section>

            {/* Wallet ledger — GET /api/wallet/history */}
            <section id="wallet-transactions" className="mt-7 scroll-mt-20">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black tracking-tight text-foreground">
                  Recent Transactions
                </h2>
                <span className="text-[0.68rem] font-semibold text-muted-foreground">
                  {transactions?.length ?? 0} entries
                </span>
              </div>

              <div className="stagger-children mt-4 space-y-3">
                {(transactions ?? []).length === 0 ? (
                  <article className="card-soft border border-border p-6 text-center">
                    <p className="text-sm font-bold tracking-tight text-foreground">
                      No wallet activity yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Add money to your wallet to see transactions here.
                    </p>
                  </article>
                ) : (
                  (transactions ?? []).map((txn) => {
                    const meta = TXN_META[txn.kind] ?? TXN_META["add-funds"];
                    const Icon = meta.icon;
                    const isCredit = txn.direction === "credit";
                    return (
                      <article
                        key={txn.id} className="card-soft flex items-center gap-3 border border-border p-4 transition-all duration-300 hover:border-primary/60"
                      >
                        <span
                          className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${meta.tone}`}
                        >
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold tracking-tight text-foreground">
                            {txn.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <p className="truncate text-[0.68rem] text-muted-foreground">
                              {txn.dateLabel}
                            </p>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide ${STATUS_TONE[txn.status]}`}
                            >
                              {txn.status}
                            </span>
                          </div>
                        </div>
                        <p
                          className={`shrink-0 text-sm font-black tracking-tight ${
                            isCredit ? "text-brand-green" : "text-foreground"
                          }`}
                        >
                          {isCredit ? "+" : "−"}
                          {formatAmount(txn.amount)}
                        </p>
                      </article>
                    );
                  })
                )}
              </div>
            </section>

            {/* Payment history — GET /api/payments */}
            <section className="mt-7">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black tracking-tight text-foreground">
                  Payment History
                </h2>
                <span className="text-[0.68rem] font-semibold text-muted-foreground">
                  {payments.length} payments
                </span>
              </div>

              <div className="stagger-children mt-4 space-y-3">
                {payments.length === 0 ? (
                  <article className="card-soft border border-border p-6 text-center">
                    <p className="text-sm font-bold tracking-tight text-foreground">
                      No payments yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your order payments will appear here with their transaction IDs.
                    </p>
                  </article>
                ) : (
                  payments.map((payment) => (
                    <article
                      key={payment.id}
                      className="card-soft border border-border p-4 transition-all duration-300 hover:border-primary/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold tracking-tight text-foreground">
                            {payment.methodLabel}
                          </p>
                          <p className="mt-1 text-[0.68rem] text-muted-foreground">
                            {payment.dateLabel} · {payment.transactionId}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-black tracking-tight text-foreground">
                            {formatAmount(payment.amount)}
                          </p>
                          <span
                            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide ${statusTone(payment.status)}`}
                          >
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            {/* Refunds — GET /api/refunds */}
            <section className="mt-7">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black tracking-tight text-foreground">Refunds</h2>
                <span className="text-[0.68rem] font-semibold text-muted-foreground">
                  {refunds.length} refunds
                </span>
              </div>

              <div className="stagger-children mt-4 space-y-3">
                {refunds.length === 0 ? (
                  <article className="card-soft border border-border p-6 text-center">
                    <p className="text-sm font-bold tracking-tight text-foreground">
                      No refunds yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Refunds for cancelled orders show up here.
                    </p>
                  </article>
                ) : (
                  refunds.map((refund) => (
                    <article
                      key={refund.id}
                      className="card-soft flex items-center gap-3 border border-border p-4 transition-all duration-300 hover:border-primary/60"
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-brand-green">
                        <RefreshCcw className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold tracking-tight text-foreground">
                          {refund.reason}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="truncate text-[0.68rem] text-muted-foreground">
                            {refund.dateLabel}
                          </p>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide ${statusTone(refund.status)}`}
                          >
                            {refund.status}
                          </span>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm font-black tracking-tight text-brand-green">
                        +{formatAmount(refund.amount)}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>

            {/* Refer & earn */}
            <section className="card-soft mt-7 border border-border p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-brand-green">
                  <Users className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-black tracking-tight text-foreground">
                    Refer &amp; Earn
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Invite friends and you both earn ₹150 wallet credit on their first pickup.
                    You've earned {formatAmount(wallet.referralEarned)} so far.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(wallet.referralCode);
                    toast.success("Referral code copied");
                  }}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-2xl border border-dashed border-primary bg-primary/10 px-4 py-3 transition-all duration-300 active:scale-[0.97]"
                >
                  <span className="truncate text-sm font-black tracking-widest text-brand-dark">
                    {wallet.referralCode || "—"}
                  </span>
                  <Copy className="size-4 shrink-0 text-brand-dark" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleShareReferral()}
                  className="flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-brand-green to-primary px-5 py-3 text-xs font-black tracking-tight text-background shadow-cta transition-transform duration-300 active:scale-[0.96]"
                >
                  <Share2 className="size-4" />
                  Share
                </button>
              </div>
            </section>

            <button
              type="button"
              onClick={() => navigate({ to: "/payment-methods" })}
              className="card-soft mt-4 flex w-full items-center justify-between gap-3 border border-border p-4 transition-all duration-300 hover:border-primary/60 active:scale-[0.98]"
            >
              <span className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                  <WalletIcon className="size-5" />
                </span>
                <span className="text-sm font-bold tracking-tight text-foreground">
                  Payment Methods
                </span>
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground" />
            </button>

            <button
              type="button"
              onClick={() => navigate({ to: "/offers" })}
              className="card-soft mt-4 flex w-full items-center justify-between gap-3 border border-border p-4 transition-all duration-300 hover:border-primary/60 active:scale-[0.98]"
            >
              <span className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                  <Gift className="size-5" />
                </span>
                <span className="text-sm font-bold tracking-tight text-foreground">
                  Offers &amp; Coupons
                </span>
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Add funds sheet — POST /api/wallet/add-funds */}
      {addOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 px-0">
          <div className="w-full max-w-md rounded-t-3xl border border-border bg-background p-5 pb-8 shadow-soft">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-black tracking-tight text-foreground">Add Funds</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Money is credited to your QuickPress wallet instantly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="flex size-9 items-center justify-center rounded-2xl bg-muted text-muted-foreground transition-transform duration-300 active:scale-[0.94]"
                aria-label="Close add funds"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={adding}
                  onClick={() => setAmount(String(value))}
                  className={`rounded-2xl border px-2 py-3 text-xs font-black tracking-tight transition-all duration-300 active:scale-[0.96] disabled:opacity-70 ${
                    amount === String(value)
                      ? "border-primary bg-primary/15 text-brand-dark"
                      : "border-border bg-background text-foreground hover:border-primary/60"
                  }`}
                >
                  ₹{value}
                </button>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Custom amount
              </span>
              <input
                type="number"
                min={1}
                max={100000}
                inputMode="numeric"
                value={amount}
                disabled={adding}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter amount"
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-bold tracking-tight text-foreground outline-none transition-colors duration-300 focus:border-primary"
              />
            </label>

            <button
              type="button"
              disabled={adding}
              onClick={() => void submitAddFunds(Number(amount))}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-green to-primary px-5 py-3.5 text-sm font-black tracking-tight text-background shadow-cta transition-transform duration-300 active:scale-[0.97] disabled:opacity-70"
            >
              {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add {amount ? formatAmount(Number(amount) || 0) : "money"}
            </button>

            <p className="mt-3 text-center text-[0.65rem] text-muted-foreground">
              Card, UPI and Razorpay top-ups unlock once online payments go live.
            </p>
          </div>
        </div>
      ) : null}

      <BottomNav active="wallet" />
      <Toaster position="top-center" />
    </main>
  );
}
