import { BarChart3, CloudOff, Loader2, Trophy, type LucideIcon } from "lucide-react";

export type AnalyticsStateId = "no-analytics" | "no-data" | "offline" | "loading";

const COPY: Record<
  AnalyticsStateId,
  { icon: LucideIcon; title: string; body: string; action?: string }
> = {
  "no-analytics": {
    icon: BarChart3,
    title: "No analytics yet",
    body: "Complete your first deliveries and your performance dashboard will build itself here.",
  },
  "no-data": {
    icon: Trophy,
    title: "Nothing matches this filter",
    body: "Try a different range or clear the search to see the full picture.",
    action: "Reset filters",
  },
  offline: {
    icon: CloudOff,
    title: "You are offline",
    body: "We could not refresh your analytics. Reconnect and try again.",
    action: "Retry",
  },
  loading: {
    icon: Loader2,
    title: "Crunching your numbers",
    body: "Preparing earnings, trends and badges.",
  },
};

export function AnalyticsStateView({
  state,
  onAction,
}: {
  state: AnalyticsStateId;
  onAction?: () => void;
}) {
  const copy = COPY[state];
  const Icon = copy.icon;

  return (
    <div className="card-soft animate-rise mt-4 flex flex-col items-center border border-border px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-3xl bg-muted text-muted-foreground">
        <Icon className={`size-6 ${state === "loading" ? "animate-spin" : ""}`} />
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

/** Thin offline banner for analytics screens. */
export function AnalyticsOfflineBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="animate-slide-in mx-5 mt-3 flex items-center gap-2 rounded-2xl border border-border bg-muted px-3 py-2.5">
      <CloudOff className="size-4 shrink-0 text-muted-foreground" />
      <p className="min-w-0 flex-1 truncate text-[0.7rem] font-semibold text-muted-foreground">
        Showing cached analytics — you are offline.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 rounded-full bg-card px-3 py-1 text-[0.66rem] font-black tracking-tight text-foreground active:scale-[0.96]"
      >
        Retry
      </button>
    </div>
  );
}
