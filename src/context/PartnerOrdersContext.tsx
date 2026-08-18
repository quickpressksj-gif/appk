import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  HIGH_VALUE_THRESHOLD,
  managedOrders,
  type ManagedOrder,
  type OrderStage,
} from "../data/partner-orders-mock";

/* ------------------------------------------------------------------ */
/* Filter / sort vocabulary                                            */
/* ------------------------------------------------------------------ */

export type OrderFilterId =
  | "today"
  | "tomorrow"
  | "completed"
  | "cancelled"
  | "cod"
  | "online"
  | "high_value";

export const ORDER_FILTERS: { id: OrderFilterId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "cod", label: "COD" },
  { id: "online", label: "Online Payment" },
  { id: "high_value", label: "High Value" },
];

export type OrderSortId = "latest" | "oldest" | "amount" | "nearest";

export const ORDER_SORTS: { id: OrderSortId; label: string }[] = [
  { id: "latest", label: "Latest" },
  { id: "oldest", label: "Oldest" },
  { id: "amount", label: "Highest Amount" },
  { id: "nearest", label: "Nearest Pickup" },
];

export function matchesFilter(order: ManagedOrder, filter: OrderFilterId) {
  switch (filter) {
    case "today":
      return order.pickupDay === "today";
    case "tomorrow":
      return order.pickupDay === "tomorrow";
    case "completed":
      return order.stage === "completed";
    case "cancelled":
      return order.stage === "cancelled";
    case "cod":
      return order.paymentMode === "cod";
    case "online":
      return order.paymentMode === "online";
    case "high_value":
      return order.amount >= HIGH_VALUE_THRESHOLD;
    default:
      return true;
  }
}

export function matchesQuery(order: ManagedOrder, rawQuery: string) {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  return (
    order.code.toLowerCase().includes(q) ||
    order.id.toLowerCase().includes(q) ||
    order.customerName.toLowerCase().includes(q) ||
    (digits.length >= 3 && order.customerPhone.replace(/\D/g, "").includes(digits))
  );
}

export function sortOrders(list: ManagedOrder[], sort: OrderSortId) {
  const copy = [...list];
  switch (sort) {
    case "oldest":
      return copy.sort((a, b) => b.placedMinutesAgo - a.placedMinutesAgo);
    case "amount":
      return copy.sort((a, b) => b.amount - a.amount);
    case "nearest":
      return copy.sort((a, b) => a.distanceKm - b.distanceKm);
    case "latest":
    default:
      return copy.sort((a, b) => a.placedMinutesAgo - b.placedMinutesAgo);
  }
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

type StagePatch = {
  timelineLabel?: string;
  cancelReason?: string;
  assignedRider?: string;
  invoiceNo?: string;
};

type OrdersStore = {
  orders: ManagedOrder[];
  isLoading: boolean;
  isRefreshing: boolean;
  isOffline: boolean;
  refresh: () => Promise<void>;
  advanceStage: (orderId: string, stage: OrderStage, patch?: StagePatch) => void;
  counts: Record<OrderStage, number>;
};

const PartnerOrdersContext = createContext<OrdersStore | null>(null);

/** Stable, SSR-safe clock label for freshly appended timeline rows. */
function nowLabel() {
  if (typeof window === "undefined") return "Just now";
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PartnerOrdersProvider({ children }: { children: ReactNode }) {
  // TODO(api): GET /api/partner/orders — replace the mock seed below.
  const [orders, setOrders] = useState<ManagedOrder[]>(managedOrders);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const sync = () => setIsOffline(!window.navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const refresh = useCallback(async () => {
    // TODO(api): GET /api/partner/orders?refresh=1
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 750));
    setIsRefreshing(false);
  }, []);

  const advanceStage = useCallback((orderId: string, stage: OrderStage, patch: StagePatch = {}) => {
    // TODO(api): POST /api/partner/orders/{id}/status  { stage }
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const label = patch.timelineLabel ?? "Status updated";
        return {
          ...order,
          stage,
          cancelReason: patch.cancelReason ?? order.cancelReason,
          assignedRider: patch.assignedRider ?? order.assignedRider,
          invoiceNo: patch.invoiceNo ?? order.invoiceNo,
          timeline: [
            ...order.timeline,
            { id: `${order.id}-${order.timeline.length + 1}`, label, time: nowLabel() },
          ],
        };
      }),
    );
  }, []);

  const counts = useMemo(() => {
    const base: Record<OrderStage, number> = {
      new: 0,
      accepted: 0,
      pickup_pending: 0,
      washing: 0,
      dry_cleaning: 0,
      ironing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const order of orders) base[order.stage] += 1;
    return base;
  }, [orders]);

  const value = useMemo(
    () => ({ orders, isLoading, isRefreshing, isOffline, refresh, advanceStage, counts }),
    [orders, isLoading, isRefreshing, isOffline, refresh, advanceStage, counts],
  );

  return <PartnerOrdersContext.Provider value={value}>{children}</PartnerOrdersContext.Provider>;
}

export function usePartnerOrders() {
  const ctx = useContext(PartnerOrdersContext);
  if (!ctx) throw new Error("usePartnerOrders must be used inside <PartnerOrdersProvider>");
  return ctx;
}
