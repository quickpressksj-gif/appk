/**
 * Partner Service — GET /api/partners/nearby
 *
 * Nearby laundry partners for the Home list. Accepts the resolved location so
 * the backend can rank by distance.
 */

import { API_ENDPOINTS } from "../api/config";
import { CACHE_KEYS, readCache, readStaleCache, writeCache } from "../api/cache";
import { apiGet, resolveResource } from "../api/http-client";
import type { Partner } from "../home-api";
import type { SavedLocation } from "../location";

export type { Partner };

export type NearbyPartnerQuery = {
  location?: SavedLocation | null | undefined;
  limit?: number | undefined;
  forceRefresh?: boolean | undefined;
  signal?: AbortSignal | undefined;
};

export function fetchNearbyPartners(query: NearbyPartnerQuery = {}) {
  return resolveResource<Partner[]>({
    forceRefresh: query.forceRefresh,
    request: () =>
      apiGet<Partner[]>(API_ENDPOINTS.nearbyPartners, {
        signal: query.signal,
        params: {
          lat: query.location?.latitude ?? undefined,
          lng: query.location?.longitude ?? undefined,
          city: query.location?.city ?? undefined,
          area: query.location?.area ?? undefined,
          limit: query.limit ?? 10,
        },
      }),
    readCache: () => readCache<Partner[]>(CACHE_KEYS.partners),
    readStaleCache: () => readStaleCache<Partner[]>(CACHE_KEYS.partners),
    writeCache: (value) => writeCache(CACHE_KEYS.partners, value),
  });
}
