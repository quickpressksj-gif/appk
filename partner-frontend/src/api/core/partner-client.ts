/**
 * Shared backend client for the Partner app.
 *
 * IMPORTANT: partner-frontend does NOT own any backend code. Every call below
 * targets the SAME QuickPress backend consumed by the customer frontend, only
 * under the /api/partner/* namespace. Swap the mock resolvers in the sibling
 * service modules for `request()` calls once the endpoints are live.
 */

export const PARTNER_API_BASE = "/api/partner";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${PARTNER_API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Partner API ${path} failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

/** Mock latency helper so screens exercise their real loading states. */
export function delay<T>(value: T, ms = 520): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
