/**
 * Shared backend client for the Rider app.
 *
 * IMPORTANT: rider-frontend owns NO backend code. Every call below targets the
 * SAME QuickPress backend used by customer-frontend and partner-frontend, only
 * under the /api/rider/* namespace. Swap the mock resolvers in the sibling
 * service modules for `request()` calls once the endpoints are live.
 *
 * Endpoint placeholders:
 *   POST /api/rider/auth
 *   GET  /api/rider/profile
 *   GET  /api/rider/orders
 *   GET  /api/rider/wallet
 *   GET  /api/rider/notifications
 *   POST /api/rider/status
 *   POST /api/rider/location
 */

export const RIDER_API_BASE = "/api/rider";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${RIDER_API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Rider API ${path} failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

/** Mock latency helper so screens exercise their real loading states. */
export function delay<T>(value: T, ms = 520): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
