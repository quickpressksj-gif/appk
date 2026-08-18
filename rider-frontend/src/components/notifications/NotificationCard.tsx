import {
  AlertTriangle,
  BellRing,
  IndianRupee,
  LifeBuoy,
  Package,
  Settings2,
  Tag,
  type LucideIcon,
} from "lucide-react";

import type { NotificationCategory, RiderNotification } from "../../data/rider-notifications-mock";

const CATEGORY_META: Record<NotificationCategory, { icon: LucideIcon; label: string; tone: string }> = {
  order: { icon: Package, label: "Order", tone: "bg-primary/15 text-brand-dark" },
  payment: { icon: IndianRupee, label: "Payment", tone: "bg-secondary/10 text-brand-green" },
  system: { icon: Settings2, label: "System", tone: "bg-muted text-muted-foreground" },
  promotion: { icon: Tag, label: "Offer", tone: "bg-primary/25 text-brand-dark" },
  support: { icon: LifeBuoy, label: "Support", tone: "bg-secondary/10 text-brand-green" },
  alert: { icon: AlertTriangle, label: "Alert", tone: "bg-destructive/10 text-destructive" },
};

/** A single notification row with category icon, unread dot and inline action. */
export function NotificationCard({
  notification,
  delay = 0,
  onOpen,
  onAction,
}: {
  notification: RiderNotification;
  delay?: number;
  onOpen: () => void;
  onAction?: () => void;
}) {
  const meta = CATEGORY_META[notification.category];
  const Icon = meta.icon;
  const critical = notification.priority === "critical";

  return (
    <article
      className={`card-soft animate-rise border p-4 transition-colors ${
        notification.read ? "border-border" : "border-brand-green/40 bg-secondary/[0.04]"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <button type="button" onClick={onOpen} className="flex w-full items-start gap-3 text-left">
        <span className={`relative grid size-10 shrink-0 place-items-center rounded-2xl ${meta.tone}`}>
          <Icon className="size-5" strokeWidth={2.2} />
          {critical ? (
            <span className="animate-notify-ping absolute inset-0 rounded-2xl border-2 border-destructive/50" />
          ) : null}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-black tracking-tight text-foreground">
              {notification.title}
            </span>
            {notification.read ? null : (
              <span className="size-2 shrink-0 rounded-full bg-brand-green" aria-label="Unread" />
            )}
          </span>
          <span className="mt-1 block text-[0.72rem] font-medium leading-relaxed text-muted-foreground">
            {notification.body}
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
              {meta.label}
            </span>
            {notification.priority !== "normal" ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest ${
                  critical ? "bg-destructive/10 text-destructive" : "bg-primary/15 text-brand-dark"
                }`}
              >
                {critical ? "Urgent" : "High"}
              </span>
            ) : null}
            <span className="text-[0.62rem] font-semibold text-muted-foreground">
              {notification.time}
            </span>
          </span>
        </span>
      </button>

      {notification.actionLabel && onAction ? (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onAction}
            className="min-h-11 rounded-full bg-primary/15 px-4 text-[0.7rem] font-black tracking-tight text-brand-dark transition-transform active:scale-[0.97]"
          >
            {notification.actionLabel}
          </button>
        </div>
      ) : null}
    </article>
  );
}

export function NotificationBanner({
  notification,
  onDismiss,
  onOpen,
}: {
  notification: RiderNotification;
  onDismiss: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="animate-notify-drop fixed inset-x-0 top-3 z-50 px-4">
      <div className="glass-panel mx-auto flex w-full max-w-md items-start gap-3 rounded-3xl border border-border p-4 shadow-soft">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/15">
          <BellRing className="size-5 text-brand-dark" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black tracking-tight text-foreground">
            {notification.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[0.7rem] font-medium text-muted-foreground">
            {notification.body}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onOpen}
              className="min-h-11 rounded-full bg-primary/15 px-4 text-[0.68rem] font-black text-brand-dark"
            >
              Open
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="min-h-11 rounded-full px-3 text-[0.68rem] font-bold text-muted-foreground"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}