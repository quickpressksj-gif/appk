import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  Clock,
  IndianRupee,
  MapPin,
  Package,
  Star,
  Timer,
  Wallet,
} from "lucide-react";
import { useState } from "react";

import {
  STAGE_LABEL,
  STAGE_TONE,
  type ManagedOrder,
  type PaymentStatus,
} from "../../data/partner-orders-mock";
import { partnerRoutes } from "../../navigation/partner-routes";
import { OrderActionBar } from "./OrderActionBar";
import type { OrderActionId } from "./order-actions";

const PAYMENT_TONE: Record<PaymentStatus, string> = {
  paid: "bg-secondary/10 text-brand-green-dark",
  pending: "bg-primary/15 text-brand-dark",
  refunded: "bg-muted text-muted-foreground",
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  paid: "Paid",
  pending: "Payment pending",
  refunded: "Refunded",
};

export function OrderStatusBadge({ order }: { order: ManagedOrder }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider transition-colors duration-500 ${STAGE_TONE[order.stage]}`}
    >
      {STAGE_LABEL[order.stage]}
    </span>
  );
}

/** Expandable order card used across every stage tab. */
export function OrderCard({
  order,
  index = 0,
  onAction,
  busyAction,
}: {
  order: ManagedOrder;
  index?: number;
  onAction: (order: ManagedOrder, actionId: OrderActionId) => void;
  busyAction?: OrderActionId | null;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className="card-soft animate-rise border border-border p-4 transition-all duration-300 hover:border-primary/60"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-black tracking-tight text-foreground">
              {order.customerName}
            </p>
            <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[0.62rem] font-bold text-foreground">
              <Star className="size-3 fill-current text-brand-green" />
              {order.customerRating.toFixed(1)}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[0.7rem] font-semibold text-muted-foreground">
            {order.code} · {order.itemCount} items
          </p>
        </div>
        <OrderStatusBadge order={order} />
      </div>

      <div className="mt-3 space-y-1.5 text-[0.72rem] font-medium text-muted-foreground">
        <p className="flex items-start gap-1.5">
          <MapPin className="mt-px size-3.5 shrink-0" />
          <span className="line-clamp-2">{order.pickupAddress}</span>
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0" />
            {order.pickupTime}
          </span>
          <span className="flex items-center gap-1.5">
            <Timer className="size-3.5 shrink-0" />
            ETA {order.deliveryEta}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {order.services.map((service) => (
          <span
            key={service}
            className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[0.62rem] font-bold tracking-tight text-muted-foreground"
          >
            {service}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-0.5 text-sm font-black text-foreground">
            <IndianRupee className="size-3.5" />
            {order.amount.toLocaleString("en-IN")}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${PAYMENT_TONE[order.paymentStatus]}`}
          >
            {order.paymentMode === "cod" ? "COD" : "Online"} · {PAYMENT_LABEL[order.paymentStatus]}
          </span>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-1 text-[0.7rem] font-bold text-brand-dark"
        >
          {expanded ? "Less" : "More"}
          <ChevronDown
            className={`size-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 space-y-2 rounded-2xl bg-muted/50 p-3 text-[0.7rem] font-medium text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Package className="size-3.5 shrink-0" />
              {order.items.map((item) => `${item.name} ×${item.qty}`).join(", ")}
            </p>
            <p className="flex items-center gap-1.5">
              <Wallet className="size-3.5 shrink-0" />
              Placed {order.placedAt} · {order.distanceKm} km away
            </p>
            {order.specialInstructions ? (
              <p className="rounded-xl bg-card px-2.5 py-2 text-foreground">
                “{order.specialInstructions}”
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <OrderActionBar
          order={order}
          size="compact"
          onAction={(actionId) => onAction(order, actionId)}
          busyAction={busyAction ?? null}
        />
        <Link
          to={partnerRoutes.orderDetails}
          params={{ orderId: order.id }}
          className="ripple flex shrink-0 items-center justify-center rounded-2xl border border-border bg-card px-4 py-2.5 text-xs font-bold tracking-tight text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.97]"
        >
          Details
        </Link>
      </div>
    </article>
  );
}
