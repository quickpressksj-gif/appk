/**
 * Service Availability data layer — Sprint 2.12.
 *
 *   GET  /api/service-areas                       supported cities / areas / PINs
 *   GET  /api/services/{id}/availability          service level check
 *   GET  /api/partners/{id}/availability          partner level check
 *   POST /api/availability/check                  full pre-checkout check
 *
 * Checkout calls `checkAvailability()` before it places the order; the Service
 * Details and Partner screens call the GET variants to render the same banner.
 * Every failure state carries a customer-safe title, message and a list of
 * alternatives, so no screen has to invent its own copy.
 */

import { apiGetJson, apiPostJson } from "../core/transport";

export const AVAILABILITY_API_ENDPOINTS = {
  areas: "/api/service-areas",
  service: "/api/services/{id}/availability",
  partner: "/api/partners/{id}/availability",
  check: "/api/availability/check",
} as const;

export type AvailabilityState =
  | "available"
  | "service_unavailable"
  | "maintenance"
  | "partner_inactive"
  | "partner_closed"
  | "out_of_service_area"
  | "pickup_unavailable"
  | "delivery_unavailable"
  | "capacity_reached";

export type AvailabilityCheckRule = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

export type AvailabilityCapacity = {
  limit: number;
  used: number;
  remaining: number;
};

export type AvailabilityAlternative = {
  kind: "partner" | "service";
  id: string;
  name: string;
  subtitle: string;
  image: string;
  rating: number;
  price: number;
};

export type Availability = {
  available: boolean;
  state: AvailabilityState;
  title: string;
  message: string;
  serviceId: string | null;
  partnerId: string | null;
  city: string;
  pincode: string;
  checks: AvailabilityCheckRule[];
  capacity: AvailabilityCapacity;
  nextOpenLabel: string;
  alternatives: AvailabilityAlternative[];
};

export type ServiceArea = {
  id: string;
  city: string;
  area: string;
  pincodes: string[];
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  partnerIds: string[];
  etaMinutes: number;
};

export type AvailabilityQuery = {
  serviceId?: string | undefined;
  partnerId?: string | undefined;
  city?: string | undefined;
  pincode?: string | undefined;
};

/** Optimistic fallback so a transport failure never blocks checkout. */
export function availableFallback(query: AvailabilityQuery = {}): Availability {
  return {
    available: true,
    state: "available",
    title: "Available",
    message: "Pickup and delivery are available for this service.",
    serviceId: query.serviceId ?? null,
    partnerId: query.partnerId ?? null,
    city: query.city ?? "",
    pincode: query.pincode ?? "",
    checks: [],
    capacity: { limit: 0, used: 0, remaining: 0 },
    nextOpenLabel: "",
    alternatives: [],
  };
}

/** POST /api/availability/check — the full rule chain, used before checkout. */
export async function checkAvailability(query: AvailabilityQuery): Promise<Availability> {
  try {
    return await apiPostJson<Availability>(AVAILABILITY_API_ENDPOINTS.check, {
      serviceId: query.serviceId ?? "",
      partnerId: query.partnerId ?? "",
      city: query.city ?? "",
      pincode: query.pincode ?? "",
    });
  } catch {
    return availableFallback(query);
  }
}

/** GET /api/services/{id}/availability */
export async function fetchServiceAvailability(
  serviceId: string,
  query: Omit<AvailabilityQuery, "serviceId"> = {},
): Promise<Availability> {
  try {
    return await apiGetJson<Availability>(
      AVAILABILITY_API_ENDPOINTS.service.replace("{id}", serviceId),
      {
        params: {
          partnerId: query.partnerId ?? "",
          city: query.city ?? "",
          pincode: query.pincode ?? "",
        },
      },
    );
  } catch {
    return availableFallback({ ...query, serviceId });
  }
}

/** GET /api/partners/{id}/availability */
export async function fetchPartnerAvailability(
  partnerId: string,
  query: Omit<AvailabilityQuery, "partnerId"> = {},
): Promise<Availability> {
  try {
    return await apiGetJson<Availability>(
      AVAILABILITY_API_ENDPOINTS.partner.replace("{id}", partnerId),
      {
        params: {
          serviceId: query.serviceId ?? "",
          city: query.city ?? "",
          pincode: query.pincode ?? "",
        },
      },
    );
  } catch {
    return availableFallback({ ...query, partnerId });
  }
}

/** GET /api/service-areas */
export async function fetchServiceAreas(): Promise<ServiceArea[]> {
  try {
    return await apiGetJson<ServiceArea[]>(AVAILABILITY_API_ENDPOINTS.areas);
  } catch {
    return [];
  }
}

/** True when the PIN code is inside any live delivery zone. */
export function isPincodeServed(areas: ServiceArea[], pincode: string): boolean {
  const pin = pincode.trim();
  if (!pin) return false;
  return areas.some((area) => area.pincodes.includes(pin));
}
