import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { PartnerOrder, PartnerOrderStatus } from "@/shared/types/partner";
import {
  acceptPartnerOrder,
  completePartnerOrder,
  fetchPartnerOrders,
  rejectPartnerOrder,
  startProcessingOrder,
} from "@/api/partner/partner-orders-api";

import { HIGH_VALUE_THRESHOLD, type ManagedOrder, type OrderStage } from "../data/partner-orders-mock";

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
/* Backend → view-model adapter                                        */
/* ------------------------------------------------------------------ */

const STATUS_TO_STAGE: Record<PartnerOrderStatus, OrderStage> = {
  new: "new",
  accepted: "accepted",
  picked: "pickup_pending",
  processing: "washing",
  ready: "ready",
  delivered: "completed",
  cancelled: "cancelled",
};

function toManagedOrder(order: PartnerOrder): ManagedOrder {
  const cancelledEntry = order.timeline.find((entry) => /reject|cancel/i.test(entry.label));
  return {
    id: order.id,
    code: order.code,
    stage: STATUS_TO_STAGE[order.status] ?? "new",
    customerName: order.customerName,
    customerRating: 0,
    customerPhone: order.customerPhone,
    customerOrders: 0,
    pickupAddress: order.address,
    deliveryAddress: order.address,
    pickupTime: order.slot,
    pickupDay: "today",
    deliveryEta: order.slot,
    distanceKm: 0,
    services: order.serviceLabel ? [order.serviceLabel] : [],
    itemCount: order.itemCount,
    amount: order.amount,
    paymentStatus: order.status === "cancelled" ? "refunded" : order.paymentMode === "cod" ? "pending" : "paid",
    paymentMode: order.paymentMode,
    placedAt: order.placedAt,
    placedMinutesAgo: 0,
    specialInstructions: "",
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      service: order.serviceLabel,
      qty: item.qty,
      price: item.price,
    })),
    charges: {
      subtotal: order.amount,
      pickupFee: 0,
      taxes: 0,
      discount: 0,
      total: order.amount,
    },
    timeline: order.timeline.map((entry) => ({ id: entry.id, label: entry.label, time: entry.time })),
    invoiceNo: null,
    cancelReason: order.status === "cancelled" ? (cancelledEntry?.label ?? "Rejected by store") : null,
    assignedRider: null,
  };
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

type OrdersStore = {
  orders: ManagedOrder[];
  isLoading: boolean;
  isRefreshing: boolean;
  isOffline: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  acceptOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string, reason: string) => Promise<void>;
  startProcessing: (orderId: string) => Promise<void>;
  completeOrder: (orderId: string) => Promise<void>;
  counts: Record<OrderStage, number>;
};

const PartnerOrdersContext = createContext<OrdersStore | null>(null);

export function PartnerOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<ManagedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts: { refreshing?: boolean } = {}) => {
    if (opts.refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const remote = await fetchPartnerOrders();
      setOrders(remote.map(toManagedOrder));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      if (opts.refreshing) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const refresh = useCallback(() => load({ refreshing: true }), [load]);

  const acceptOrder = useCallback(
    async (orderId: string) => {
      await acceptPartnerOrder(orderId);
      await load({ refreshing: true });
    },
    [load],
  );

  const rejectOrder = useCallback(
    async (orderId: string, reason: string) => {
      await rejectPartnerOrder(orderId, reason);
      await load({ refreshing: true });
    },
    [load],
  );

  const startProcessing = useCallback(
    async (orderId: string) => {
      await startProcessingOrder(orderId);
      await load({ refreshing: true });
    },
    [load],
  );

  const completeOrder = useCallback(
    async (orderId: string) => {
      await completePartnerOrder(orderId);
      await load({ refreshing: true });
    },
    [load],
  );

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
    () => ({
      orders,
      isLoading,
      isRefreshing,
      isOffline,
      error,
      refresh,
      acceptOrder,
      rejectOrder,
      startProcessing,
      completeOrder,
      counts,
    }),
    [
      orders,
      isLoading,
      isRefreshing,
      isOffline,
      error,
      refresh,
      acceptOrder,
      rejectOrder,
      startProcessing,
      completeOrder,
      counts,
    ],
  );

  return <PartnerOrdersContext.Provider value={value}>{children}</PartnerOrdersContext.Provider>;
}

export function usePartnerOrders() {
  const ctx = useContext(PartnerOrdersContext);
  if (!ctx) throw new Error("usePartnerOrders must be used inside <PartnerOrdersProvider>");
  return ctx;
}
