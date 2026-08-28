/**
 * Partner orders data layer — talks to the shared QuickPress backend.
 *
 *   GET  /api/partner/orders
 *   GET  /api/partner/orders/{id}
 *   POST /api/partner/orders/{id}/accept | reject | start-processing | complete
 *
 * `updateOrderStatus` keeps its original signature so partner screens are
 * untouched; it maps a target status onto the matching lifecycle endpoint.
 */

import type { PartnerOrder, PartnerOrderStatus } from "@/shared/types/partner";

import { apiGetJson, apiPostJson } from "../core/transport";

/** GET /api/partner/orders */
export async function fetchPartnerOrders(): Promise<PartnerOrder[]> {
  const response = await apiGetJson<PartnerOrder[] | { items: PartnerOrder[]; total?: number }>("/api/partner/orders");
  if (Array.isArray(response)) return response;
  if (response && Array.isArray((response as any).items)) return (response as any).items;
  return [];
}

/** GET /api/partner/orders/{id} */
export async function fetchPartnerOrder(orderId: string): Promise<PartnerOrder> {
  return apiGetJson<PartnerOrder>(`/api/partner/orders/${orderId}`);
}

/** POST /api/partner/orders/{id}/accept */
export async function acceptPartnerOrder(orderId: string): Promise<PartnerOrder> {
  return apiPostJson<PartnerOrder>(`/api/partner/orders/${orderId}/accept`);
}

/** POST /api/partner/orders/{id}/reject */
export async function rejectPartnerOrder(orderId: string, reason = ""): Promise<PartnerOrder> {
  return apiPostJson<PartnerOrder>(`/api/partner/orders/${orderId}/reject`, { reason });
}

/** POST /api/partner/orders/{id}/start-processing */
export async function startProcessingOrder(orderId: string): Promise<PartnerOrder> {
  return apiPostJson<PartnerOrder>(`/api/partner/orders/${orderId}/start-processing`);
}

/** POST /api/partner/orders/{id}/ready — laundry is processed, ready for delivery. */
export async function markReadyOrder(orderId: string): Promise<PartnerOrder> {
  return apiPostJson<PartnerOrder>(`/api/partner/orders/${orderId}/ready`);
}

/** POST /api/partner/orders/{id}/complete — alias for ready. */
export async function completePartnerOrder(orderId: string): Promise<PartnerOrder> {
  return apiPostJson<PartnerOrder>(`/api/partner/orders/${orderId}/ready`);
}

/**
 * Status-driven helper used by the existing partner order screens.
 * Each target status maps to one lifecycle endpoint.
 */
export async function updateOrderStatus(
  orderId: string,
  status: PartnerOrderStatus,
): Promise<{ ok: true; orderId: string; status: PartnerOrderStatus; order: PartnerOrder }> {
  let order: PartnerOrder;

  switch (status) {
    case "accepted":
      order = await acceptPartnerOrder(orderId);
      break;
    case "cancelled":
      order = await rejectPartnerOrder(orderId, "Rejected by store");
      break;
    case "processing":
      order = await startProcessingOrder(orderId);
      break;
    case "ready":
    case "delivered":
      order = await completePartnerOrder(orderId);
      break;
    default:
      order = await fetchPartnerOrder(orderId);
  }

  return { ok: true, orderId, status: order.status, order };
}
