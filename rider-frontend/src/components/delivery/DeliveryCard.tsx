import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  Clock3,
  Flame,
  IndianRupee,
  MapPin,
  Navigation,
  Route as RouteIcon,
  Timer,
  Wallet,
} from "lucide-react";
import { useState } from "react";

import {
  DELIVERY_STATUS_LABEL,
  DELIVERY_STATUS_TONE,
  type DeliveryOrder,
} from "../../data/rider-delivery-mock";
import { riderRoutes } from "../../navigation/rider-routes";
import { DeliveryActionBar } from "./DeliveryActionBar";

function MetaChip({
  icon: Icon,
  label,
}: {
  icon: typeof Clock3;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[0.66rem] font-bold text-muted-foreground">
      <Icon className="size-3.5 shrink-0" />
      {label}
    </span>
  );
}

export function DeliveryCard({
  delivery,
  onAdvance,
  onReject,
  onViewReason,
  className = "",
}: {
  delivery: DeliveryOrder;
  onAdvance: (delivery: DeliveryOrder) => void;
  onReject: (delivery: DeliveryOrder) => void;
  onViewReason: (delivery: DeliveryOrder) => void;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className={`card-soft animate-rise border border-border p-4 transition-all duration-300 hover:border-primary/60 ${className}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.7rem] font-black tracking-widest text-muted-foreground">
              {delivery.orderId}
            </p>
            {delivery.priority === "high" ? (
              <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-destructive">
                <Flame className="size-3" />
                Priority
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate text-sm font-black tracking-tight text-foreground">
            {delivery.customerName}
          </p>
          <p className="truncate text-[0.7rem] font-medium text-muted-foreground">
            {delivery.partnerName}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider ${DELIVERY_STATUS_TONE[delivery.status]}`}
        >
          {DELIVERY_STATUS_LABEL[delivery.status]}
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-start gap-1.5 text-[0.7rem] font-medium text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-brand-dark" />
          <span className="min-w-0 flex-1 truncate">{delivery.pickupAddress}</span>
        </div>
        <div className="flex items-start gap-1.5 text-[0.7rem] font-medium text-muted-foreground">
          <Navigation className="mt-0.5 size-3.5 shrink-0 text-brand-green" />
          <span className="min-w-0 flex-1 truncate">{delivery.deliveryAddress}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <MetaChip icon={Timer} label={`Pickup ${delivery.pickupTime}`} />
        <MetaChip icon={Clock3} label={`ETA ${delivery.etaLabel}`} />
        <MetaChip icon={RouteIcon} label={`${delivery.distanceKm} km`} />
        <MetaChip icon={Wallet} label={delivery.paymentType} />
        {delivery.codAmount ? (
          <span className="flex items-center gap-0.5 rounded-full bg-secondary/10 px-2 py-1 text-[0.66rem] font-black text-brand-green">
            <IndianRupee className="size-3" />
            {delivery.codAmount} COD
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-1 text-[0.7rem] font-bold text-muted-foreground"
        >
          {expanded ? "Hide summary" : "Quick summary"}
          <ChevronDown
            className={`size-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
        <Link
          to={riderRoutes.deliveryDetails}
          params={{ deliveryId: delivery.id }}
          className="text-[0.7rem] font-black text-brand-dark underline-offset-4 hover:underline"
        >
          View details
        </Link>
      </div>

      {expanded ? (
        <div className="animate-expand mt-3 rounded-2xl bg-muted/60 p-3">
          <p className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
            Ordered services
          </p>
          <ul className="mt-2 space-y-1">
            {delivery.services.map((service) => (
              <li
                key={service.id}
                className="flex items-center justify-between text-[0.72rem] font-semibold text-foreground"
              >
                <span className="truncate">
                  {service.name} · {service.qty}
                </span>
                <span className="shrink-0 tabular-nums">₹{service.price}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[0.7rem] font-medium text-muted-foreground">
            {delivery.specialInstructions}
          </p>
        </div>
      ) : null}

      <DeliveryActionBar
        delivery={delivery}
        onAdvance={onAdvance}
        onReject={onReject}
        onViewReason={onViewReason}
        compact
      />
    </article>
  );
}
