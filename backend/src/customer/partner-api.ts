/**
 * QuickPress Partner Details — live data layer (Sprint 2.2).
 *
 * Every function maps 1:1 to a FastAPI endpoint served by `backend-python`
 * (`app/api/partners.py`, backed by the `catalog_partners` and
 * `partner_reviews` MongoDB collections). In mock mode the same shapes come
 * from `backend/src/mock/partner-projections.ts`, so the screen code never
 * branches on transport.
 *
 *   GET  /api/partners/{id}            — profile + services + reviews + gallery
 *   GET  /api/partners/{id}/services   — service menu only
 *   GET  /api/partners/{id}/reviews    — rating summary + review list
 *   POST /api/cart                     — add items to the cart
 *
 * Partner details are cached per partner id (stale-while-revalidate) so
 * revisiting a store paints instantly and still refreshes in the background.
 */

import { apiGetJson, apiPostJson } from "@backend/core/transport";

import {
  readScopedCache,
  readStaleScopedCache,
  writeScopedCache,
  clearScopedCache,
} from "./api/cache";

export const PARTNER_API_ENDPOINTS = {
  partner: "/api/partners/{id}",
  partnerServices: "/api/partners/{id}/services",
  partnerReviews: "/api/partners/{id}/reviews",
  cart: "/api/cart",
} as const;

export type PartnerHours = {
  day: string;
  opensAt: string;
  closesAt: string;
  closed: boolean;
};

export type PartnerProfile = {
  id: string;
  name: string;
  cover: string;
  logo: string;
  verified: boolean;
  rating: number;
  /** Formatted label, e.g. "2.1k". */
  reviewCount: string;
  reviewsCount: number;
  distanceKm: number;
  pickupEta: string;
  deliveryEta: string;
  open: boolean;
  status: string;
  ownerName: string;
  address: string;
  city: string;
  area: string;
  latitude: number;
  longitude: number;
  pickupRadius: string;
  deliveryRadiusKm: number;
  workingHours: string;
  hours: PartnerHours[];
  phone: string;
  about: string;
  yearsInBusiness: number;
  /** One line shop introduction shown under the name. */
  tagline: string;
  offerLabel: string | null;
  minOrderValue: number;
  /** Store policies shown on the profile. */
  policies: string[];
};

export type PartnerService = {
  id: string;
  name: string;
  description: string;
  image: string;
  startingPrice: number;
  basePrice: number;
  unit: string;
  deliveryEta: string;
  available: boolean;
};

export type PartnerFeature = {
  id: string;
  title: string;
  icon: string;
};

export type PartnerReview = {
  id: string;
  partnerId: string;
  name: string;
  initials: string;
  photo: string;
  rating: number;
  text: string;
  date: string;
  images: string[];
};

export type ReviewSummary = {
  average: number;
  total: number;
  breakdown: { star: number; count: number }[];
};

export type PartnerReviewsData = {
  summary: ReviewSummary;
  reviews: PartnerReview[];
};

export type GalleryImage = {
  id: string;
  image: string;
  caption: string;
};

export type PriceRow = {
  id: string;
  service: string;
  unit: string;
  price: number;
};

export type PartnerDetailData = {
  partner: PartnerProfile;
  services: PartnerService[];
  features: PartnerFeature[];
  reviews: PartnerReview[];
  reviewSummary: ReviewSummary;
  gallery: GalleryImage[];
  priceList: PriceRow[];
};

export type PartnerDetailResult = {
  data: PartnerDetailData;
  /** True when the payload came from cache because the network failed. */
  fromCache: boolean;
};

export type FetchOptions = {
  signal?: AbortSignal | undefined;
  /** Skip the fresh-cache shortcut and always hit the network. */
  forceRefresh?: boolean | undefined;
};

/** GET /api/partners/{id} — profile, services, reviews, gallery, price list. */
export async function fetchPartnerDetail(
  partnerId: string,
  options: FetchOptions = {},
): Promise<PartnerDetailResult> {
  if (!options.forceRefresh) {
    const cached = readScopedCache<PartnerDetailData>("partner-detail", partnerId);
    if (cached) {
      // Refresh in the background so the next visit is up to date.
      void revalidatePartnerDetail(partnerId);
      return { data: cached, fromCache: true };
    }
  }

  try {
    const data = await apiGetJson<PartnerDetailData>(
      `/api/partners/${encodeURIComponent(partnerId)}`,
      { signal: options.signal },
    );
    writeScopedCache("partner-detail", partnerId, data);
    return { data, fromCache: false };
  } catch (error) {
    const stale = readStaleScopedCache<PartnerDetailData>("partner-detail", partnerId);
    if (stale) return { data: stale, fromCache: true };
    throw error;
  }
}

async function revalidatePartnerDetail(partnerId: string): Promise<void> {
  try {
    const fresh = await apiGetJson<PartnerDetailData>(
      `/api/partners/${encodeURIComponent(partnerId)}`,
    );
    writeScopedCache("partner-detail", partnerId, fresh);
  } catch {
    /* background refresh is best effort */
  }
}

/** GET /api/partners/{id}/services */
export async function fetchPartnerServices(
  partnerId: string,
  options: FetchOptions = {},
): Promise<PartnerService[]> {
  return apiGetJson<PartnerService[]>(
    `/api/partners/${encodeURIComponent(partnerId)}/services`,
    { signal: options.signal },
  );
}

/** GET /api/partners/{id}/reviews */
export async function fetchPartnerReviews(
  partnerId: string,
  options: FetchOptions = {},
): Promise<PartnerReviewsData> {
  if (!options.forceRefresh) {
    const cached = readScopedCache<PartnerReviewsData>("partner-reviews", partnerId);
    if (cached) return cached;
  }
  try {
    const data = await apiGetJson<PartnerReviewsData>(
      `/api/partners/${encodeURIComponent(partnerId)}/reviews`,
      { signal: options.signal },
    );
    writeScopedCache("partner-reviews", partnerId, data);
    return data;
  } catch (error) {
    const stale = readStaleScopedCache<PartnerReviewsData>("partner-reviews", partnerId);
    if (stale) return stale;
    throw error;
  }
}

/** Drop the cached copy of a partner — used by pull to refresh / retry. */
export function invalidatePartnerDetail(partnerId?: string) {
  clearScopedCache("partner-detail", partnerId);
  clearScopedCache("partner-reviews", partnerId);
}

/** POST /api/cart — bulk add the quantities picked on the partner screen. */
export async function postPartnerCart(payload: {
  partnerId: string;
  quantities: Record<string, number>;
}): Promise<{ ok: true }> {
  await apiPostJson<{ ok: true }>("/api/cart", payload);
  return { ok: true };
}
