/**
 * Smart Reorder data layer — Sprint 2.12.
 *
 *   GET  /api/reorder/history        completed orders, repriced and validated
 *   POST /api/orders/{id}/reorder    restore every line into the smart cart
 *
 * Reorder is never a blind "add to cart": the backend reprices each line
 * against today's catalogue, drops services that are unavailable and returns
 * the live availability of the partner, so the customer sees exactly what
 * changed before paying.
 */

import { apiGetJson, apiPostJson } from "../core/transport";
import type { Availability } from "./availability-api";
import { availableFallback } from "./availability-api";
import { hydrateCart } from "./cart-store";

export const REORDER_API_ENDPOINTS = {
  history: "/api/reorder/history",
  reorder: "/api/orders/{id}/reorder",
} as const;

export type ReorderLine = {
  id: string;
  serviceId: string;
  name: string;
  qty: number;
  previousPrice: number;
  currentPrice: number;
  priceChanged: boolean;
  available: boolean;
  unavailableReason: string;
};

export type ReorderHistoryEntry = {
  orderId: string;
  orderCode: string;
  partnerId: string;
  partnerName: string;
  partnerImage: string;
  serviceLabel: string;
  placedAt: string;
  deliveredAt: string;
  itemCount: number;
  previousTotal: number;
  estimatedTotal: number;
  priceChanged: boolean;
  reorderable: boolean;
  availability: Availability;
  items: ReorderLine[];
  lastReorderedAt: string | null;
  reorderCount: number;
};

export type ReorderResult = {
  ok: boolean;
  orderId: string;
  orderCode: string;
  redirectTo: string;
  restoredItems: number;
  previousTotal: number;
  estimatedTotal: number;
  priceChanged: boolean;
  skipped: ReorderLine[];
  items: ReorderLine[];
  availability: Availability;
};

/** GET /api/reorder/history */
export async function fetchReorderHistory(): Promise<ReorderHistoryEntry[]> {
  try {
    return await apiGetJson<ReorderHistoryEntry[]>(REORDER_API_ENDPOINTS.history);
  } catch {
    return [];
  }
}

/**
 * POST /api/orders/{id}/reorder — restore, reprice, validate, then refresh the
 * shared cart snapshot so /cart paints the restored lines immediately.
 */
export async function smartReorder(orderId: string): Promise<ReorderResult> {
  const result = await apiPostJson<ReorderResult>(
    REORDER_API_ENDPOINTS.reorder.replace("{id}", orderId),
    {},
  );
  await hydrateCart();
  return {
    ...result,
    redirectTo: result.redirectTo || "/cart",
    skipped: result.skipped ?? [],
    items: result.items ?? [],
    availability: result.availability ?? availableFallback(),
  };
}

/** One line of customer-safe copy summarising what the reorder changed. */
export function reorderSummary(result: ReorderResult): string {
  if (!result.ok) return "We couldn't restore this order — those services aren't available today.";
  const parts = [`${result.restoredItems} item${result.restoredItems === 1 ? "" : "s"} added`];
  if (result.priceChanged) {
    const delta = result.estimatedTotal - result.previousTotal;
    parts.push(delta > 0 ? `prices updated (+₹${delta})` : `prices updated (₹${delta})`);
  }
  if (result.skipped.length > 0) {
    parts.push(`${result.skipped.length} unavailable and skipped`);
  }
  return parts.join(" · ");
}
