/**
 * Shared backend client for the Admin console.
 *
 * The admin frontend owns no backend code — every call targets the SAME
 * QuickPress backend used by the customer, partner and rider apps, under the
 * /api/admin/* namespace.
 */

export const ADMIN_API_BASE = "/api/admin";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${ADMIN_API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Admin API ${path} failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

/** Mock latency helper so screens exercise their real loading states. */
export function delay<T>(value: T, ms = 520): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * Named passthrough used by the admin API modules: keeps the call site's
 * endpoint path for traceability while resolving the supplied view-model
 * payload through the same latency helper the screens are built against.
 */
export function mock<T>(path: string, value: T, ms = 520): Promise<T> {
  void path;
  return delay(value, ms);
}
