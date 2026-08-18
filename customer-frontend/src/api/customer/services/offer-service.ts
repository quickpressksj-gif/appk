/**
 * Offer Service — GET /api/offers
 *
 * Coupons for the Home offers rail: code, discount, expiry and banner.
 */

import { API_ENDPOINTS } from "../api/config";
import { CACHE_KEYS, readCache, readStaleCache, writeCache } from "../api/cache";
import { apiGet, resolveResource } from "../api/http-client";
import type { Offer } from "../home-api";

export type { Offer };

/** Drop coupons whose expiry has already passed. */
function active(offers: Offer[]): Offer[] {
  const now = Date.now();
  return offers.filter((offer) => {
    if (!offer.expiresAt) return true;
    const expiry = new Date(offer.expiresAt).getTime();
    return Number.isNaN(expiry) || expiry > now;
  });
}

export function fetchOffers(options: { forceRefresh?: boolean | undefined; signal?: AbortSignal | undefined } = {}) {
  return resolveResource<Offer[]>({
    forceRefresh: options.forceRefresh,
    request: async () => {
      const payload = await apiGet<Offer[] | { offers?: Offer[] }>(API_ENDPOINTS.offers, {
        signal: options.signal,
      });
      const offers = Array.isArray(payload) ? payload : (payload?.offers ?? []);
      return active(offers);
    },
    readCache: () => readCache<Offer[]>(CACHE_KEYS.offers),
    readStaleCache: () => readStaleCache<Offer[]>(CACHE_KEYS.offers),
    writeCache: (value) => writeCache(CACHE_KEYS.offers, value),
  });
}
