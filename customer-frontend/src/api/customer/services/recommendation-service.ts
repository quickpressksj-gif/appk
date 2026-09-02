/**
 * Recommendation Service — GET /api/recommendations and GET /api/orders/recent
 *
 * Feeds the "Recommended for you" rail and the recent-orders strip on Home.
 */

import { API_ENDPOINTS } from "../api/config";
import { CACHE_KEYS, readCache, readStaleCache, writeCache } from "../api/cache";
import { apiGet, resolveResource } from "../api/http-client";
import type { PopularService, RecentOrder, Recommendation } from "../home-api";

export type { PopularService, RecentOrder, Recommendation };

export function fetchRecommendations(
  options: { forceRefresh?: boolean | undefined; signal?: AbortSignal | undefined } = {},
) {
  return resolveResource<Recommendation[]>({
    forceRefresh: options.forceRefresh,
    request: () =>
      apiGet<Recommendation[]>(API_ENDPOINTS.recommendations, { signal: options.signal }),
    readCache: () => readCache<Recommendation[]>(CACHE_KEYS.recommendations),
    readStaleCache: () => readStaleCache<Recommendation[]>(CACHE_KEYS.recommendations),
    writeCache: (value) => writeCache(CACHE_KEYS.recommendations, value),
  });
}

export function fetchPopularServices(
  options: {
    forceRefresh?: boolean | undefined;
    signal?: AbortSignal | undefined;
    location?: { city?: string; area?: string; latitude?: number; longitude?: number } | null | undefined;
  } = {},
) {
  const params = new URLSearchParams();
  if (options.location?.city) params.set("city", options.location.city);
  if (options.location?.area) params.set("area", options.location.area);
  if (options.location?.latitude) params.set("lat", String(options.location.latitude));
  if (options.location?.longitude) params.set("lng", String(options.location.longitude));
  const queryString = params.toString();
  const url = queryString ? `${API_ENDPOINTS.popular}?${queryString}` : API_ENDPOINTS.popular;
  const cacheKey = queryString ? `${CACHE_KEYS.popular}:${queryString}` : CACHE_KEYS.popular;

  return resolveResource<PopularService[]>({
    forceRefresh: options.forceRefresh,
    request: () => apiGet<PopularService[]>(url, { signal: options.signal }),
    readCache: () => readCache<PopularService[]>(cacheKey),
    readStaleCache: () => readStaleCache<PopularService[]>(cacheKey),
    writeCache: (value) => writeCache(cacheKey, value),
  });
}

import { readToken } from "@/api/core/session-store";

export function fetchRecentOrders(
  options: { forceRefresh?: boolean | undefined; signal?: AbortSignal | undefined } = {},
) {
  const token = readToken();
  if (!token) {
    return Promise.resolve([] as RecentOrder[]);
  }
  return resolveResource<RecentOrder[]>({
    forceRefresh: options.forceRefresh,
    request: () => apiGet<RecentOrder[]>(API_ENDPOINTS.recentOrders, { signal: options.signal }),
    readCache: () => readCache<RecentOrder[]>(CACHE_KEYS.recentOrders),
    readStaleCache: () => readStaleCache<RecentOrder[]>(CACHE_KEYS.recentOrders),
    writeCache: (value) => writeCache(CACHE_KEYS.recentOrders, value),
  });
}
