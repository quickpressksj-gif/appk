import { CloudOff, Gift, Receipt, Wallet, type LucideIcon } from "lucide-react";

export type WalletStateId = "no-earnings" | "no-transactions" | "no-incentives" | "offline";

const COPY: Record<WalletStateId, { icon: LucideIcon; title: string; body: string; action?: string }> = {
  "no-earnings": {
    icon: Wallet,
    title: "No earnings in this range",
    body: "Complete deliveries in the selected period and your earnings will show up here.",
  },
  "no-transactions": {
    icon: Receipt,
    title: "No transactions found",
    body: "Try a different date range or transaction type to see more activity.",
    action: "Reset filters",
  },
  "no-incentives": {
    icon: Gift,
    title: "Incentives are not available yet",
    body: "The incentives program is not live on your account yet. Check back soon.",
  },
  offline: {
    icon: CloudOff,
    title: "You are offline",
    body: "We could not refresh your wallet. Check your connection and try again.",
    action: "Retry",
  },
};

export function WalletStateView({
  state,
  onAction,
}: {
  state: WalletStateId;
  onAction?: () => void;
}) {
  const copy = COPY[state];
  const Icon = copy.icon;

  return (
    <div className="card-soft animate-rise mt-4 flex flex-col items-center border border-border px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <p className="mt-4 text-base font-black tracking-tight text-foreground">{copy.title}</p>
      <p className="mt-1 max-w-sm text-xs font-medium text-muted-foreground">{copy.body}</p>
      {copy.action && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="ripple mt-5 min-h-11 rounded-2xl bg-primary px-6 text-xs font-black tracking-tight text-primary-foreground shadow-cta active:scale-[0.97]"
        >
          {copy.action}
        </button>
      ) : null}
    </div>
  );
}

/** Thin banner shown at the top of wallet screens while offline. */
export function WalletOfflineBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="animate-slide-in mx-5 mt-3 flex items-center gap-2 rounded-2xl border border-border bg-muted px-3 py-2.5">
      <CloudOff className="size-4 shrink-0 text-muted-foreground" />
      <p className="min-w-0 flex-1 truncate text-[0.7rem] font-semibold text-muted-foreground">
        Offline — showing your last synced wallet.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 rounded-full bg-background px-3 py-1 text-[0.66rem] font-black tracking-tight text-foreground"
      >
        Retry
      </button>
    </div>
  );
}