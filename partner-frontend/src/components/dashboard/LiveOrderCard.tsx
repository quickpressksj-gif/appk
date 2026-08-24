import { Check, ChevronRight, Clock3, IndianRupee, X } from "lucide-react";

export type LiveOrder = {
  id: string;
  code: string;
  customerName: string;
  pickupTime: string;
  services: string[];
  amount: number;
  status: "pending" | "accepted" | "pickup" | "washing" | "ironing" | "ready" | "delivered";
};



const STATUS_STYLE: Record<LiveOrder["status"], string> = {
  pending: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30",
  accepted: "bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30",
  pickup: "bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30",
  washing: "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30",
  ironing: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30",
  ready: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30",
  delivered: "bg-muted text-muted-foreground",
};

const STATUS_LABEL_MAP: Record<LiveOrder["status"], string> = {
  pending: "Pending",
  accepted: "Accepted",
  pickup: "Pickup Pending",
  washing: "Processing",
  ironing: "Ironing",
  ready: "Ready for Delivery",
  delivered: "Delivered",
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
          {STATUS_LABEL_MAP[order.status] || order.status}
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
          {order.status === "pending" ? (
            <>
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
            </>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[0.62rem] font-bold text-brand-green">
              <Check className="size-3" /> Accepted
            </span>
          )}
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
