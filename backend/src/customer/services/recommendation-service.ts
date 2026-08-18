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
  options: { forceRefresh?: boolean | undefined; signal?: AbortSignal | undefined } = {},
) {
  return resolveResource<PopularService[]>({
    forceRefresh: options.forceRefresh,
    request: () => apiGet<PopularService[]>(API_ENDPOINTS.popular, { signal: options.signal }),
    readCache: () => readCache<PopularService[]>(CACHE_KEYS.popular),
    readStaleCache: () => readStaleCache<PopularService[]>(CACHE_KEYS.popular),
    writeCache: (value) => writeCache(CACHE_KEYS.popular, value),
  });
}

export function fetchRecentOrders(
  options: { forceRefresh?: boolean | undefined; signal?: AbortSignal | undefined } = {},
) {
  return resolveResource<RecentOrder[]>({
    forceRefresh: options.forceRefresh,
    request: () => apiGet<RecentOrder[]>(API_ENDPOINTS.recentOrders, { signal: options.signal }),
    readCache: () => readCache<RecentOrder[]>(CACHE_KEYS.recentOrders),
    readStaleCache: () => readStaleCache<RecentOrder[]>(CACHE_KEYS.recentOrders),
    writeCache: (value) => writeCache(CACHE_KEYS.recentOrders, value),
  });
}
