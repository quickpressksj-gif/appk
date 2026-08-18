/**
 * Order history data layer — Sprint 2.5.
 *
 *   GET  /api/orders/history          search + status / date / partner filters
 *   GET  /api/orders                  fallback list (older backends)
 *   GET  /api/services                resolves the service a row deep-links to
 *   POST /api/orders/{id}/reorder     one tap reorder into the smart cart
 *   POST /api/orders/{id}/cancel      cancel before pickup
 *
 * Recent orders are cached locally so History paints instantly on a warm start
 * and still renders (from the stale cache) when the device is offline.
 */

import type { Order, OrderLifecycleStatus, ServiceEntity } from "@shared/types";

import { formatOrderDate, formatOrderTime } from "../mock/mappers";
import { apiGetJson, apiPostJson } from "../core/transport";
import { CACHE_KEYS, readCache, readStaleCache, writeCache } from "./api/cache";
import { hydrateCart } from "./cart-store";

export const HISTORY_API_ENDPOINTS = {
  orders: "/api/orders",
  history: "/api/orders/history",
  services: "/api/services",
  reorder: "/api/orders/{id}/reorder",
  cancel: "/api/orders/{id}/cancel",
} as const;

export type OrderStatus = "delivered" | "in-progress" | "cancelled";

export type OrderItem = {
  name: string;
  qty: number;
  price?: number;
};

export type OrderRecord = {
  /** Order number (QP…) — what the customer sees and searches by. */
  id: string;
  /** Internal order id used by every /api/orders/{id} call. */
  orderId: string;
  serviceId: string;
  service: string;
  store: string;
  partnerId: string;
  placedOn: string;
  /** Raw ISO timestamp, used by the date filter. */
  placedAt: string;
  status: OrderStatus;
  lifecycleStatus: OrderLifecycleStatus;
  cancelledReason: string | null;
  total: number;
  items: OrderItem[];
};

export type HistoryFilters = {
  q?: string | undefined;
  /** Customer bucket, not a lifecycle status. */
  status?: "all" | OrderStatus | undefined;
  from?: string | undefined;
  to?: string | undefined;
  partnerId?: string | undefined;
};

export type PartnerOption = { id: string; name: string };

/** Customer buckets map onto the backend's `status` query value. */
const STATUS_QUERY: Record<OrderStatus, string> = {
  delivered: "completed",
  cancelled: "cancelled",
  "in-progress": "active",
};

function toStatus(order: Order): OrderStatus {
  if (order.status === "cancelled") return "cancelled";
  if (order.status === "delivered") return "delivered";
  return "in-progress";
}

function resolveServiceId(order: Order, services: ServiceEntity[]): string {
  const label = order.serviceLabel.toLowerCase();
  const match =
    services.find((service) => service.name.toLowerCase() === label) ??
    services.find((service) => label.includes(service.name.toLowerCase())) ??
    services.find((service) => service.name.toLowerCase().includes(label));
  return match?.id ?? services[0]?.id ?? "s1";
}

function toRecord(order: Order, services: ServiceEntity[]): OrderRecord {
  return {
    id: order.code,
    orderId: order.id,
    serviceId: resolveServiceId(order, services),
    service: order.serviceLabel,
    store: order.partner.name,
    partnerId: order.partner.id,
    placedOn: `${formatOrderDate(order.createdAt)}, ${formatOrderTime(order.createdAt)}`,
    placedAt: order.createdAt,
    status: toStatus(order),
    lifecycleStatus: order.status,
    cancelledReason: order.cancelledReason ?? null,
    total: order.totals.grandTotal,
    items: order.items.map((item) => ({ name: item.name, qty: item.qty, price: item.price })),
  };
}

function hasFilters(filters: HistoryFilters): boolean {
  return Boolean(
    (filters.q ?? "").trim() ||
      (filters.status && filters.status !== "all") ||
      filters.from ||
      filters.to ||
      filters.partnerId,
  );
}

async function fetchOrders(
  filters: HistoryFilters,
  signal?: AbortSignal | undefined,
): Promise<Order[]> {
  const params = {
    q: (filters.q ?? "").trim() || undefined,
    status:
      filters.status && filters.status !== "all" ? STATUS_QUERY[filters.status] : undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    partnerId: filters.partnerId || undefined,
  };
  try {
    return await apiGetJson<Order[]>(HISTORY_API_ENDPOINTS.history, { params, signal });
  } catch {
    // Older backends only expose GET /api/orders — filter on the client.
    return apiGetJson<Order[]>(HISTORY_API_ENDPOINTS.orders, { signal });
  }
}

async function fetchServices(signal?: AbortSignal | undefined): Promise<ServiceEntity[]> {
  try {
    return await apiGetJson<ServiceEntity[]>(HISTORY_API_ENDPOINTS.services, { signal });
  } catch {
    return [];
  }
}

/** Local filtering — the safety net when the backend ignored a query param. */
function applyFilters(records: OrderRecord[], filters: HistoryFilters): OrderRecord[] {
  const term = (filters.q ?? "").trim().toLowerCase();
  return records.filter((record) => {
    if (filters.status && filters.status !== "all" && record.status !== filters.status) {
      return false;
    }
    if (filters.partnerId && record.partnerId !== filters.partnerId) return false;
    const day = (record.placedAt ?? "").slice(0, 10);
    if (filters.from && day < filters.from) return false;
    if (filters.to && day > filters.to) return false;
    if (term) {
      const haystack = [record.id, record.service, record.store, ...record.items.map((i) => i.name)]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

/** GET /api/orders/history — cache-first, with an offline fallback. */
export async function fetchOrderHistory(
  filters: HistoryFilters = {},
  options: { signal?: AbortSignal | undefined; forceRefresh?: boolean } = {},
): Promise<OrderRecord[]> {
  const cacheable = !hasFilters(filters);

  if (cacheable && !options.forceRefresh) {
    const cached = readCache<OrderRecord[]>(CACHE_KEYS.orderHistory);
    if (cached) return cached;
  }

  try {
    const [orders, services] = await Promise.all([
      fetchOrders(filters, options.signal),
      fetchServices(options.signal),
    ]);
    const records = applyFilters(
      orders.map((order) => toRecord(order, services)),
      filters,
    );
    if (cacheable) writeCache(CACHE_KEYS.orderHistory, records);
    return records;
  } catch (error) {
    const stale = readStaleCache<OrderRecord[]>(CACHE_KEYS.orderHistory);
    if (stale) return applyFilters(stale, filters);
    throw error;
  }
}

/** Cached history, if any — used to paint before the network settles. */
export function readCachedOrderHistory(): OrderRecord[] | null {
  return readStaleCache<OrderRecord[]>(CACHE_KEYS.orderHistory);
}

export function invalidateOrderHistoryCache() {
  writeCache(CACHE_KEYS.orderHistory, [] as OrderRecord[]);
}

/** The partners a customer has ordered from — feeds the partner filter. */
export function partnerOptions(records: OrderRecord[]): PartnerOption[] {
  const seen = new Map<string, string>();
  for (const record of records) {
    if (record.partnerId && !seen.has(record.partnerId)) seen.set(record.partnerId, record.store);
  }
  return [...seen].map(([id, name]) => ({ id, name }));
}

/**
 * POST /api/orders/{id}/reorder — every line of a past order goes back into
 * the cart. Falls back to POST /api/cart/items when the endpoint is missing.
 */
export async function reorder(orderId: string) {
  try {
    await apiPostJson<Order>(HISTORY_API_ENDPOINTS.reorder.replace("{id}", orderId), {});
  } catch {
    const orders = await apiGetJson<Order[]>(HISTORY_API_ENDPOINTS.orders);
    const order = orders.find((entry) => entry.code === orderId || entry.id === orderId);
    if (!order) return { ok: false as const, orderId };
    for (const line of order.items) {
      await apiPostJson<unknown>("/api/cart/items", {
        id: line.id,
        serviceId: line.id,
        partnerId: order.partner.id,
        name: line.name,
        price: line.price,
        unit: "per piece",
        qty: line.qty,
        image: order.partner.image ?? "",
      });
    }
  }
  // Keep the shared cart snapshot in sync before the customer lands on cart.
  await hydrateCart();
  return { ok: true as const, orderId };
}

/** POST /api/orders/{id}/cancel */
export async function cancelHistoryOrder(orderId: string, reason: string) {
  await apiPostJson<Order>(HISTORY_API_ENDPOINTS.cancel.replace("{id}", orderId), { reason });
  return { ok: true as const, orderId };
}
