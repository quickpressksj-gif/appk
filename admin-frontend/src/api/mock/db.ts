/**
 * In-memory mock database for QuickPress.
 *
 * This is the ONLY place mock state lives. Every application talks to it
 * through the mock HTTP router (`mock/server.ts`) — never directly — so the
 * whole thing can be deleted the day the FastAPI backend goes live.
 *
 * Persistence: the snapshot is mirrored into localStorage and broadcast over a
 * BroadcastChannel, so several QuickPress apps open in the same browser share
 * one dataset and see each other's lifecycle transitions live.
 */

import type {
  Account,
  AddressEntity,
  AuthSession,
  BannerEntity,
  CartItemEntity,
  PaymentMethodEntity,
  CategoryEntity,
  CityEntity,
  CouponEntity,
  NotificationEntity,
  OfferEntity,
  Order,
  PlatformSettingsEntity,
  ReviewEntity,
  ServiceEntity,
  StaffEntity,
  SupportTicketEntity,
  TransactionEntity,
  WalletEntity,
} from "@/shared/types";

import { DEFAULT_SEED_CONFIG, emptyDataset, generateDataset } from "./factory";
import type { SeedConfig } from "./factory";
import type { MockPartner, MockRider } from "./seed";

export type MockDevState = {
  /** Developer mode master switch (no visual change to any app screen). */
  enabled: boolean;
  /** Auto-advance live orders through the lifecycle on a timer. */
  autoAdvance: boolean;
  /** Tick interval for auto-advance, in milliseconds. */
  intervalMs: number;
  /** Most recent simulation entries, newest first. */
  log: { at: string; message: string }[];
};

export type MockDb = {
  version: number;
  accounts: Account[];
  partners: MockPartner[];
  riders: MockRider[];
  orders: Order[];
  sessions: Record<string, AuthSession>;
  otps: Record<string, { code: string; expiresAt: number; role: string }>;
  counters: { order: number };
  categories: CategoryEntity[];
  services: ServiceEntity[];
  banners: BannerEntity[];
  offers: OfferEntity[];
  coupons: CouponEntity[];
  cities: CityEntity[];
  settings: PlatformSettingsEntity;
  staff: StaffEntity[];
  addresses: AddressEntity[];
  wallets: WalletEntity[];
  transactions: TransactionEntity[];
  notifications: NotificationEntity[];
  reviews: ReviewEntity[];
  supportTickets: SupportTicketEntity[];
  carts: CartItemEntity[];
  paymentMethods: PaymentMethodEntity[];
  /** Config the current dataset was generated from. */
  seedConfig: SeedConfig;
  dev: MockDevState;
};

const STORAGE_KEY = "quickpress.mock.db.v4";
const CHANNEL_NAME = "quickpress.mock.db";
const DB_VERSION = 4;

export const DEFAULT_DEV_STATE: MockDevState = {
  enabled: false,
  autoAdvance: false,
  intervalMs: 4000,
  log: [],
};

function dbFromDataset(dataset: ReturnType<typeof generateDataset>, config: SeedConfig): MockDb {
  return {
    version: DB_VERSION,
    accounts: dataset.accounts,
    partners: dataset.partners,
    riders: dataset.riders,
    orders: dataset.orders,
    sessions: {},
    otps: {},
    counters: { order: dataset.orders.length + 1 },
    categories: dataset.categories,
    services: dataset.services,
    banners: dataset.banners,
    offers: dataset.offers,
    coupons: dataset.coupons,
    cities: dataset.cities,
    settings: dataset.settings,
    staff: dataset.staff,
    addresses: dataset.addresses,
    wallets: dataset.wallets,
    transactions: dataset.transactions,
    notifications: dataset.notifications,
    reviews: dataset.reviews,
    supportTickets: dataset.supportTickets,
    carts: dataset.carts,
    paymentMethods: dataset.paymentMethods,
    seedConfig: config,
    dev: structuredClone(DEFAULT_DEV_STATE),
  };
}

function freshDb(): MockDb {
  return dbFromDataset(generateDataset(DEFAULT_SEED_CONFIG), DEFAULT_SEED_CONFIG);
}

let db: MockDb | null = null;
let channel: BroadcastChannel | null = null;
const listeners = new Set<() => void>();

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readSnapshot(): MockDb | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MockDb;
    if (parsed.version !== DB_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSnapshot(next: MockDb, broadcast: boolean): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota or private mode — mock keeps working in memory */
  }
  if (broadcast) ensureChannel()?.postMessage({ type: "changed" });
}

function ensureChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (channel) return channel;
  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.addEventListener("message", () => {
    const snapshot = readSnapshot();
    if (snapshot) db = snapshot;
    for (const listener of listeners) listener();
  });
  return channel;
}

/** Read the live database. Always returns the same mutable object. */
export function getDb(): MockDb {
  if (!db) {
    db = readSnapshot() ?? freshDb();
    writeSnapshot(db, false);
    ensureChannel();
  }
  return db;
}

/**
 * Mutate the database. The callback receives the live object; the snapshot is
 * persisted and every subscriber (this tab and sibling apps) is notified.
 */
export function mutateDb<T>(mutator: (current: MockDb) => T): T {
  const current = getDb();
  const result = mutator(current);
  current.version = DB_VERSION;
  writeSnapshot(current, true);
  for (const listener of listeners) listener();
  return result;
}

/** Subscribe to any mock backend change (used for live order updates). */
export function subscribeDb(listener: () => void): () => void {
  listeners.add(listener);
  ensureChannel();
  return () => {
    listeners.delete(listener);
  };
}

/** Wipe the mock backend back to its default seeded state. */
export function resetDb(): MockDb {
  db = freshDb();
  writeSnapshot(db, true);
  for (const listener of listeners) listener();
  return db;
}

/** Empty the mock backend completely (no customers, partners, riders, orders). */
export function clearDb(): MockDb {
  db = dbFromDataset(emptyDataset() as ReturnType<typeof generateDataset>, {
    ...DEFAULT_SEED_CONFIG,
    customers: 0,
    partners: 0,
    riders: 0,
    orders: 0,
  });
  writeSnapshot(db, true);
  for (const listener of listeners) listener();
  return db;
}

/** Regenerate the whole dataset from a seed config (keeps nobody signed in). */
export function reseedDb(config: Partial<SeedConfig> = {}): MockDb {
  const merged: SeedConfig = { ...DEFAULT_SEED_CONFIG, ...config };
  db = dbFromDataset(generateDataset(merged), merged);
  writeSnapshot(db, true);
  for (const listener of listeners) listener();
  return db;
}


export function nextOrderNumber(): number {
  return mutateDb((current) => {
    current.counters.order += 1;
    return current.counters.order;
  });
}