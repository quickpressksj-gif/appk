/**
 * Mock Testing Panel data layer.
 *
 * Same contract as every other QuickPress API module: the panel only talks to
 * these functions, which go through the shared transport. The endpoints exist
 * in mock mode only — developer tooling never reaches the real backend.
 */

import type { OrderLifecycleStatus } from "@shared/types";

import { apiGetJson, apiPostJson, transportMode } from "../core/transport";
import { activeSessionRole, configureSessionRole } from "../core/session-store";

export const DEV_API_ENDPOINTS = {
  stats: "/api/dev/stats",
  orders: "/api/dev/orders",
  reset: "/api/dev/reset",
  clear: "/api/dev/clear",
  seed: "/api/dev/seed",
  mode: "/api/dev/mode",
  clearLog: "/api/dev/log/clear",
  tick: "/api/dev/tick",
  advanceAllLive: "/api/dev/orders/advance-all",
  advance: "/api/dev/orders/{id}/advance",
  complete: "/api/dev/orders/{id}/complete",
  cancel: "/api/dev/orders/{id}/cancel",
  generateCustomers: "/api/dev/generate/customers",
  generatePartners: "/api/dev/generate/partners",
  generateRiders: "/api/dev/generate/riders",
  generateOrders: "/api/dev/generate/orders",
  simulateNotification: "/api/dev/notifications/simulate",
} as const;

export type SeedConfigInput = {
  customers: number;
  partners: number;
  riders: number;
  orders: number;
  seed: number;
};

export type DevModeState = {
  enabled: boolean;
  autoAdvance: boolean;
  intervalMs: number;
  log: { at: string; message: string }[];
};

export type MockCollectionCounts = {
  accounts: number;
  categories: number;
  services: number;
  banners: number;
  offers: number;
  coupons: number;
  cities: number;
  staff: number;
  addresses: number;
  wallets: number;
  transactions: number;
  notifications: number;
  reviews: number;
  supportTickets: number;
  carts: number;
};

export type MockStats = {
  seedConfig: SeedConfigInput;
  customers: number;
  partners: number;
  riders: number;
  orders: number;
  liveOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenue: number;
  statusBreakdown: { status: OrderLifecycleStatus; label: string; count: number }[];
  collections: MockCollectionCounts;
  dev: DevModeState;
};

export type DevOrderRow = {
  id: string;
  code: string;
  status: OrderLifecycleStatus;
  statusLabel: string;
  customer: string;
  partner: string;
  rider: string | null;
  total: number;
  updatedAt: string;
};

export const DEFAULT_SEED_INPUT: SeedConfigInput = {
  customers: 20,
  partners: 10,
  riders: 15,
  orders: 100,
  seed: 2026,
};

/** Developer tooling only works while the app runs on the mock backend. */
export function isDevToolingAvailable(): boolean {
  return transportMode() === "mock";
}

export const fetchMockStats = () => apiGetJson<MockStats>(DEV_API_ENDPOINTS.stats);

export const fetchDevOrders = (status = "all", limit = 25) =>
  apiGetJson<DevOrderRow[]>(DEV_API_ENDPOINTS.orders, { params: { status, limit } });

export const resetMockDatabase = () => apiPostJson<MockStats>(DEV_API_ENDPOINTS.reset, {});

export const reseedMockDatabase = (config: Partial<SeedConfigInput>) =>
  apiPostJson<MockStats>(DEV_API_ENDPOINTS.seed, config);

export const setDevMode = (patch: Partial<Omit<DevModeState, "log">>) =>
  apiPostJson<DevModeState>(DEV_API_ENDPOINTS.mode, patch);

export const clearDevModeLog = () => apiPostJson<DevModeState>(DEV_API_ENDPOINTS.clearLog, {});

export const simulateTick = (count = 3) =>
  apiPostJson<{ advanced: number; rows: DevOrderRow[] }>(DEV_API_ENDPOINTS.tick, { count });

export const advanceOrderStep = (orderId: string) =>
  apiPostJson<DevOrderRow>(DEV_API_ENDPOINTS.advance.replace("{id}", orderId), {});

export const runOrderLifecycle = (orderId: string) =>
  apiPostJson<DevOrderRow>(DEV_API_ENDPOINTS.complete.replace("{id}", orderId), {});

export const cancelOrderFromPanel = (orderId: string, reason?: string) =>
  apiPostJson<DevOrderRow>(DEV_API_ENDPOINTS.cancel.replace("{id}", orderId), { reason });

export const resetMockDatabaseHard = () => apiPostJson<MockStats>(DEV_API_ENDPOINTS.clear, {});

export const advanceAllLiveOrders = () =>
  apiPostJson<{ advanced: number; rows: DevOrderRow[] }>(DEV_API_ENDPOINTS.advanceAllLive, {});

export const generateTestCustomers = (count = 5) =>
  apiPostJson<MockStats>(DEV_API_ENDPOINTS.generateCustomers, { count });

export const generateTestPartners = (count = 5) =>
  apiPostJson<MockStats>(DEV_API_ENDPOINTS.generatePartners, { count });

export const generateTestRiders = (count = 5) =>
  apiPostJson<MockStats>(DEV_API_ENDPOINTS.generateRiders, { count });

export const generateTestOrders = (count = 5) =>
  apiPostJson<DevOrderRow[]>(DEV_API_ENDPOINTS.generateOrders, { count });

/* ------------------------------ role switch ------------------------------ */

export const DEV_ROLES = ["customer", "partner", "rider", "admin"] as const;
export type DevRole = (typeof DEV_ROLES)[number];

const ROLE_STORAGE_KEY = "quickpress.dev.role";
const roleListeners = new Set<() => void>();

/** The role the shared transport currently authenticates as. */
export function currentDevRole(): DevRole {
  return activeSessionRole() as DevRole;
}

/**
 * Switch the active role for every subsequent API call. All four apps read
 * their session through the same store, so this is the only switch needed.
 */
export function switchDevRole(role: DevRole): DevRole {
  configureSessionRole(role);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(ROLE_STORAGE_KEY, role);
    } catch {
      /* ignore */
    }
  }
  for (const listener of roleListeners) listener();
  return role;
}

export function subscribeDevRole(listener: () => void): () => void {
  roleListeners.add(listener);
  return () => {
    roleListeners.delete(listener);
  };
}

/* -------------------------- notification simulator ------------------------ */

export type SimulatedNotificationInput = {
  role: DevRole;
  kind?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
};

export const simulateNotification = (input: SimulatedNotificationInput) =>
  apiPostJson<{ id: string; role: string; title: string }>(
    DEV_API_ENDPOINTS.simulateNotification,
    input,
  );

/* ------------------------------ API inspector ----------------------------- */

export {
  apiInspectorEntries,
  clearApiInspector,
  subscribeApiInspector,
  type ApiInspectorEntry,
} from "../core/api-inspector";
