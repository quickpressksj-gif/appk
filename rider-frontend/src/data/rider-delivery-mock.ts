/**
 * Realistic mock data for the Rider Delivery Order Management module.
 * UI-only sprint: no backend, no Socket.IO, no Google Maps.
 */

export type DeliveryStatus =
  | "new"
  | "accepted"
  | "reached-partner"
  | "picked-up"
  | "on-the-way"
  | "delivered"
  | "cancelled";

export type DeliveryPaymentType = "Cash on Delivery" | "Paid Online" | "UPI on Delivery";

export type DeliveryTimelineStep = {
  id: DeliveryStatus | "assigned";
  label: string;
  time: string | null;
  done: boolean;
};

export type OrderedService = {
  id: string;
  name: string;
  qty: number;
  price: number;
};

export type DeliveryOrder = {
  id: string;
  orderId: string;
  status: DeliveryStatus;
  customerName: string;
  customerPhone: string;
  customerNote?: string;
  partnerName: string;
  partnerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupTime: string;
  etaMinutes: number;
  etaLabel: string;
  distanceKm: number;
  paymentType: DeliveryPaymentType;
  codAmount: number | null;
  orderTotal: number;
  riderPayout: number;
  priority: "normal" | "high";
  placedAt: string;
  isToday: boolean;
  services: OrderedService[];
  specialInstructions: string;
  cancellationReason?: string;
  timeline: DeliveryTimelineStep[];
};

export const DELIVERY_TABS: { id: DeliveryStatus; label: string; short: string }[] = [
  { id: "new", label: "New Delivery", short: "New" },
  { id: "accepted", label: "Accepted", short: "Accepted" },
  { id: "reached-partner", label: "Reached Partner", short: "At Partner" },
  { id: "picked-up", label: "Picked Up", short: "Picked" },
  { id: "on-the-way", label: "On The Way", short: "On Way" },
  { id: "delivered", label: "Delivered", short: "Done" },
  { id: "cancelled", label: "Cancelled", short: "Cancelled" },
];

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  new: "New Delivery",
  accepted: "Accepted",
  "reached-partner": "Reached Partner",
  "picked-up": "Picked Up",
  "on-the-way": "On The Way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const DELIVERY_STATUS_TONE: Record<DeliveryStatus, string> = {
  new: "bg-primary/15 text-brand-dark",
  accepted: "bg-primary/15 text-brand-dark",
  "reached-partner": "bg-secondary/10 text-brand-green",
  "picked-up": "bg-secondary/10 text-brand-green",
  "on-the-way": "bg-secondary/10 text-brand-green",
  delivered: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

/** Canonical progress order used by the timeline + progress tracker. */
export const DELIVERY_PROGRESS: { id: DeliveryTimelineStep["id"]; label: string }[] = [
  { id: "assigned", label: "Assigned" },
  { id: "accepted", label: "Accepted" },
  { id: "reached-partner", label: "Reached Partner" },
  { id: "picked-up", label: "Picked Up" },
  { id: "on-the-way", label: "On The Way" },
  { id: "delivered", label: "Delivered" },
];

export const DELIVERY_FILTERS = [
  { id: "today", label: "Today" },
  { id: "cod", label: "COD" },
  { id: "online", label: "Online Payment" },
  { id: "priority", label: "High Priority" },
  { id: "nearest", label: "Nearest" },
] as const;

export type DeliveryFilterId = (typeof DELIVERY_FILTERS)[number]["id"];

export const DELIVERY_SORTS = [
  { id: "latest", label: "Latest" },
  { id: "nearest", label: "Nearest" },
  { id: "amount", label: "Highest Amount" },
  { id: "eta", label: "ETA" },
] as const;

export type DeliverySortId = (typeof DELIVERY_SORTS)[number]["id"];

function timeline(reached: number, times: (string | null)[]): DeliveryTimelineStep[] {
  return DELIVERY_PROGRESS.map((step, index) => ({
    id: step.id,
    label: step.label,
    time: times[index] ?? null,
    done: index <= reached,
  }));
}

export const riderDeliveriesMock: DeliveryOrder[] = [];

/** Next status for the primary action of each stage. */
export const NEXT_STATUS: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  new: "accepted",
  accepted: "reached-partner",
  "reached-partner": "picked-up",
  "picked-up": "on-the-way",
  "on-the-way": "delivered",
};

/** Simulated fetch so the module exercises skeletons and pull-to-refresh. */
export function loadRiderDeliveriesMock(delay = 700): Promise<DeliveryOrder[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(riderDeliveriesMock), delay);
  });
}

export function loadRiderDeliveryMock(id: string, delay = 550): Promise<DeliveryOrder | null> {
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve(
          riderDeliveriesMock.find((item) => item.id === id || item.orderId === id) ?? null,
        ),
      delay,
    );
  });
}
