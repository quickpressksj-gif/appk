import { CloudOff, PackageSearch, SearchX, type LucideIcon } from "lucide-react";

export type HistoryStateId = "no-history" | "no-results" | "offline";

const COPY: Record<HistoryStateId, { icon: LucideIcon; title: string; body: string; action?: string }> = {
  "no-history": {
    icon: PackageSearch,
    title: "No delivery history yet",
    body: "Trips you complete will be listed here with earnings, distance and ratings.",
  },
  "no-results": {
    icon: SearchX,
    title: "No matching deliveries",
    body: "Try a different order ID, customer, partner or clear a few filters.",
    action: "Clear filters",
  },
  offline: {
    icon: CloudOff,
    title: "You are offline",
    body: "We could not refresh your history. Check your connection and retry.",
    action: "Retry",
  },
};

export function HistoryStateView({
  state,
  onAction,
}: {
  state: HistoryStateId;
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