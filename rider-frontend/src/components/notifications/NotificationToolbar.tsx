import { CheckCheck, Search, Trash2 } from "lucide-react";

import {
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
} from "../../data/rider-notifications-mock";

/** Search, category chips, unread toggle and bulk actions for notifications. */
export function NotificationToolbar({
  query,
  onQuery,
  category,
  onCategory,
  unreadOnly,
  onUnreadOnly,
  unreadCount,
  resultCount,
  onMarkAllRead,
  onClearAll,
}: {
  query: string;
  onQuery: (next: string) => void;
  category: NotificationCategory | "all";
  onCategory: (next: NotificationCategory | "all") => void;
  unreadOnly: boolean;
  onUnreadOnly: (next: boolean) => void;
  unreadCount: number;
  resultCount: number;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}) {
  return (
    <div className="animate-rise space-y-3">
      <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-border bg-card px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={2.2} />
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search notifications"
          aria-label="Search notifications"
          className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {NOTIFICATION_CATEGORIES.map((item) => {
          const active = item.id === category;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onCategory(item.id)}
              aria-pressed={active}
              className={`min-h-11 shrink-0 rounded-full px-4 text-xs font-bold tracking-tight transition-colors active:scale-[0.97] ${
                active
                  ? "bg-primary/15 text-brand-dark"
                  : "border border-border text-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onUnreadOnly(!unreadOnly)}
          aria-pressed={unreadOnly}
          className={`min-h-11 rounded-full px-4 text-xs font-bold tracking-tight transition-colors ${
            unreadOnly ? "bg-secondary/15 text-brand-green" : "border border-border text-muted-foreground"
          }`}
        >
          Unread only · {unreadCount}
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onMarkAllRead}
            className="flex min-h-11 items-center gap-1.5 rounded-full border border-border px-3 text-[0.7rem] font-bold text-foreground"
          >
            <CheckCheck className="size-4" strokeWidth={2.2} /> Mark all read
          </button>
          <button
            type="button"
            onClick={onClearAll}
            aria-label="Clear all notifications"
            className="grid min-h-11 min-w-11 place-items-center rounded-full border border-border text-muted-foreground"
          >
            <Trash2 className="size-4" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <p className="text-[0.68rem] font-semibold text-muted-foreground">
        {resultCount} {resultCount === 1 ? "notification" : "notifications"}
      </p>
    </div>
  );
}