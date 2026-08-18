import { Inbox, SearchX, WifiOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type EmptyVariant = "no-orders" | "no-results" | "offline";

const VARIANTS: Record<EmptyVariant, { icon: LucideIcon; title: string; body: string; cta: string }> =
  {
    "no-orders": {
      icon: Inbox,
      title: "No orders in this stage",
      body: "New bookings land here the moment a customer schedules a pickup near your store.",
      cta: "Refresh",
    },
    "no-results": {
      icon: SearchX,
      title: "No matching orders",
      body: "Try a different order ID, customer name or mobile number — or clear your filters.",
      cta: "Clear search & filters",
    },
    offline: {
      icon: WifiOff,
      title: "You're offline",
      body: "We can't sync new orders right now. Reconnect and we'll pick up where you left off.",
      cta: "Try again",
    },
  };

export function OrderEmptyState({
  variant,
  onAction,
}: {
  variant: EmptyVariant;
  onAction?: () => void;
}) {
  const config = VARIANTS[variant];
  const Icon = config.icon;

  return (
    <div className="card-soft animate-soft-fade flex flex-col items-center border border-border px-6 py-12 text-center">
      <span
        className={`flex size-14 items-center justify-center rounded-3xl ${
          variant === "offline"
            ? "bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="size-6" />
      </span>
      <p className="mt-4 text-sm font-black tracking-tight text-foreground">{config.title}</p>
      <p className="mt-1 max-w-xs text-xs font-medium text-muted-foreground">{config.body}</p>
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="ripple mt-5 rounded-2xl border border-border bg-card px-5 py-2.5 text-xs font-bold tracking-tight text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.97]"
        >
          {config.cta}
        </button>
      ) : null}
    </div>
  );
}
