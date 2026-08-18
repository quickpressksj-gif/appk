import { Check, ChevronRight, Clock3, IndianRupee, X } from "lucide-react";

import type { LiveOrder } from "../../data/partner-dashboard-mock";

const STATUS_STYLE: Record<LiveOrder["status"], string> = {
  pending: "bg-primary/15 text-brand-dark",
  accepted: "bg-primary/15 text-brand-dark",
  pickup: "bg-secondary/10 text-brand-green",
  washing: "bg-secondary/10 text-brand-green",
  ironing: "bg-secondary/10 text-brand-green",
  ready: "bg-secondary/10 text-brand-green",
  delivered: "bg-muted text-muted-foreground",
};

/**
 * Sprint 3.2 — premium live order card with Accept / Reject / View actions.
 * UI only: handlers are passed in from the dashboard screen.
 */
export function LiveOrderCard({
  order,
  delay = 0,
  onAccept,
  onReject,
  onView,
}: {
  order: LiveOrder;
  delay?: number;
  onAccept: (order: LiveOrder) => void;
  onReject: (order: LiveOrder) => void;
  onView: (order: LiveOrder) => void;
}) {
  return (
    <article
      className="card-soft animate-rise border border-border p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black tracking-tight text-foreground">
            {order.customerName}
          </p>
          <p className="mt-0.5 truncate text-[0.7rem] font-semibold text-muted-foreground">
            {order.code}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-wider ${STATUS_STYLE[order.status]}`}
        >
          {order.status}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[0.7rem] font-semibold text-muted-foreground">
        <Clock3 className="size-3.5 shrink-0" />
        <span className="truncate">{order.pickupTime}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {order.services.map((service) => (
          <span
            key={service}
            className="rounded-full bg-muted px-2.5 py-1 text-[0.62rem] font-bold tracking-tight text-foreground"
          >
            {service}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border pt-3">
        <span className="flex items-center gap-0.5 text-base font-black tracking-tight text-foreground">
          <IndianRupee className="size-4" />
          {order.amount.toLocaleString("en-IN")}
        </span>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onReject(order)}
            className="flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-2 text-[0.66rem] font-bold text-destructive transition-all duration-300 hover:bg-destructive/20 active:scale-[0.95]"
          >
            <X className="size-3.5" /> Reject
          </button>
          <button
            type="button"
            onClick={() => onAccept(order)}
            className="flex items-center gap-1 rounded-full bg-secondary/15 px-3 py-2 text-[0.66rem] font-bold text-brand-green transition-all duration-300 hover:bg-secondary/25 active:scale-[0.95]"
          >
            <Check className="size-3.5" /> Accept
          </button>
          <button
            type="button"
            onClick={() => onView(order)}
            className="flex items-center gap-1 rounded-full bg-muted px-3 py-2 text-[0.66rem] font-bold text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.95]"
          >
            View <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
