/**
 * GET/POST /api/admin/orders/* — live orders from the shared QuickPress backend.
 *
 * Row shapes are unchanged; only the data source moved from local fixtures to
 * the shared API layer, so every admin order screen renders the same lifecycle
 * the customer, partner and rider apps are driving.
 */
import type { Order } from "@/shared/types";
import { ORDER_STATUS_LABEL } from "@/shared/types/order";
import { apiGetJson, apiPostJson } from "@/api/core/transport";

export type OrderStatus =
  | "Pending"
  | "Accepted"
  | "Pickup Assigned"
  | "Picked up"
  | "Processing"
  | "Ready for delivery"
  | "Delivery Assigned"
  | "Out for delivery"
  | "Delivered"
  | "Cancelled";

export type AdminOrder = {
  id: string;
  customer: string;
  phone: string;
  service: string;
  city: string;
  partner: string;
  rider: string;
  status: OrderStatus;
  payment: "Paid" | "COD" | "Refunded";
  placedAt: string;
  total: string;
  cancellationReason?: string;
  cancelledBy?: string;
  slaBreached?: boolean | string;
  autoCancelled?: boolean;
  refundStatus?: string;
  refundAmount?: number;
  refundDate?: string;
  isReassigned?: boolean;
  reassignment?: any;
  custody?: string;
};

type AdminOrderRow = {
  id: string;
  code: string;
  customer: string;
  partner: string;
  rider: string;
  status: keyof typeof ORDER_STATUS_LABEL;
  statusLabel: string;
  amount: number;
  placedOn: string;
  city: string;
  paymentMode: "online" | "cod";
  cancellationReason?: string;
  cancelledBy?: string;
  slaBreached?: boolean | string;
  autoCancelled?: boolean;
  refundStatus?: string;
  refundAmount?: number;
  refundDate?: string;
  isReassigned?: boolean;
  reassignment?: any;
  custody?: string;
};

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/** Lifecycle status → the label this console displays. */
const STATUS_LABEL: Record<string, OrderStatus> = {
  placed: "Pending",
  pending_partner_acceptance: "Pending",
  partner_accepted: "Accepted",
  rider_searching: "Accepted",
  pickup_rider_assigned: "Pickup Assigned",
  rider_assigned: "Pickup Assigned",
  pickup_rider_accepted: "Pickup Assigned",
  rider_accepted: "Pickup Assigned",
  pickup_otp_pending: "Pickup Assigned",
  picked_up: "Picked up",
  at_partner: "Picked up",
  processing: "Processing",
  washing: "Processing",
  dry_cleaning: "Processing",
  ironing: "Processing",
  ready_for_delivery: "Ready for delivery",
  ready: "Ready for delivery",
  completed: "Ready for delivery",
  delivery_rider_assigned: "Delivery Assigned",
  delivery_rider_accepted: "Delivery Assigned",
  dispatch_otp_pending: "Delivery Assigned",
  out_for_delivery: "Out for delivery",
  delivery_otp_pending: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function toAdminOrder(row: AdminOrderRow): AdminOrder {
  return {
    id: row.code,
    customer: row.customer,
    phone: "",
    service: row.statusLabel,
    city: row.city,
    partner: row.partner,
    rider: row.rider,
    status: STATUS_LABEL[row.status] ?? "Pending",
    payment: row.status === "cancelled" ? "Refunded" : row.paymentMode === "cod" ? "COD" : "Paid",
    placedAt: row.placedOn,
    total: money(row.amount),
    cancellationReason: row.cancellationReason,
    cancelledBy: row.cancelledBy,
    slaBreached: row.slaBreached,
    autoCancelled: row.autoCancelled,
    refundStatus: row.refundStatus,
    refundAmount: row.refundAmount,
    refundDate: row.refundDate,
    isReassigned: row.isReassigned,
    reassignment: row.reassignment,
    custody: row.custody,
  };
}

/** GET /api/admin/orders */
export async function fetchOrders(): Promise<AdminOrder[]> {
  const rows = await apiGetJson<AdminOrderRow[]>("/api/admin/orders");
  return rows.map(toAdminOrder);
}

export type OrderDetail = AdminOrder & {
  items: { name: string; qty: number; price: string }[];
  timeline: { label: string; at: string; done: boolean }[];
  address: string;
  slot: string;
  reassignment?: {
    requested?: boolean;
    requestedAt?: string;
    originalRiderId?: string;
    reason?: string;
    remarks?: string;
    custody?: string;
    dispatchOtp?: string;
    handoverOtp?: string;
    pickupLegPayout?: number;
    deliveryLegPayout?: number;
    handoverCompleted?: boolean;
    assignedTransferRiderId?: string;
    storeLocation?: {
      name?: string;
      address?: string;
      lat?: number;
      lng?: number;
    };
  } | null;
  rides?: any[];
  settlement?: any;
  custody?: string;
  rider1?: {
    id: string;
    name: string;
    phone: string;
    vehicle: string;
    plate?: string;
    payout?: number;
  } | null;
  rider2?: {
    id: string;
    name: string;
    phone: string;
    vehicle: string;
    plate?: string;
    payout?: number;
  } | null;
  dispatchOtp?: string;
  pickupOtp?: string;
  deliveryOtp?: string;
  isReassigned?: boolean;
};

/** GET /api/admin/orders/{id} */
export async function fetchOrder(id: string): Promise<OrderDetail> {
  const order = await apiGetJson<any>(`/api/admin/orders/${id}`);
  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

  const stages: { label: string; status: keyof typeof ORDER_STATUS_LABEL }[] = [
    { label: "Order placed", status: "placed" },
    { label: "Partner accepted", status: "partner_accepted" },
    { label: "Rider assigned", status: "rider_assigned" },
    { label: "Picked up", status: "picked_up" },
    { label: "In Processing", status: "processing" },
    { label: "Processing completed", status: "completed" },
    { label: "Out for delivery", status: "out_for_delivery" },
    { label: "Delivered", status: "delivered" },
  ];

  const cancReason =
    order.cancellationReason ||
    order.cancelledReason ||
    order.refundReason ||
    order.meta?.reason ||
    "";

  return {
    ...toAdminOrder({
      id: order.id || order._id,
      code: order.code,
      customer: order.customer?.name || order.customerName || "Customer",
      partner: order.partner?.name || "QuickPress Partner",
      rider: order.rider?.name ?? "Unassigned",
      status: order.status,
      statusLabel: ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] ?? order.status,
      amount: order.totals?.grandTotal || order.pricing?.total || 0,
      placedOn: new Date(order.createdAt || Date.now()).toLocaleDateString("en-CA"),
      city: order.partner?.city || order.address?.city || "Kasganj",
      paymentMode: order.payment?.mode || order.payment?.method || "online",
      cancellationReason: cancReason,
      cancelledBy: order.cancelledBy,
      slaBreached: order.slaBreached,
      autoCancelled: order.autoCancelled,
      refundStatus: order.payment?.refundStatus || order.paymentStatus,
      refundAmount: order.refundAmount,
      refundDate: order.refundDate,
      isReassigned: Boolean(order.reassignment || order.isReassigned),
      reassignment: order.reassignment,
      custody: order.custody,
    }),
    phone: order.customer?.phone || order.customerPhone || "",
    service: order.serviceLabel || "Laundry Service",
    address: `${order.address?.line || order.address?.street || ""}, ${order.address?.city || ""}`,
    slot: `${order.pickup?.date || "Today"} · ${order.pickup?.slot || order.slot || ""}`,
    cancellationReason: cancReason,
    cancelledBy: order.cancelledBy,
    slaBreached: order.slaBreached,
    autoCancelled: order.autoCancelled,
    refundStatus: order.payment?.refundStatus || order.paymentStatus,
    refundAmount: order.refundAmount,
    refundDate: order.refundDate,
    reassignment: order.reassignment || null,
    rides: order.rides || [],
    settlement: order.settlement || null,
    custody: order.custody || "customer",
    rider1: order.rider1 || null,
    rider2: order.rider2 || null,
    dispatchOtp:
      order.dispatchOtp ||
      (typeof order.otp?.dispatch === "object" ? order.otp?.dispatch?.code : order.otp?.dispatch) ||
      order.reassignment?.dispatchOtp ||
      "",
    pickupOtp:
      order.pickupOtp ||
      (typeof order.otp?.pickup === "object" ? order.otp?.pickup?.code : order.otp?.pickup) ||
      "",
    deliveryOtp:
      order.deliveryOtp ||
      (typeof order.otp?.delivery === "object" ? order.otp?.delivery?.code : order.otp?.delivery) ||
      "",
    isReassigned: Boolean(order.reassignment || order.isReassigned),
    items: (order.items || []).map((item: any) => ({
      name: item.name,
      qty: item.qty || item.quantity || 1,
      price: money((item.qty || item.quantity || 1) * (item.price || 0)),
    })),
    timeline: stages.map((stage) => {
      const event = (order.events || []).find((item: any) => item.status === stage.status);
      return { label: stage.label, at: event ? time(event.at) : "—", done: Boolean(event) };
    }),
  };
}

/** No assign-partner endpoint exists on the backend; orders are auto-matched to a partner. */
export async function assignPartner(): Promise<never> {
  throw new Error("Assigning a partner manually is not supported by the backend yet.");
}
/** POST /api/admin/orders/{id}/assign-rider */
export async function assignRider(orderId: string, riderId: string) {
  await apiPostJson(`/api/admin/orders/${orderId}/assign-rider`, { riderId });
  return { ok: true as const, orderId, riderId };
}
/** POST /api/admin/orders/{id}/status or /api/admin/orders/{id}/cancel */
export async function changeOrderStatus(orderId: string, status: string, reason?: string) {
  if (status === "Cancelled" || status === "cancelled") {
    await apiPostJson(`/api/admin/orders/${orderId}/cancel`, { reason: reason || "Cancelled by admin" });
  } else {
    await apiPostJson(`/api/admin/orders/${orderId}/status`, { status, reason: reason || `Updated to ${status} by admin` });
  }
  return { ok: true as const, orderId, status };
}

/** No invoice-generation endpoint exists on the backend yet. */
export async function downloadInvoice(): Promise<never> {
  throw new Error("Invoice generation is not available yet.");
}
/** No admin order-refund endpoint exists on the backend yet. */
export async function refundOrder(): Promise<never> {
  throw new Error("Refunding an order from here is not available yet.");
}