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
  | "Picked up"
  | "In wash"
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
};

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/** Lifecycle status → the label this console has always displayed. */
const STATUS_LABEL: Record<string, OrderStatus> = {
  placed: "Pending",
  partner_accepted: "Pending",
  rider_assigned: "Pending",
  picked_up: "Picked up",
  at_partner: "Picked up",
  processing: "In wash",
  completed: "In wash",
  out_for_delivery: "Out for delivery",
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
};

/** GET /api/admin/orders/{id} */
export async function fetchOrder(id: string): Promise<OrderDetail> {
  const order = await apiGetJson<Order>(`/api/admin/orders/${id}`);
  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

  const stages: { label: string; status: keyof typeof ORDER_STATUS_LABEL }[] = [
    { label: "Order placed", status: "placed" },
    { label: "Partner accepted", status: "partner_accepted" },
    { label: "Rider assigned", status: "rider_assigned" },
    { label: "Picked up", status: "picked_up" },
    { label: "In wash", status: "processing" },
    { label: "Laundry completed", status: "completed" },
    { label: "Out for delivery", status: "out_for_delivery" },
    { label: "Delivered", status: "delivered" },
  ];

  return {
    ...toAdminOrder({
      id: order.id,
      code: order.code,
      customer: order.customer.name,
      partner: order.partner.name,
      rider: order.rider?.name ?? "Unassigned",
      status: order.status,
      statusLabel: ORDER_STATUS_LABEL[order.status],
      amount: order.totals.grandTotal,
      placedOn: new Date(order.createdAt).toLocaleDateString("en-CA"),
      city: order.partner.city,
      paymentMode: order.payment.mode,
    }),
    phone: order.customer.phone,
    service: order.serviceLabel,
    address: `${order.address.line}, ${order.address.city}`,
    slot: `${order.pickup.date} · ${order.pickup.slot}`,
    items: order.items.map((item) => ({
      name: item.name,
      qty: item.qty,
      price: money(item.qty * item.price),
    })),
    timeline: stages.map((stage) => {
      const event = order.events.find((item) => item.status === stage.status);
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
/** POST /api/admin/orders/{id}/cancel — the only status admins can force. */
export async function changeOrderStatus(orderId: string, status: OrderStatus) {
  if (status === "Cancelled") {
    await apiPostJson(`/api/admin/orders/${orderId}/cancel`, { reason: "Cancelled by admin" });
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