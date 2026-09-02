/**
 * Canonical Order view-model mappers & date formatting utilities.
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

export function formatOrderDate(isoDate: string): string {
  if (!isoDate) return "Today";
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return "Today";
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "Today";
  }
}

export function formatOrderTime(isoDate: string): string {
  if (!isoDate) return "Just now";
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return "Just now";
    return d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Just now";
  }
}

export function timeOfStatus(order: Order, status: OrderLifecycleStatus): string {
  if (!order || !Array.isArray(order.events)) return "—";
  const event = order.events.find((item) => item.status === status);
  return event ? formatOrderTime(event.at) : "—";
}
