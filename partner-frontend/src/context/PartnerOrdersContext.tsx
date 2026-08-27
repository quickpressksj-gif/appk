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

const STATUS_TO_STAGE: Record<string, OrderStage> = {
  placed: "new",
  pending_partner_acceptance: "new",
  new: "new",
  accepted: "accepted",
  partner_accepted: "accepted",
  rider_accepted: "accepted",
  rider_assigned: "accepted",
  picked: "pickup_pending",
  picked_up: "pickup_pending",
  at_partner: "pickup_pending",
  processing: "washing",
  washing: "washing",
  ironing: "ironing",
  dry_cleaning: "dry_cleaning",
  ready: "ready",
  completed: "ready",
  out_for_delivery: "ready",
  delivered: "completed",
  cancelled: "cancelled",
};

function toManagedOrder(order: PartnerOrder): ManagedOrder {
  const timeline = Array.isArray(order?.timeline) ? order.timeline : [];
  const items = Array.isArray(order?.items) ? order.items : [];
  const cancelledEntry = timeline.find((entry) => /reject|cancel/i.test(entry.label));
  return {
    id: order.id || (order as any).orderId || "",
    code: order.code || order.id || (order as any).orderId || "",
    stage: STATUS_TO_STAGE[order.status] ?? "new",
    customerName: order.customerName || "Customer",
    customerRating: 5.0,
    customerPhone: order.customerPhone || "",
    customerOrders: 1,
    pickupAddress: order.address || "",
    deliveryAddress: order.address || "",
    pickupTime: order.slot || "Today",
    pickupDay: "today",
    deliveryEta: order.slot || "Tomorrow",
    distanceKm: 0,
    services: order.serviceLabel ? [order.serviceLabel] : [],
    itemCount: order.itemCount || items.reduce((sum, it) => sum + (it.qty || 1), 0) || 1,
    amount: order.amount || 0,
    paymentStatus: order.status === "cancelled" ? "refunded" : order.paymentMode === "cod" ? "pending" : "paid",
    paymentMode: order.paymentMode || "cod",
    placedAt: order.placedAt || "Recently",
    placedMinutesAgo: 0,
    specialInstructions: "",
    items: items.map((item) => ({
      id: item.id || "",
      name: item.name || "Laundry Service Item",
      service: order.serviceLabel || "Laundry",
      qty: item.qty || 1,
      price: item.price || 0,
    })),
    charges: {
      subtotal: order.amount || 0,
      pickupFee: 0,
      taxes: 0,
      discount: 0,
      total: order.amount || 0,
    },
    timeline: timeline.map((entry) => ({ id: entry.id || "", label: entry.label || "", time: entry.time || "" })),
    invoiceNo: null,
    cancelReason: order.status === "cancelled" ? (cancelledEntry?.label ?? (order as any).cancelledReason ?? "Cancelled") : null,
    assignedRider: (order as any).riderName || null,
  };
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

import { IncomingOrderModal } from "../components/orders/IncomingOrderModal";
import { startOrderAlarm, stopOrderAlarm } from "../lib/order-alarm";

type OrdersStore = {
  orders: ManagedOrder[];
  isLoading: boolean;
  isRefreshing: boolean;
  isOffline: boolean;
  error: string | null;
  incomingOrder: ManagedOrder | null;
  refresh: () => Promise<void>;
  acceptOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string, reason: string) => Promise<void>;
  startProcessing: (orderId: string) => Promise<void>;
  completeOrder: (orderId: string) => Promise<void>;
  counts: Record<OrderStage, number>;
  testIncomingOrderAlarm: () => void;
};

const PartnerOrdersContext = createContext<OrdersStore | null>(null);

let cachedPartnerOrders: ManagedOrder[] | null = null;

const CACHE_KEY = "qp.partner.cachedOrders";

function getCachedOrders(): ManagedOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function PartnerOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<ManagedOrder[]>(getCachedOrders);
  const [isLoading, setIsLoading] = useState(() => orders.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incomingOrder, setIncomingOrder] = useState<ManagedOrder | null>(null);
  const [seenOrderIds, setSeenOrderIds] = useState<Set<string>>(() => {
    // Initialise seen IDs from cached orders so existing orders do not trigger alarm on reload
    const cached = getCachedOrders();
    return new Set(cached.map((o) => o.id));
  });

  const load = useCallback(
    async (opts: { refreshing?: boolean } = {}) => {
      if (opts.refreshing) setIsRefreshing(true);
      else if (orders.length === 0) setIsLoading(true);
      setError(null);
      try {
        const remote = await fetchPartnerOrders();
        const mapped = remote.map(toManagedOrder);
        setOrders(mapped);

        // Cache in localStorage for 0ms instant loading next time
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(CACHE_KEY, JSON.stringify(mapped));
          } catch {
            /* ignore */
          }
        }

        // Check for new unacknowledged orders (Zomato style order alert)
        const unacknowledgedNew = mapped.find(
          (o) => o.stage === "new" && !seenOrderIds.has(o.id)
        );

        if (unacknowledgedNew && !incomingOrder) {
          setSeenOrderIds((prev) => new Set([...prev, unacknowledgedNew.id]));
          setIncomingOrder(unacknowledgedNew);
          startOrderAlarm(unacknowledgedNew.code);
        }
      } catch (err) {
        if (orders.length === 0) {
          setError(err instanceof Error ? err.message : "Failed to load orders");
        }
      } finally {
        if (opts.refreshing) setIsRefreshing(false);
        setIsLoading(false);
      }
    },
    [seenOrderIds, incomingOrder, orders.length],
  );

  // Initial load
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Background polling every 3 seconds for instantaneous order notification
  useEffect(() => {
    const pollInterval = setInterval(() => {
      void load({ refreshing: true });
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [load]);

  // Stop alarm on unmount
  useEffect(() => {
    return () => {
      stopOrderAlarm();
    };
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
      stopOrderAlarm();
      setIncomingOrder(null);
      await acceptPartnerOrder(orderId);
      await load({ refreshing: true });
    },
    [load],
  );

  const rejectOrder = useCallback(
    async (orderId: string, reason: string) => {
      stopOrderAlarm();
      setIncomingOrder(null);
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

  const testIncomingOrderAlarm = useCallback(() => {
    const mockOrder: ManagedOrder = {
      id: `ord-test-${Date.now()}`,
      code: `QP${Math.floor(1000 + Math.random() * 9000)}`,
      stage: "new",
      customerName: "Rahul Sharma (Demo)",
      customerRating: 4.9,
      customerPhone: "+919876543210",
      customerOrders: 3,
      pickupAddress: "Flat 204, Green Palms, Kasganj Main Market",
      deliveryAddress: "Flat 204, Green Palms, Kasganj Main Market",
      pickupTime: "Today · 8 AM – 12 PM",
      pickupDay: "today",
      deliveryEta: "Tomorrow · 6 PM",
      distanceKm: 1.2,
      services: ["Wash & Fold (2 KG)", "Steam Ironing (4 pcs)"],
      itemCount: 6,
      amount: 280,
      paymentStatus: "paid",
      paymentMode: "online",
      placedAt: new Date().toISOString(),
      placedMinutesAgo: 0,
      specialInstructions: "Handle delicate fabrics with care",
      items: [
        { id: "1", name: "Wash & Fold", service: "Wash", qty: 2, price: 80 },
        { id: "2", name: "Steam Ironing", service: "Iron", qty: 4, price: 30 },
      ],
      charges: { subtotal: 280, pickupFee: 0, taxes: 0, discount: 0, total: 280 },
      timeline: [{ id: "1", label: "Order Placed", time: "Just now" }],
      invoiceNo: null,
      cancelReason: null,
      assignedRider: null,
    };
    setIncomingOrder(mockOrder);
    startOrderAlarm(mockOrder.code);
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
    for (const order of orders) {
      if (order && order.stage) {
        base[order.stage] = (base[order.stage] || 0) + 1;
      }
    }
    return base;
  }, [orders]);

  const value = useMemo(
    () => ({
      orders,
      isLoading,
      isRefreshing,
      isOffline,
      error,
      incomingOrder,
      refresh,
      acceptOrder,
      rejectOrder,
      startProcessing,
      completeOrder,
      counts,
      testIncomingOrderAlarm,
    }),
    [
      orders,
      isLoading,
      isRefreshing,
      isOffline,
      error,
      incomingOrder,
      refresh,
      acceptOrder,
      rejectOrder,
      startProcessing,
      completeOrder,
      counts,
      testIncomingOrderAlarm,
    ],
  );

  return (
    <PartnerOrdersContext.Provider value={value}>
      {children}
      {incomingOrder ? (
        <IncomingOrderModal
          order={incomingOrder}
          onAccept={acceptOrder}
          onReject={rejectOrder}
          onDismiss={() => {
            stopOrderAlarm();
            setIncomingOrder(null);
          }}
        />
      ) : null}
    </PartnerOrdersContext.Provider>
  );
}

export function usePartnerOrders() {
  const ctx = useContext(PartnerOrdersContext);
  if (!ctx) throw new Error("usePartnerOrders must be used inside <PartnerOrdersProvider>");
  return ctx;
}
