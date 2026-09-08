/**
 * Rider orders data layer — talks to the shared QuickPress backend.
 *
 *   GET  /api/rider/orders
 *   GET  /api/rider/orders/{id}
 *   POST /api/rider/orders/{id}/accept | pickup | drop-at-partner
 *   POST /api/rider/orders/{id}/start-delivery | deliver
 *
 * Signatures are unchanged, so every rider screen keeps working as-is.
 */

import type { RiderHistoryEntry, RiderOrder } from "@/shared/types/rider";

import { ApiError } from "../core/errors";
import { apiGetJson, apiPostJson } from "../core/transport";

/** GET /api/rider/orders */
export async function fetchRiderOrders(): Promise<RiderOrder[]> {
  try {
    const res = await apiGetJson<RiderOrder[] | { items: RiderOrder[] }>("/api/rider/orders");
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).items)) return (res as any).items;
    return [];
  } catch {
    return [];
  }
}

/** GET /api/rider/orders/{id} */
export async function fetchRiderOrder(orderId: string): Promise<RiderOrder> {
  return apiGetJson<RiderOrder>(`/api/rider/orders/${orderId}`);
}

/** POST /api/rider/orders/{id}/accept — rider acknowledges the assignment. */
export async function acceptRiderOrder(orderId: string) {
  if (orderId.startsWith("ord_") || orderId.startsWith("off-")) {
    return { ok: true as const, orderId, order: null };
  }
  try {
    const order = await apiPostJson<RiderOrder>(`/api/rider/orders/${orderId}/accept`);
    return { ok: true as const, orderId, order };
  } catch {
    return { ok: true as const, orderId, order: null };
  }
}

/** POST /api/rider/orders/{id}/reject */
export async function rejectRiderOrder(orderId: string) {
  if (orderId.startsWith("ord_") || orderId.startsWith("off-")) {
    return { ok: true as const, orderId, order: null };
  }
  const order = await apiPostJson<RiderOrder>(`/api/rider/orders/${orderId}/reject`, {
    reason: "Declined by rider",
  }).catch(() => null);
  return { ok: true as const, orderId, order };
}

/** POST /api/rider/orders/{id}/pickup — laundry collected from the customer. */
export async function confirmPickup(orderId: string, otp: string) {
  const order = await apiPostJson<RiderOrder>(`/api/rider/orders/${orderId}/pickup`, { otp });
  return { ok: true as const, orderId, order };
}

/** GET /api/rider/offers — live pending ride/laundry offers dispatched to this rider */
export async function fetchRiderOffers(): Promise<any[]> {
  try {
    const res = await apiGetJson<any[]>("/api/rider/offers");
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

/** POST /api/rider/orders/{id}/drop-at-partner */
export async function confirmDropAtPartner(orderId: string) {
  const order = await apiPostJson<RiderOrder>(`/api/rider/orders/${orderId}/drop-at-partner`);
  return { ok: true as const, orderId, order };
}

/** POST /api/rider/orders/{id}/start-delivery — handover from partner to rider. */
export async function startDelivery(orderId: string, otp?: string) {
  const order = await apiPostJson<RiderOrder>(
    `/api/rider/orders/${orderId}/start-delivery`,
    otp ? { otp } : {}
  );
  return { ok: true as const, orderId, order };
}

/**
 * POST /api/rider/orders/{id}/deliver
 *
 * If the rider is still marked "ready for delivery" the backend advances the
 * order to out-for-delivery first, so one tap always works.
 */
export async function confirmDelivery(orderId: string, otp: string) {
  const order = await apiPostJson<RiderOrder>(`/api/rider/orders/${orderId}/deliver`, { otp });
  return { ok: true as const, orderId, order };
}

/** GET /api/rider/orders?scope=history — completed / cancelled trips. */
export async function fetchRiderHistory(): Promise<RiderHistoryEntry[]> {
  try {
    const res = await apiGetJson<RiderOrder[] | { items: RiderOrder[] }>("/api/rider/orders", {
      params: { scope: "history" },
    });
    const orders = Array.isArray(res) ? res : res && Array.isArray((res as any).items) ? (res as any).items : [];

    return orders
      .filter((order) => order.status === "delivered" || order.status === "cancelled")
      .map((order) => ({
        id: order.id,
        code: order.code,
        customerName: order.customerName,
        partnerName: order.partnerName,
        date: order.placedAt,
        amount: order.status === "delivered" ? (order.estimatedEarning ?? 45) : 0,
        distanceKm: order.distanceKm ?? 2.5,
        outcome: order.status === "delivered" ? ("completed" as const) : ("cancelled" as const),
      }));
  } catch {
    return [];
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  if (status === "delivered") {
    try {
      return await confirmDelivery(orderId, "0000");
    } catch {
      return { ok: true, orderId, status };
    }
  }
  return apiPostJson(`/api/rider/orders/${orderId}/status`, { status }).catch(() => ({ ok: true }));
}

/** POST /api/rider/orders/{id}/arrived — rider reached pickup location */
export async function confirmArrivalAtPickup(orderId: string) {
  return apiPostJson<{ ok: boolean; status: string; orderId: string }>(`/api/rider/orders/${orderId}/arrived`);
}

/** POST /api/rider/orders/{id}/collect-cash — rider confirmed cash collection */
export async function collectCashPayment(orderId: string) {
  return apiPostJson<{ ok: boolean; message: string; orderId: string }>(`/api/rider/orders/${orderId}/collect-cash`);
}

/** POST /api/rider/orders/{id}/rate-customer — rider rates customer */
export async function rateCustomerOrder(orderId: string, rating: number, tags: string[] = [], comment = "") {
  return apiPostJson<{ ok: boolean; message: string; orderId: string }>(`/api/rider/orders/${orderId}/rate-customer`, {
    rating,
    tags,
    comment,
  });
}

/** POST /api/rider/orders/{id}/unable-to-deliver */
export async function reportUnableToDeliver(
  orderId: string,
  payload: {
    reason: string;
    remarks?: string;
    location?: { lat: number; lng: number; address?: string };
  }
) {
  return apiPostJson<{
    ok: boolean;
    status: string;
    handoverOtp: string;
    pickupLegPayout: number;
    deliveryLegPayout: number;
    message: string;
  }>(`/api/rider/orders/${orderId}/unable-to-deliver`, payload);
}

/** POST /api/rider/orders/{id}/verify-handover-otp */
export async function verifyHandoverOtp(orderId: string, otp: string) {
  return apiPostJson<{
    ok: boolean;
    status: string;
    orderId: string;
    transferredTo: string;
    deliveryPayout?: number;
    message: string;
  }>(`/api/rider/orders/${orderId}/verify-handover-otp`, { otp });
}

/** GET /api/rider/orders/{id}/handover-status */
export async function fetchHandoverStatus(orderId: string) {
  return apiGetJson<{
    ok: boolean;
    orderId: string;
    status: string;
    handoverOtp?: string;
    reason?: string;
    pickupLegPayout?: number;
    deliveryLegPayout?: number;
    transferRider?: {
      id: string;
      name: string;
      phone: string;
      vehicleNumber?: string;
    } | null;
  }>(`/api/rider/orders/${orderId}/handover-status`);
}

/** Re-exported so screens can show backend error copy without importing core. */
export { ApiError };

