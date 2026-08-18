import { CloudOff, Inbox, RotateCcw, TriangleAlert, WifiOff } from "lucide-react";

/** Sprint 3.10 — shared empty / offline / error states for Settings. */

export function SettingsOfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="card-soft animate-soft-fade flex flex-col items-center border border-border px-6 py-10 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-3xl bg-destructive/10 text-destructive">
        <WifiOff className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-black tracking-tight text-foreground">You are offline</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">
        Settings changes are saved locally and will sync once you reconnect.
      </p>
      {onRetry ? <RetryButton onClick={onRetry} /> : null}
    </div>
  );
}

export function SettingsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="card-soft animate-soft-fade flex flex-col items-center border border-border px-6 py-10 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-3xl bg-destructive/10 text-destructive">
        <TriangleAlert className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-black tracking-tight text-foreground">
        Couldn&apos;t load your settings
      </p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">
        Something went wrong on our side. Try again in a moment.
      </p>
      <RetryButton onClick={onRetry} />
    </div>
  );
}

export function SettingsEmptyState({
  title,
  body,
  variant = "data",
}: {
  title: string;
  body: string;
  variant?: "data" | "sync";
}) {
  const Icon = variant === "sync" ? CloudOff : Inbox;

  return (
    <div className="card-soft animate-soft-fade flex flex-col items-center border border-dashed border-border px-6 py-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-bold tracking-tight text-foreground">{title}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{body}</p>
    </div>
  );
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ripple mt-5 inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-xs font-bold tracking-tight text-foreground transition-all duration-300 active:scale-[0.96]"
    >
      <RotateCcw className="size-3.5" aria-hidden="true" />
      Try again
    </button>
  );
}
