/**
 * HTTP client for the QuickPress customer app.
 *
 * Thin, typed wrapper around the shared transport (`@backend/core/transport`)
 * so every Home Screen service goes through the same request path as every
 * other QuickPress app: mock router in mock mode, real FastAPI once
 * VITE_API_BASE_URL is set. It intentionally contains no business logic and
 * no data.
 */

import { apiGetJson, apiPostJson, type QueryParams as TransportQueryParams } from "../../core/transport";
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

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  return apiPostJson<T>(path, body, {
    params: options.params,
    signal: options.signal,
    headers: options.headers,
    timeoutMs: options.timeoutMs,
  });
}

/**
 * Shared service helper: cache-first read, live fetch, strict error propagation.
 *
 * ZERO MOCK / ZERO FALLBACK POLICY:
 * When the live backend request fails and no valid cache exists, it strictly
 * throws the ApiError so the UI presents the proper Error / Retry state.
 */
export async function resolveResource<T>(options: {
  request: () => Promise<T>;
  readCache: () => T | null;
  readStaleCache: () => T | null;
  writeCache: (value: T) => void;
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
    throw error;
  }
}
