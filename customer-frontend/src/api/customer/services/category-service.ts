/**
 * Category Service — GET /api/categories
 *
 * Active service categories for the Home grid, ordered by sortOrder.
 */

import { API_ENDPOINTS } from "../api/config";
import { CACHE_KEYS, readCache, readStaleCache, writeCache } from "../api/cache";
import { apiGet, resolveResource } from "../api/http-client";
import type { Category } from "../home-api";

export type { Category };

function normalise(categories: Category[]): Category[] {
  return [...categories]
    .filter((category) => category.status !== "inactive")
    .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
}

export function fetchCategories(options: { forceRefresh?: boolean | undefined; signal?: AbortSignal | undefined } = {}) {
  return resolveResource<Category[]>({
    forceRefresh: options.forceRefresh,
    request: async () =>
      normalise(await apiGet<Category[]>(API_ENDPOINTS.categories, { signal: options.signal })),
    readCache: () => readCache<Category[]>(CACHE_KEYS.categories),
    readStaleCache: () => readStaleCache<Category[]>(CACHE_KEYS.categories),
    writeCache: (value) => writeCache(CACHE_KEYS.categories, value),
  });
}
