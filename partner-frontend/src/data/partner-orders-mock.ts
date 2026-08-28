/**
 * Sprint 3.3 — UI-only mock data for the Partner Order Management module.
 *
 * Nothing here touches a backend. Every export below is a future API
 * integration point (see PARTNER_SPRINT_3_3_ORDER_MANAGEMENT_REPORT.md).
 *
 * NOTE: no `Date.now()` / `new Date()` at module scope — SSR and the client
 * must render identical markup, so relative times are stored as plain labels
 * plus a numeric `placedMinutesAgo` used for sorting.
 */

export type OrderStage =
  | "new"
  | "accepted"
  | "pickup_pending"
  | "washing"
  | "dry_cleaning"
  | "ironing"
  | "ready"
  | "completed"
  | "cancelled";

export type PaymentStatus = "paid" | "pending" | "refunded";
export type PaymentMode = "cod" | "online";
export type OrderDay = "today" | "tomorrow" | "past";

export type ManagedOrderItem = {
  id: string;
  name: string;
  service: string;
  qty: number;
  price: number;
};

export type OrderTimelineEntry = {
  id: string;
  label: string;
  time: string;
  note?: string;
};

export type ManagedOrder = {
  id: string;
  code: string;
  stage: OrderStage;
  customerName: string;
  customerRating: number;
  customerPhone: string;
  customerOrders: number;
  pickupAddress: string;
  deliveryAddress: string;
  pickupTime: string;
  pickupDay: OrderDay;
  deliveryEta: string;
  distanceKm: number;
  services: string[];
  itemCount: number;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
  placedAt: string;
  placedMinutesAgo: number;
  specialInstructions: string;
  items: ManagedOrderItem[];
  charges: {
    subtotal: number;
    pickupFee: number;
    taxes: number;
    discount: number;
    total: number;
  };
  timeline: OrderTimelineEntry[];
  invoiceNo: string | null;
  cancelReason: string | null;
  assignedRider: string | null;
};

/* ------------------------------------------------------------------ */
/* Stage metadata                                                      */
/* ------------------------------------------------------------------ */

export const ORDER_TABS: { id: OrderStage; label: string; short: string }[] = [
  { id: "new", label: "New Orders", short: "New" },
  { id: "accepted", label: "Accepted", short: "Accepted" },
  { id: "pickup_pending", label: "Pickup Pending", short: "Pickup" },
  { id: "washing", label: "Washing", short: "Washing" },
  { id: "dry_cleaning", label: "Dry Cleaning", short: "Dry Clean" },
  { id: "ironing", label: "Ironing", short: "Ironing" },
  { id: "ready", label: "Ready for Delivery", short: "Ready" },
  { id: "completed", label: "Completed", short: "Done" },
  { id: "cancelled", label: "Cancelled", short: "Cancelled" },
];

export const STAGE_LABEL: Record<OrderStage, string> = {
  new: "New",
  accepted: "Accepted",
  pickup_pending: "Pickup Pending",
  washing: "Washing",
  dry_cleaning: "Dry Cleaning",
  ironing: "Ironing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STAGE_TONE: Record<OrderStage, string> = {
  new: "bg-primary/15 text-brand-dark",
  accepted: "bg-primary/15 text-brand-dark",
  pickup_pending: "bg-primary/10 text-brand-dark",
  washing: "bg-secondary/10 text-brand-green",
  dry_cleaning: "bg-secondary/10 text-brand-green",
  ironing: "bg-secondary/10 text-brand-green",
  ready: "bg-secondary/15 text-brand-green-dark",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

/** Vertical status timeline shown on the order details screen. */
export const TIMELINE_STEPS = [
  { key: "pending", label: "Order Placed" },
  { key: "accepted", label: "Accepted" },
  { key: "pickup_pending", label: "Waiting for Pickup" },
  { key: "picked", label: "Pickup Completed" },
  { key: "processing", label: "Processing" },
  { key: "ready", label: "Ready for Delivery" },
  { key: "delivery_assigned", label: "Delivery Rider Assigned" },
  { key: "dispatch", label: "Dispatch / Handover" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

/** How far down the timeline a given stage sits. */
export const STAGE_TIMELINE_INDEX: Record<string, number> = {
  new: 0,
  placed: 0,
  accepted: 1,
  pickup_rider_assigned: 2,
  pickup_rider_accepted: 2,
  pickup_pending: 2,
  picked: 3,
  picked_up: 3,
  at_partner: 3,
  processing: 4,
  washing: 4,
  dry_cleaning: 4,
  ironing: 4,
  ready: 5,
  ready_for_delivery: 5,
  delivery_rider_assigned: 6,
  delivery_rider_accepted: 7,
  dispatch_otp_pending: 7,
  out_for_delivery: 8,
  delivery_otp_pending: 8,
  completed: 9,
  delivered: 9,
  cancelled: 0,
};

export const HIGH_VALUE_THRESHOLD = 1500;

export const managedOrders: ManagedOrder[] = [];

