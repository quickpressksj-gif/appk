/**
 * HTTP client for the QuickPress customer app.
 *
 * Thin, typed wrapper around the shared transport (`@backend/core/transport`)
 * so every Home Screen service goes through the same request path as every
 * other QuickPress app: mock router in mock mode, real FastAPI once
 * VITE_API_BASE_URL is set. It intentionally contains no business logic and
 * no data.
 */

import { apiGetJson, type QueryParams as TransportQueryParams } from "../../core/transport";
import { ApiError } from "../../core/errors";

export { ApiError };
export type { ApiErrorKind } from "../../core/errors";

export type QueryParams = TransportQueryParams;

export type RequestOptions = {
  params?: QueryParams | undefined;
  signal?: AbortSignal | undefined;
  headers?: Record<string, string> | undefined;
  timeoutMs?: number | undefined;
};

export async function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return apiGetJson<T>(path, {
    params: options.params,
    signal: options.signal,
    headers: options.headers,
    timeoutMs: options.timeoutMs,
  });
}

/**
 * Shared service helper: cache-first read, live fetch, graceful fallback.
 *
 * `fallback` is only used when the request fails and no cache exists at all
 * (e.g. the device is offline on a cold start). Once the mock/live backend
 * answers, its response always wins.
 */
export async function resolveResource<T>(options: {
  request: () => Promise<T>;
  readCache: () => T | null;
  readStaleCache: () => T | null;
  writeCache: (value: T) => void;
  fallback?: (() => T) | undefined;
  forceRefresh?: boolean | undefined;
}): Promise<T> {
  if (!options.forceRefresh) {
    const cached = options.readCache();
    if (cached !== null) return cached;
  }

  try {
    const fresh = await options.request();
    options.writeCache(fresh);
    return fresh;
  } catch (error) {
    const stale = options.readStaleCache();
    if (stale !== null) return stale;
    if (options.fallback) return options.fallback();
    throw error;
  }
}
