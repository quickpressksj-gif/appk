import { CloudOff, PackageSearch, PowerOff, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DeliveryScreenState = "ready" | "empty" | "offline" | "no-internet" | "maintenance";

const STATE_COPY: Record<
  Exclude<DeliveryScreenState, "ready">,
  { icon: LucideIcon; title: string; body: string; action?: string }
> = {
  empty: {
    icon: PackageSearch,
    title: "No deliveries here yet",
    body: "New assignments land in this tab the moment they are allocated to you.",
  },
  offline: {
    icon: PowerOff,
    title: "You are offline",
    body: "Go online from the dashboard to start receiving delivery assignments.",
    action: "Go online",
  },
  "no-internet": {
    icon: CloudOff,
    title: "No internet connection",
    body: "We could not refresh your deliveries. Check your network and retry.",
    action: "Retry",
  },
  maintenance: {
    icon: Wrench,
    title: "Scheduled maintenance",
    body: "Delivery allocation is paused for a few minutes. Please check back shortly.",
    action: "Refresh",
  },
};

export function DeliveryStateView({
  state,
  onAction,
}: {
  state: Exclude<DeliveryScreenState, "ready">;
  onAction?: () => void;
}) {
  const copy = STATE_COPY[state];
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
