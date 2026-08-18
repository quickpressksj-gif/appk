/**
 * Banner Service — GET /api/banners
 *
 * Returns slider banners ordered by priority. The Home carousel renders
 * whatever this service returns, including an empty list.
 */

import { API_ENDPOINTS } from "../api/config";
import { CACHE_KEYS, readCache, readStaleCache, writeCache } from "../api/cache";
import { apiGet, resolveResource } from "../api/http-client";
import type { Banner } from "../home-api";

export type { Banner };

function byPriority(banners: Banner[]): Banner[] {
  return [...banners].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
}

export function fetchBanners(options: { forceRefresh?: boolean | undefined; signal?: AbortSignal | undefined } = {}) {
  return resolveResource<Banner[]>({
    forceRefresh: options.forceRefresh,
    request: async () =>
      byPriority(await apiGet<Banner[]>(API_ENDPOINTS.banners, { signal: options.signal })),
    readCache: () => readCache<Banner[]>(CACHE_KEYS.banners),
    readStaleCache: () => readStaleCache<Banner[]>(CACHE_KEYS.banners),
    writeCache: (value) => writeCache(CACHE_KEYS.banners, value),
  });
}
