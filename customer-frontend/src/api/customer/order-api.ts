/**
 * QuickPress Order Success & Live Tracking — customer data layer.
 *
 * Every function is one backend endpoint, called through the shared transport:
 *
 *   GET  /api/orders/{id}
 *   GET  /api/orders/{id}/tracking
 *   POST /api/orders/{id}/cancel
 *
 * The view models below are unchanged, so no screen needed edits.
 */

import store1 from "@/shared/assets/store-1.jpg";
import type { Order } from "@/shared/types";

import {
  CUSTOMER_STAGES,
  customerStageIndex,
  formatOrderDate,
  formatOrderTime,
  timeOfStatus,
} from "../mock/mappers";
import { apiGetJson, apiPostJson } from "../core/transport";

export const ORDER_API_ENDPOINTS = {
  order: "/api/orders/{id}",
  tracking: "/api/orders/{id}/tracking",
  cancel: "/api/orders/{id}/cancel",
} as const;

export type OrderStage =
  | "confirmed"
  | "rider-assigned"
  | "picked-up"
  | "in-cleaning"
  | "quality-check"
  | "out-for-delivery"
  | "delivered";

export type OrderItemLine = {
  id: string;
  name: string;
  qty: number;
  price: number;
};

export type OrderSummary = {
  id: string;
  placedAt: string;
  storeName: string;
  storeImage: string;
  storePhone: string;
  address: { label: string; line: string; city: string; phone: string };
  pickup: { date: string; slot: string; express: boolean };
  delivery: { date: string; slot: string };
  payment: { label: string; note: string; paid: boolean };
  items: OrderItemLine[];
  totals: {
    itemsTotal: number;
    pickup: number;
    delivery: number;
    handling: number;
    gst: number;
    discount: number;
    grandTotal: number;
  };
};

export type TrackingStep = {
  id: OrderStage;
  label: string;
  description: string;
  time: string;
};

export type Rider = {
  name: string;
  vehicle: string;
  plate: string;
  rating: number;
  trips: string;
  phone: string;
};

export type TrackingData = {
  orderId: string;
  stageIndex: number;
  etaLabel: string;
  etaMinutes: number;
  steps: TrackingStep[];
  rider: Rider;
  storeName: string;
  storeImage: string;
  address: string;
  liveNote: string;
};

const STEP_COPY: Record<
  OrderStage,
  { label: string; description: string; pending: string }
> = {
  confirmed: {
    label: "Order confirmed",
    description: "Your laundry partner accepted your order",
    pending: "Awaiting store confirmation",
  },
  "rider-assigned": {
    label: "Rider assigned",
    description: "A QuickPress rider is on the way for pickup",
    pending: "Assigning a rider",
  },
  "picked-up": {
    label: "Clothes picked up",
    description: "Items counted and tagged at your door",
    pending: "Pickup pending",
  },
  "in-cleaning": {
    label: "In cleaning",
    description: "Wash, dry clean and steam press in progress",
    pending: "Cleaning not started",
  },
  "quality-check": {
    label: "Quality check",
    description: "Fabric inspection and premium packaging",
    pending: "Pending quality check",
  },
  "out-for-delivery": {
    label: "Out for delivery",
    description: "Rider heading back to your address",
    pending: "Delivery not started",
  },
  delivered: {
    label: "Delivered",
    description: "Fresh, folded and delivered to your door",
    pending: "Expected soon",
  },
};

const STAGE_STATUS: Record<OrderStage, Parameters<typeof timeOfStatus>[1]> = {
  confirmed: "partner_accepted",
  "rider-assigned": "rider_assigned",
  "picked-up": "picked_up",
  "in-cleaning": "processing",
  "quality-check": "completed",
  "out-for-delivery": "out_for_delivery",
  delivered: "delivered",
};

const ETA_COPY: Record<number, { label: string; minutes: number; note: string }> = {
  0: { label: "Store confirming in", minutes: 5, note: "Your order is with the store for confirmation." },
  1: { label: "Rider arriving in", minutes: 12, note: "Your rider is on the way to collect your laundry." },
  2: { label: "Reaching the store in", minutes: 18, note: "Your clothes are with the rider, heading to the store." },
  3: { label: "Cleaning finishes in", minutes: 180, note: "Your laundry is being washed and pressed." },
  4: { label: "Packing done in", minutes: 45, note: "Quality check and premium packaging in progress." },
  5: { label: "Delivery arriving in", minutes: 20, note: "Your fresh laundry is out for delivery." },
  6: { label: "Delivered", minutes: 0, note: "Delivered. Thanks for choosing QuickPress!" },
};

function toSummary(order: Order): OrderSummary {
  return {
    id: order.id,
    placedAt: `${formatOrderDate(order.createdAt)}, ${formatOrderTime(order.createdAt)}`,
    storeName: order.partner.name,
    storeImage: order.partner.image ?? store1,
    storePhone: order.partner.phone,
    address: order.address,
    pickup: order.pickup,
    delivery: order.delivery,
    payment: {
      label: order.payment.label,
      note: order.payment.note,
      paid: order.payment.paid,
    },
    items: order.items,
    totals: order.totals,
  };
}

export function toTracking(order: Order): TrackingData {
  const stageIndex = TIMELINE_INDEX_BY_STATUS[order?.status] ?? 0;
  const eta = ETA_COPY[stageIndex] ?? ETA_COPY[0]!;
  const partnerName = order?.partner?.name || (order as any)?.storeName || "QuickPress Partner";
  const partnerImage =
    order?.partner?.image && order.partner.image !== "store-1" && !order.partner.image.includes("store-1")
      ? order.partner.image
      : store1;
  const addressLine = order?.address ? `${order.address.line || ""}, ${order.address.city || ""}` : "Doorstep Delivery";

  return {
    orderId: String(order?.code || order?.id || ""),
    stageIndex,
    etaLabel: eta.label,
    etaMinutes: eta.minutes,
    storeName: partnerName,
    storeImage: partnerImage,
    address: addressLine,
    liveNote: order?.status === "cancelled" ? "This order was cancelled." : eta.note,
    rider: {
      name: order?.rider?.name ?? "Assigning rider",
      vehicle: order?.rider?.vehicle ?? "—",
      plate: order?.rider?.plate ?? "—",
      rating: Number(order?.rider?.rating || 0),
      trips: String(order?.rider?.trips || "—"),
      phone: String(order?.rider?.phone || "—"),
    },
    steps: ORDER_TIMELINE.map((stage, index) => {
      const copy = TIMELINE_COPY[stage] || { label: stage, description: "", pending: "" };
      const time = timeOfStatus(order, copy.status);
      return {
        id: stage,
        label: copy.label,
        description: index <= stageIndex ? copy.description : copy.pending,
        time: time === "—" ? copy.pending : time,
      };
    }),
  };
}

/** GET /api/orders/{id} */
export async function fetchOrder(orderId: string): Promise<OrderSummary> {
  return toSummary(await apiGetJson<Order>(`/api/orders/${orderId}`));
}

/** GET /api/orders/{id}/tracking */
export async function fetchTracking(orderId: string): Promise<TrackingData> {
  return toTracking(await apiGetJson<Order>(`/api/orders/${orderId}/tracking`));
}

/** GET /api/orders — the signed-in customer's orders, newest first. */
export async function fetchMyOrders(): Promise<OrderSummary[]> {
  const orders = await apiGetJson<Order[]>("/api/orders");
  return orders.map(toSummary);
}

/** POST /api/orders/{id}/cancel */
export async function cancelOrder(orderId: string, reason = ""): Promise<{ ok: true }> {
  await apiPostJson<Order>(`/api/orders/${orderId}/cancel`, { reason });
  return { ok: true };
}

/* ====================================================================== *
 * Sprint 2.5 — Order Tracking & Order History
 *
 *   GET  /api/orders                     active + past orders
 *   GET  /api/orders/{id}                full order detail
 *   POST /api/orders/{id}/cancel         cancel before pickup
 *
 * Everything below is additive: the Sprint 2.4 exports above are untouched so
 * Order Success keeps rendering exactly as before.
 * ====================================================================== */

import { ORDER_STATUS_LABEL } from "@/shared/types/order";
import type { OrderLifecycleStatus } from "@/shared/types";


import { readScopedCache, readStaleScopedCache, writeScopedCache } from "./api/cache";
import { formatOrderDate as fmtDate, formatOrderTime as fmtTime } from "../mock/mappers";

export const ORDER_TRACKING_ENDPOINTS = {
  orders: "/api/orders",
  order: "/api/orders/{id}",
  cancel: "/api/orders/{id}/cancel",
} as const;

/** The eight customer facing tracking stages, in progression order. */
export type OrderTimelineStage =
  | "pending"
  | "accepted"
  | "picked-up"
  | "processing"
  | "ironing"
  | "ready"
  | "delivered";

export const ORDER_TIMELINE: OrderTimelineStage[] = [
  "pending",
  "accepted",
  "picked-up",
  "processing",
  "ironing",
  "ready",
  "delivered",
];

const TIMELINE_COPY: Record<
  OrderTimelineStage,
  { label: string; description: string; pending: string; status: OrderLifecycleStatus }
> = {
  pending: {
    label: "Pending",
    description: "Order placed, waiting for the store to accept",
    pending: "Awaiting confirmation",
    status: "placed",
  },
  accepted: {
    label: "Accepted",
    description: "Your laundry partner accepted the order",
    pending: "Not accepted yet",
    status: "partner_accepted",
  },
  "picked-up": {
    label: "Picked Up",
    description: "Items counted, tagged and collected by rider",
    pending: "Pending pickup",
    status: "picked_up",
  },
  processing: {
    label: "Processing",
    description: "Washing and specialized cleaning in progress",
    pending: "Cleaning not started",
    status: "processing",
  },
  ironing: {
    label: "Ironing",
    description: "Steam press, ironing and wrinkle-free finishing",
    pending: "Ironing pending",
    status: "processing",
  },
  ready: {
    label: "Ready",
    description: "Quality checked, packed and ready for delivery",
    pending: "Pending quality check & packing",
    status: "completed",
  },
  delivered: {
    label: "Delivered",
    description: "Fresh, folded and delivered to your doorstep",
    pending: "Delivery pending",
    status: "delivered",
  },
};

const TIMELINE_INDEX_BY_STATUS: Record<OrderLifecycleStatus, number> = {
  placed: 0,
  partner_accepted: 1,
  rider_assigned: 1,
  picked_up: 2,
  at_partner: 2,
  processing: 3,
  completed: 5,
  out_for_delivery: 5,
  delivered: 6,
  cancelled: 0,
};

/** Customers can only cancel until the rider has collected the laundry. */
export function isCancellable(status: OrderLifecycleStatus): boolean {
  return status === "placed" || status === "partner_accepted" || status === "rider_assigned";
}

export const CANCEL_REASONS = [
  "Booked by mistake",
  "Pickup is taking too long",
  "I want to change the pickup slot",
  "I want to change items or service",
  "Found a better option",
  "Other",
] as const;

export type OrderTimelineStep = {
  id: OrderTimelineStage;
  label: string;
  description: string;
  time: string;
  state: "done" | "active" | "pending";
};

export type OrderRider = {
  assigned: boolean;
  name: string;
  vehicle: string;
  plate: string;
  phone: string;
  rating: number;
  trips: string;
};

export type OrderDetail = {
  id: string;
  /** Human readable order number, e.g. QP1041. */
  code: string;
  status: OrderLifecycleStatus;
  statusLabel: string;
  placedAt: string;
  partner: { id: string; name: string; image: string; phone: string; city: string };
  rider: OrderRider;
  pickup: { date: string; slot: string; express: boolean };
  delivery: { date: string; slot: string };
  deliveryEstimate: string;
  address: { label: string; line: string; city: string; phone: string };
  items: OrderItemLine[];
  totals: OrderSummary["totals"];
  payment: { label: string; note: string; paid: boolean; mode: string };
  timeline: OrderTimelineStep[];
  stageIndex: number;
  cancellable: boolean;
  cancelled: boolean;
  cancelledReason: string | null;
  /** Invoices arrive in a later sprint — the screen shows a placeholder. */
  invoice: { available: boolean; label: string };
  otp?: {
    pickup?: string;
    delivery?: string;
  };
};

export function toOrderDetail(order: Order): OrderDetail {
  const stageIndex = TIMELINE_INDEX_BY_STATUS[order?.status] ?? 0;
  const cancelled = order?.status === "cancelled";
  const rider = order?.rider ?? null;
  const partner = order?.partner ?? (order as any)?.store ?? {};
  const address = order?.address ?? { label: "Home", line: "Doorstep Delivery", city: "", phone: "" };
  const pickup = order?.pickup ?? { date: "Today", slot: "Morning", express: false };
  const delivery = order?.delivery ?? { date: "Tomorrow", slot: "Evening" };
  const payment = order?.payment ?? { label: "Payment", note: "", paid: false, mode: "cod" };
  const totals = order?.totals ?? { count: 0, itemsTotal: 0, pickup: 0, delivery: 0, handling: 0, gst: 0, discount: 0, couponDiscount: 0, grandTotal: 0 };

  return {
    id: String(order?.id || ""),
    code: String(order?.code || order?.id || ""),
    status: order?.status || "pending",
    statusLabel: ORDER_STATUS_LABEL[order?.status] ?? "Order placed",
    placedAt: order?.createdAt ? `${fmtDate(order.createdAt)}, ${fmtTime(order.createdAt)}` : "Recently",
    partner: {
      id: String(partner.id || (order as any)?.partnerId || ""),
      name: partner.name || "QuickPress Partner",
      image:
        partner.image && partner.image !== "store-1" && !partner.image.includes("store-1")
          ? partner.image
          : store1,
      phone: partner.phone ?? "",
      city: partner.city ?? "",
    },
    rider: {
      assigned: Boolean(rider),
      name: rider?.name ?? "Rider not assigned yet",
      vehicle: rider?.vehicle ?? "Assigning",
      plate: rider?.plate ?? "—",
      phone: rider?.phone ?? "",
      rating: Number(rider?.rating || 0),
      trips: rider?.trips ?? "—",
    },
    pickup,
    delivery,
    deliveryEstimate: delivery?.date ? `${delivery.date} · ${delivery.slot || ""}` : "Scheduled",
    address,
    items: Array.isArray(order?.items) ? order.items : [],
    totals,
    payment: {
      label: payment.label || "Payment",
      note: payment.note || "",
      paid: Boolean(payment.paid),
      mode: payment.mode || "cod",
    },
    stageIndex,
    cancelled,
    cancellable: isCancellable(order?.status),
    cancelledReason: order?.cancelledReason ?? null,
    invoice: { available: false, label: "Invoice will be available after delivery" },
    otp: (order as any)?.otp ?? (order as any)?.verificationOtp ?? undefined,
    timeline: ORDER_TIMELINE.map((stage, index) => {
      const copy = TIMELINE_COPY[stage];
      const time = timeOfStatus(order, copy.status);
      const state: OrderTimelineStep["state"] = cancelled
        ? index <= stageIndex
          ? "done"
          : "pending"
        : index < stageIndex
          ? "done"
          : index === stageIndex
            ? "active"
            : "pending";
      return {
        id: stage,
        label: copy.label,
        description: state === "pending" ? copy.pending : copy.description,
        time: time === "\u2014" ? (state === "pending" ? copy.pending : "Just now") : time,
        state,
      };
    }),
  };
}

/** GET /api/orders/{id} — full order detail, cache-first. */
export async function fetchOrderDetail(
  orderId: string,
  options: { signal?: AbortSignal | undefined; forceRefresh?: boolean } = {},
): Promise<OrderDetail> {
  if (!options.forceRefresh) {
    const cached = readScopedCache<OrderDetail>("order-detail", orderId);
    if (cached) return cached;
  }
  try {
    const detail = toOrderDetail(
      await apiGetJson<Order>(`/api/orders/${orderId}`, { signal: options.signal }),
    );
    writeScopedCache("order-detail", orderId, detail);
    return detail;
  } catch (error) {
    const stale = readStaleScopedCache<OrderDetail>("order-detail", orderId);
    if (stale) return stale;
    throw error;
  }
}

/** GET /api/orders — active orders (anything not delivered or cancelled). */
export async function fetchActiveOrders(
  options: { signal?: AbortSignal | undefined } = {},
): Promise<OrderDetail[]> {
  const orders = await apiGetJson<Order[]>("/api/orders", { signal: options.signal });
  return orders
    .filter((order) => order.status !== "delivered" && order.status !== "cancelled")
    .map(toOrderDetail);
}

/** POST /api/orders/{id}/cancel — returns the refreshed order. */
export async function cancelOrderWithReason(
  orderId: string,
  reason: string,
): Promise<OrderDetail> {
  const order = await apiPostJson<Order>(`/api/orders/${orderId}/cancel`, { reason });
  const detail = toOrderDetail(order);
  writeScopedCache("order-detail", orderId, detail);
  return detail;
}
