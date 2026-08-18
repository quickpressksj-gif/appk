import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, IndianRupee, MapPin, Navigation, Package } from "lucide-react";

import { riderRoutes } from "../navigation/rider-routes";
import type { RiderOrder, RiderOrderStatus } from "@/shared/types/rider";

export const STATUS_LABEL: Record<RiderOrderStatus, string> = {
  assigned: "New",
  accepted: "Accepted",
  arriving: "Arriving",
  picked: "Picked up",
  "at-partner": "At partner",
  "ready-for-delivery": "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Failed",
};

export const STATUS_TONE: Record<RiderOrderStatus, string> = {
  assigned: "bg-primary/15 text-brand-dark",
  accepted: "bg-primary/15 text-brand-dark",
  arriving: "bg-primary/15 text-brand-dark",
  picked: "bg-secondary/10 text-brand-green",
  "at-partner": "bg-secondary/10 text-brand-green",
  "ready-for-delivery": "bg-secondary/10 text-brand-green",
  delivered: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  failed: "bg-destructive/10 text-destructive",
};

export function RiderOrderCard({
  order,
  delay = 0,
  onAccept,
  onReject,
}: {
  order: RiderOrder;
  delay?: number;
  onAccept?: (order: RiderOrder) => void;
  onReject?: (order: RiderOrder) => void;
}) {
  const navigate = useNavigate();
  const isNew = order.status === "assigned";

  return (
    <article className="card-soft border border-border p-4 transition-all duration-300 hover:border-primary/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${
                order.taskType === "pickup"
                  ? "bg-primary/15 text-brand-dark"
                  : "bg-secondary/10 text-brand-green"
              }`}
            >
              {order.taskType}
            </span>
            <p className="truncate text-[0.7rem] font-semibold text-muted-foreground">
              {order.code}
            </p>
          </div>
          <p className="mt-1.5 truncate text-sm font-black tracking-tight text-foreground">
            {order.customerName}
          </p>
          <p className="truncate text-[0.7rem] font-medium text-muted-foreground">
            {order.partnerName}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider ${STATUS_TONE[order.status]}`}
        >
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[0.7rem] font-medium text-muted-foreground">
          <MapPin className="size-3.5 shrink-0 text-brand-dark" />
          <span className="truncate">{order.pickupAddress}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[0.7rem] font-medium text-muted-foreground">
          <Navigation className="size-3.5 shrink-0 text-brand-green" />
          <span className="truncate">{order.deliveryAddress}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-3 text-[0.7rem] font-semibold text-muted-foreground">
          <span>{order.distanceKm} km</span>
          <span className="flex items-center gap-1">
            <Package className="size-3.5" />
            {order.itemCount}
          </span>
          <span className="flex items-center gap-0.5 text-foreground">
            <IndianRupee className="size-3.5" />
            {order.estimatedEarning}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: riderRoutes.orderDetails, params: { orderId: order.id } })}
          className="flex items-center gap-1 text-[0.7rem] font-bold text-brand-dark"
        >
          View details
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      {isNew && (onAccept || onReject) ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => onReject?.(order)}
            className="ripple flex-1 rounded-2xl border border-border bg-card py-3 text-xs font-black tracking-tight text-muted-foreground transition-all duration-300 active:scale-[0.97]"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => onAccept?.(order)}
            className="ripple flex-[1.6] rounded-2xl bg-primary py-3 text-xs font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97]"
          >
            Accept · ₹{order.estimatedEarning}
          </button>
        </div>
      ) : null}
    </article>
  );
}
