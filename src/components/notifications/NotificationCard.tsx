import {
  AlertTriangle,
  BellRing,
  Gift,
  MessageSquare,
  PackageCheck,
  PackagePlus,
  Trash2,
  Truck,
  Wallet,
  IndianRupee,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  NOTIFICATION_CATEGORY_META,
  type NotificationCategory,
  type NotificationPriority,
  type PartnerNotification,
} from "../../data/partner-notifications-mock";

const CATEGORY_ICON: Record<NotificationCategory, LucideIcon> = {
  "new-order": PackagePlus,
  "order-update": PackageCheck,
  pickup: Truck,
  delivery: Truck,
  payment: IndianRupee,
  wallet: Wallet,
  message: MessageSquare,
  promotion: Gift,
  system: AlertTriangle,
};

const TONE_CLASS = {
  primary: "bg-primary/15 text-brand-dark",
  green: "bg-secondary/15 text-brand-green-dark",
  danger: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
} as const;

function PriorityBadge({ priority }: { priority: NotificationPriority }) {
  const label = priority === "high" ? "High" : priority === "medium" ? "Medium" : "Low";
  const tone =
    priority === "high"
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : priority === "medium"
        ? "border-primary/40 bg-primary/10 text-brand-dark"
        : "border-border bg-muted text-muted-foreground";

  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wider ${tone}`}
    >
      {label} priority
    </span>
  );
}

/** Sprint 3.8 — single notification row with icon, priority, read state, actions. */
export function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: PartnerNotification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = NOTIFICATION_CATEGORY_META[notification.category];
  const Icon = CATEGORY_ICON[notification.category] ?? BellRing;

  return (
    <article
      className={`card-soft animate-slide-up flex gap-3 border p-4 transition-all duration-300 hover:border-primary/60 ${
        notification.read ? "border-border" : "border-primary/50 bg-primary/5"
      }`}
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${TONE_CLASS[meta.tone]}`}
      >
        <Icon className="size-5" strokeWidth={2.1} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start gap-2">
          <p className="min-w-0 flex-1 text-sm font-bold tracking-tight text-foreground">
            {notification.title}
          </p>
          {notification.read ? null : (
            <span
              className="mt-1.5 size-2 shrink-0 rounded-full bg-secondary"
              aria-label="Unread"
            />
          )}
        </div>
        <p className="mt-0.5 text-[0.72rem] font-medium text-muted-foreground">
          {notification.description}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
            {meta.label}
          </span>
          <PriorityBadge priority={notification.priority} />
          <span className="text-[0.66rem] font-bold uppercase tracking-wider text-muted-foreground">
            {notification.time}
          </span>
          <span className="text-[0.66rem] font-bold uppercase tracking-wider text-muted-foreground">
            · {notification.read ? "Read" : "Unread"}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {notification.read ? null : (
            <button
              type="button"
              onClick={() => onMarkRead(notification.id)}
              className="ripple inline-flex min-h-9 items-center gap-1.5 rounded-2xl border border-border bg-card px-3 text-[0.68rem] font-bold tracking-tight text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.96]"
            >
              <Check className="size-3.5" aria-hidden="true" />
              Mark as read
            </button>
          )}
          <button
            type="button"
            aria-label={`Delete notification: ${notification.title}`}
            onClick={() => onDelete(notification.id)}
            className="ripple inline-flex min-h-9 items-center gap-1.5 rounded-2xl border border-border bg-card px-3 text-[0.68rem] font-bold tracking-tight text-destructive transition-all duration-300 hover:border-destructive/60 active:scale-[0.96]"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}