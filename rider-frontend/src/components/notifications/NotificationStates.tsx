import { BellOff, CloudOff, Megaphone, SearchX, type LucideIcon } from "lucide-react";

export type NotificationStateId =
  | "no-notifications"
  | "no-results"
  | "offline"
  | "no-announcements"
  | "no-threads";

const COPY: Record<NotificationStateId, { icon: LucideIcon; title: string; body: string; action?: string }> = {
  "no-notifications": {
    icon: BellOff,
    title: "You're all caught up",
    body: "Order alerts, payment updates and announcements will appear here.",
  },
  "no-results": {
    icon: SearchX,
    title: "Nothing matches that filter",
    body: "Try another category or clear the search to see everything.",
    action: "Clear filters",
  },
  offline: {
    icon: CloudOff,
    title: "You are offline",
    body: "We couldn't refresh your notifications. Check your connection and retry.",
    action: "Retry",
  },
  "no-announcements": {
    icon: Megaphone,
    title: "No announcements yet",
    body: "Company updates, policy changes and zone news will show up here.",
  },
  "no-threads": {
    icon: BellOff,
    title: "No conversations",
    body: "Chats with customers, partners and support open automatically during a delivery.",
  },
};

/** Shared empty / offline state for the notifications module. */
export function NotificationStateView({
  state,
  onAction,
}: {
  state: NotificationStateId;
  onAction?: () => void;
}) {
  const copy = COPY[state];
  const Icon = copy.icon;

  return (
    <div className="card-soft animate-rise flex flex-col items-center border border-border px-6 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-3xl bg-muted">
        <Icon className="size-6 text-muted-foreground" strokeWidth={2} />
      </span>
      <h3 className="mt-4 text-base font-black tracking-tight text-foreground">{copy.title}</h3>
      <p className="mt-1 max-w-xs text-[0.72rem] font-medium leading-relaxed text-muted-foreground">
        {copy.body}
      </p>
      {copy.action && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 min-h-11 rounded-full bg-primary/15 px-5 text-xs font-black tracking-tight text-brand-dark"
        >
          {copy.action}
        </button>
      ) : null}
    </div>
  );
}

export function NotificationOfflineBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="animate-rise mx-5 mt-3 flex items-center gap-3 rounded-2xl bg-destructive/10 px-4 py-3">
      <CloudOff className="size-4 shrink-0 text-destructive" strokeWidth={2.2} />
      <p className="flex-1 text-[0.7rem] font-bold text-destructive">
        Offline — showing your last synced notifications.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-11 rounded-full px-3 text-[0.68rem] font-black text-destructive underline"
      >
        Retry
      </button>
    </div>
  );
}