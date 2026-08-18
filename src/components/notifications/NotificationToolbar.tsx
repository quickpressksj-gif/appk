import { BellRing, CheckCheck, SlidersHorizontal, Trash2 } from "lucide-react";

import {
  NOTIFICATION_FILTERS,
  type NotificationFilterId,
} from "../../data/partner-notifications-mock";

/** Sprint 3.8 — filter chips + bulk actions for the Notification Center. */
export function NotificationToolbar({
  filter,
  onFilterChange,
  unread,
  total,
  onMarkAllRead,
  onClearAll,
}: {
  filter: NotificationFilterId;
  onFilterChange: (id: NotificationFilterId) => void;
  unread: number;
  total: number;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
        <span className="flex shrink-0 items-center gap-1 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          Filters
        </span>
        {NOTIFICATION_FILTERS.map((item) => {
          const isActive = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onFilterChange(item.id)}
              className={`min-h-9 shrink-0 rounded-full border px-3.5 text-[0.7rem] font-bold tracking-tight transition-all duration-300 active:scale-[0.96] ${
                isActive
                  ? "border-brand-green bg-secondary/10 text-brand-green-dark"
                  : "border-border bg-card text-muted-foreground hover:border-primary/60"
              }`}
            >
              {item.label}
              {item.id === "unread" && unread > 0 ? ` (${unread})` : ""}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
          <BellRing className="size-3.5" aria-hidden="true" />
          {total} shown · {unread} unread
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMarkAllRead}
            className="ripple inline-flex min-h-9 items-center gap-1.5 rounded-2xl border border-border bg-card px-3 text-[0.68rem] font-bold tracking-tight text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.96]"
          >
            <CheckCheck className="size-3.5" aria-hidden="true" />
            Mark all read
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="ripple inline-flex min-h-9 items-center gap-1.5 rounded-2xl border border-border bg-card px-3 text-[0.68rem] font-bold tracking-tight text-destructive transition-all duration-300 hover:border-destructive/60 active:scale-[0.96]"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Clear all
          </button>
        </div>
      </div>
    </div>
  );
}