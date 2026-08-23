import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, IndianRupee, MapPin, Navigation, Package } from "lucide-react";

import { riderRoutes } from "../navigation/rider-routes";
import type { RiderOrder, RiderOrderStatus } from "@/shared/types/rider";

export const STATUS_LABEL: Record<RiderOrderStatus, string> = {
  assigned: "New Request",
  accepted: "Accepted",
  arriving: "Arriving",
  picked: "Picked up",
  "at-partner": "At Partner Store",
  "ready-for-delivery": "Ready for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Failed",
};

export const STATUS_TONE: Record<RiderOrderStatus, string> = {
  assigned: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  accepted: "bg-blue-50 text-blue-700 border border-blue-200",
  arriving: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  picked: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "at-partner": "bg-purple-50 text-purple-700 border border-purple-200",
  "ready-for-delivery": "bg-cyan-50 text-cyan-700 border border-cyan-200",
  delivered: "bg-slate-100 text-slate-700 border border-slate-200",
  cancelled: "bg-rose-50 text-rose-700 border border-rose-200",
  failed: "bg-rose-50 text-rose-700 border border-rose-200",
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
    <article className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                order.taskType === "pickup"
                  ? "bg-slate-900 text-white"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {order.taskType || "pickup"}
            </span>
            <p className="truncate text-xs font-mono font-bold text-slate-500">
              {order.code}
            </p>
          </div>
          <p className="mt-1.5 truncate text-sm font-black tracking-tight text-slate-900">
            {order.customerName || "Customer"}
          </p>
          <p className="truncate text-[11px] font-semibold text-slate-500">
            {order.partnerName || "Laundry Hub"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            STATUS_TONE[order.status] || STATUS_TONE.assigned
          }`}
        >
          {STATUS_LABEL[order.status] || order.status}
        </span>
      </div>

      <div className="mt-3 space-y-1.5 rounded-xl bg-slate-50/80 p-2.5">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
          <MapPin className="size-3.5 shrink-0 text-slate-900" />
          <span className="truncate">{order.pickupAddress || "Pickup location"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
          <Navigation className="size-3.5 shrink-0 text-emerald-600" />
          <span className="truncate">{order.deliveryAddress || "Delivery location"}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
          <span>{order.distanceKm ?? 2.5} km</span>
          <span className="flex items-center gap-1">
            <Package className="size-3.5" />
            {order.itemCount ?? 1} items
          </span>
          <span className="flex items-center text-slate-900 font-extrabold text-sm">
            <IndianRupee className="size-3.5" strokeWidth={2.5} />
            {order.estimatedEarning ?? 45}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: riderRoutes.orderDetails, params: { orderId: order.id } })}
          className="flex items-center gap-1 text-xs font-extrabold text-emerald-600 transition-colors hover:text-emerald-700"
        >
          Details
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      {isNew && (onAccept || onReject) ? (
        <div className="mt-3 flex gap-2 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onReject?.(order)}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.97]"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => onAccept?.(order)}
            className="flex-[1.6] rounded-xl bg-slate-900 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.97]"
          >
            Accept · ₹{order.estimatedEarning ?? 45}
          </button>
        </div>
      ) : null}
    </article>
  );
}
