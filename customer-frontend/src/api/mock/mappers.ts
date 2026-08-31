/**
 * Projections of the canonical `Order` into each app's view model.
 *
 * The real FastAPI backend is expected to return exactly these shapes from the
 * corresponding endpoints, which is why the mapping lives in the backend layer
 * and not inside a screen.
 */

import type {
  Order,
  OrderLifecycleStatus,
  PartnerOrder,
  PartnerOrderStatus,
  RiderOrder,
  RiderOrderStatus,
  RiderTaskType,
} from "@/shared/types";

/* ------------------------------ customer ------------------------------ */

export type CustomerOrderStage =
  | "confirmed"
  | "rider-assigned"
  | "picked-up"
  | "in-cleaning"
  | "quality-check"
  | "out-for-delivery"
  | "delivered";

export const CUSTOMER_STAGES: CustomerOrderStage[] = [
  "confirmed",
  "rider-assigned",
  "picked-up",
  "in-cleaning",
  "quality-check",
  "out-for-delivery",
  "delivered",
];

const CUSTOMER_STAGE_BY_STATUS: Record<OrderLifecycleStatus, CustomerOrderStage> = {
  placed: "confirmed",
  partner_accepted: "confirmed",
  rider_assigned: "rider-assigned",
  picked_up: "picked-up",
  at_partner: "picked-up",
  processing: "in-cleaning",
  completed: "quality-check",
  out_for_delivery: "out-for-delivery",
  delivered: "delivered",
  cancelled: "confirmed",
};

export function customerStage(order: Order): CustomerOrderStage {
  return CUSTOMER_STAGE_BY_STATUS[order.status];
}

export function customerStageIndex(order: Order): number {
  return CUSTOMER_STAGES.indexOf(customerStage(order));
}

function timeLabel(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function timeOfStatus(order: Order, status: OrderLifecycleStatus): string {
  if (!order || !Array.isArray(order.events)) return "—";
  const event = order.events.find((item) => item.status === status);
  return event ? timeLabel(event.at) : "—";
}

/* ------------------------------- partner ------------------------------ */

const PARTNER_STATUS_BY_STATUS: Record<OrderLifecycleStatus, PartnerOrderStatus> = {
  placed: "new",
  partner_accepted: "accepted",
  rider_assigned: "accepted",
  picked_up: "picked",
  at_partner: "picked",
  processing: "processing",
  completed: "ready",
  out_for_delivery: "ready",
  delivered: "delivered",
  cancelled: "cancelled",
};

export function toPartnerOrder(order: Order): PartnerOrder {
  const stages: { id: string; label: string; status: OrderLifecycleStatus }[] = [
    { id: "pending", label: "Pending", status: "placed" },
    { id: "accepted", label: "Accepted", status: "partner_accepted" },
    { id: "picked", label: "Picked Up", status: "picked_up" },
    { id: "processing", label: "Processing", status: "processing" },
    { id: "ironing", label: "Ironing", status: "processing" },
    { id: "ready", label: "Ready", status: "completed" },
    { id: "delivered", label: "Delivered", status: "delivered" },
  ];

  return {
    id: order.id,
    code: order.code,
    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    status: PARTNER_STATUS_BY_STATUS[order.status],
    placedAt: timeLabel(order.createdAt),
    slot: order.pickup.slot,
    address: `${order.address.line}, ${order.address.city}`,
    itemCount: order.items.reduce((sum, item) => sum + item.qty, 0),
    amount: order.totals.grandTotal,
    paymentMode: order.payment.mode,
    serviceLabel: order.serviceLabel,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      qty: item.qty,
      price: item.price,
    })),
    timeline: stages.map((stage) => {
      const events = Array.isArray(order?.events) ? order.events : [];
      const event = events.find((item) => item.status === stage.status);
      return {
        id: stage.id,
        label: stage.label,
        time: event ? timeLabel(event.at) : "—",
        done: Boolean(event),
      };
    }),
  };
}

/* -------------------------------- rider ------------------------------- */

const RIDER_STATUS_BY_STATUS: Partial<Record<OrderLifecycleStatus, RiderOrderStatus>> = {
  rider_assigned: "assigned",
  picked_up: "picked",
  at_partner: "at-partner",
  processing: "at-partner",
  completed: "ready-for-delivery",
  out_for_delivery: "picked",
  delivered: "delivered",
  cancelled: "cancelled",
};

export function riderTaskType(order: Order): RiderTaskType {
  return order.status === "completed" ||
    order.status === "out_for_delivery" ||
    order.status === "delivered"
    ? "delivery"
    : "pickup";
}

export function toRiderOrder(order: Order): RiderOrder {
  const stages: { id: string; label: string; status: OrderLifecycleStatus }[] = [
    { id: "assigned", label: "Assigned", status: "rider_assigned" },
    { id: "picked", label: "Picked up from customer", status: "picked_up" },
    { id: "at-partner", label: "Dropped at store", status: "at_partner" },
    { id: "ready", label: "Laundry completed", status: "completed" },
    { id: "out", label: "Out for delivery", status: "out_for_delivery" },
    { id: "delivered", label: "Delivered", status: "delivered" },
  ];

  const task = riderTaskType(order);
  const customerAddress = `${order.address?.line || ""}, ${order.address?.city || ""}`;
  const partnerAddress = `${order.partner?.name || ""}, ${order.partner?.city || ""}`;

  return {
    id: order.id,
    code: order.code,
    taskType: task,
    status: RIDER_STATUS_BY_STATUS[order.status] ?? "assigned",
    customerName: order.customer?.name || "Customer",
    customerPhone: order.customer?.phone || "",
    partnerName: order.partner?.name || "QuickPress Partner",
    partnerPhone: order.partner?.phone || "",
    pickupAddress: task === "pickup" ? customerAddress : partnerAddress,
    deliveryAddress: task === "pickup" ? partnerAddress : customerAddress,
    distanceKm: Number((2 + ((order.code || "").charCodeAt((order.code || "").length - 1 || 0) % 7) * 0.6).toFixed(1)),
    etaMinutes: 12 + ((order.code || "").charCodeAt((order.code || "").length - 1 || 0) % 5) * 4,
    estimatedEarning: 35 + Math.round((order.totals?.grandTotal || 0) * 0.05),
    itemCount: Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + item.qty, 0) : 0,
    slot: task === "pickup" ? (order.pickup?.slot || "") : (order.delivery?.slot || ""),
    placedAt: timeLabel(order.createdAt),
    paymentMode: order.payment?.mode || "cod",
    timeline: stages.map((stage) => {
      const events = Array.isArray(order?.events) ? order.events : [];
      const event = events.find((item) => item.status === stage.status);
      return {
        id: stage.id,
        label: stage.label,
        time: event ? timeLabel(event.at) : "—",
        done: Boolean(event),
      };
    }),
  };
}

/* -------------------------------- admin ------------------------------- */

export type AdminOrderRow = {
  id: string;
  code: string;
  customer: string;
  partner: string;
  rider: string;
  status: OrderLifecycleStatus;
  statusLabel: string;
  amount: number;
  placedOn: string;
  city: string;
  paymentMode: "online" | "cod";
};

export function toAdminOrderRow(order: Order, statusLabel: string): AdminOrderRow {
  return {
    id: order.id,
    code: order.code,
    customer: order.customer.name,
    partner: order.partner.name,
    rider: order.rider?.name ?? "Unassigned",
    status: order.status,
    statusLabel,
    amount: order.totals.grandTotal,
    placedOn: dateLabel(order.createdAt),
    city: order.partner.city,
    paymentMode: order.payment.mode,
  };
}

export { dateLabel as formatOrderDate, timeLabel as formatOrderTime };