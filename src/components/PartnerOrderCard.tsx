import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, IndianRupee, MapPin, Package } from "lucide-react";

import { partnerRoutes } from "../navigation/partner-routes";
import type { PartnerOrder, PartnerOrderStatus } from "@shared/types/partner";

export const STATUS_LABEL: Record<PartnerOrderStatus, string> = {
  new: "New",
  accepted: "Accepted",
  picked: "Picked up",
  processing: "Processing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_TONE: Record<PartnerOrderStatus, string> = {
  new: "bg-primary/15 text-brand-dark",
  accepted: "bg-primary/15 text-brand-dark",
  picked: "bg-secondary/10 text-brand-green",
  processing: "bg-secondary/10 text-brand-green",
  ready: "bg-secondary/10 text-brand-green",
  delivered: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export function PartnerOrderCard({
  order,
  delay = 0,
}: {
  order: PartnerOrder;
  delay?: number;
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button" onClick={() =>
        navigate({ to: partnerRoutes.orderDetails, params: { orderId: order.id } })
      }
      className="card-soft ripple w-full border border-border p-4 text-left transition-all duration-300 hover:border-primary/60 active:scale-[0.985]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black tracking-tight text-foreground">
            {order.customerName}
          </p>
          <p className="mt-0.5 truncate text-[0.7rem] font-semibold text-muted-foreground">
            {order.code} · {order.serviceLabel}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider ${STATUS_TONE[order.status]}`}
        >
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[0.7rem] font-medium text-muted-foreground">
        <MapPin className="size-3.5 shrink-0" />
        <span className="truncate">{order.address}</span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-3 text-[0.7rem] font-semibold text-muted-foreground">
          <span className="flex items-center gap-1">
            <Package className="size-3.5" />
            {order.itemCount} items
          </span>
          <span className="flex items-center gap-0.5 text-foreground">
            <IndianRupee className="size-3.5" />
            {order.amount.toLocaleString("en-IN")}
          </span>
        </div>
        <span className="flex items-center gap-1 text-[0.7rem] font-bold text-brand-dark">
          {order.slot.split("·")[0]}
          <ChevronRight className="size-3.5" />
        </span>
      </div>
    </button>
  );
}
