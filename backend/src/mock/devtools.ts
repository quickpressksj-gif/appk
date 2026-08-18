/**
 * Developer-mode tooling for the QuickPress mock backend.
 *
 * This module powers the Mock Testing Panel:
 *   • dataset statistics (counts + status breakdown)
 *   • reset / reseed of the whole mock database
 *   • order-lifecycle simulation (one step, full lifecycle, or a timed loop)
 *
 * It drives orders through the SAME transition functions the four apps call,
 * so every guard, event and OTP behaves exactly as it would in production —
 * no screen is aware developer mode exists.
 */

import type { Order, OrderLifecycleStatus } from "@shared/types";
import { ORDER_LIFECYCLE, ORDER_STATUS_LABEL } from "@shared/types/order";

import { clearDb, getDb, mutateDb, reseedDb } from "./db";
import type { MockDevState } from "./db";
import { DEFAULT_SEED_CONFIG } from "./factory";
import type { SeedConfig } from "./factory";
import {
  adminAssignRider,
  cancelOrder,
  findOrder,
  partnerAcceptOrder,
  partnerCompleteOrder,
  partnerStartProcessing,
  placeOrder,
  riderDeliverOrder,
  riderDropAtPartner,
  riderPickupOrder,
  riderStartDelivery,
} from "./orders-core";
import type { Account } from "@shared/types";

const MAX_LOG = 40;

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
  seedConfig: SeedConfig;
  customers: number;
  partners: number;
  riders: number;
  orders: number;
  liveOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenue: number;
  statusBreakdown: { status: OrderLifecycleStatus; label: string; count: number }[];
  /** Counts of every other mock collection — never hardcoded, always derived. */
  collections: MockCollectionCounts;
  dev: MockDevState;
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

/* -------------------------------- logging -------------------------------- */

function log(message: string): void {
  mutateDb((db) => {
    db.dev.log = [{ at: new Date().toISOString(), message }, ...db.dev.log].slice(0, MAX_LOG);
  });
}

/* --------------------------------- stats --------------------------------- */

export function mockStats(): MockStats {
  const db = getDb();
  const delivered = db.orders.filter((order) => order.status === "delivered");
  const statuses = [...ORDER_LIFECYCLE, "cancelled" as OrderLifecycleStatus];

  return {
    seedConfig: db.seedConfig,
    customers: db.accounts.filter((account) => account.role === "customer").length,
    partners: db.partners.length,
    riders: db.riders.length,
    orders: db.orders.length,
    liveOrders: db.orders.filter(
      (order) => order.status !== "delivered" && order.status !== "cancelled",
    ).length,
    deliveredOrders: delivered.length,
    cancelledOrders: db.orders.filter((order) => order.status === "cancelled").length,
    revenue: delivered.reduce((sum, order) => sum + order.totals.grandTotal, 0),
    statusBreakdown: statuses.map((status) => ({
      status,
      label: ORDER_STATUS_LABEL[status],
      count: db.orders.filter((order) => order.status === status).length,
    })),
    collections: {
      accounts: db.accounts.length,
      categories: db.categories.length,
      services: db.services.length,
      banners: db.banners.length,
      offers: db.offers.length,
      coupons: db.coupons.length,
      cities: db.cities.length,
      staff: db.staff.length,
      addresses: db.addresses.length,
      wallets: db.wallets.length,
      transactions: db.transactions.length,
      notifications: db.notifications.length,
      reviews: db.reviews.length,
      supportTickets: db.supportTickets.length,
      carts: db.carts.length,
    },
    dev: db.dev,
  };
}

function toRow(order: Order): DevOrderRow {
  return {
    id: order.id,
    code: order.code,
    status: order.status,
    statusLabel: ORDER_STATUS_LABEL[order.status],
    customer: order.customer.name,
    partner: order.partner.name,
    rider: order.rider?.name ?? null,
    total: order.totals.grandTotal,
    updatedAt: order.updatedAt,
  };
}

export function devOrders(filter: { status?: string | undefined; limit?: number } = {}): DevOrderRow[] {
  const rows = getDb()
    .orders.filter((order) => !filter.status || filter.status === "all" || order.status === filter.status)
    .slice()
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .map(toRow);
  return filter.limit ? rows.slice(0, filter.limit) : rows;
}

/* ----------------------------- seed controls ----------------------------- */

export function devReset(): MockStats {
  clearDb();
  log("Mock database reset — all test data removed");
  return mockStats();
}

export function devReseed(config: Partial<SeedConfig> = {}): MockStats {
  const merged = { ...DEFAULT_SEED_CONFIG, ...config };
  reseedDb(merged);
  log(
    `Reseeded: ${merged.customers} customers · ${merged.partners} partners · ${merged.riders} riders · ${merged.orders} orders`,
  );
  return mockStats();
}

/* --------------------------- lifecycle simulation ------------------------ */

const TERMINAL: OrderLifecycleStatus[] = ["delivered", "cancelled"];

function step(order: Order): Order | null {
  switch (order.status) {
    case "placed":
      return partnerAcceptOrder(order.id);
    case "partner_accepted": {
      const rider =
        getDb().riders.find((item) => item.isOnline && item.status === "active") ?? getDb().riders[0];
      return rider ? adminAssignRider(order.id, rider.id) : null;
    }
    case "rider_assigned":
      return riderPickupOrder(order.id);
    case "picked_up":
      return riderDropAtPartner(order.id);
    case "at_partner":
      return partnerStartProcessing(order.id);
    case "processing":
      return partnerCompleteOrder(order.id);
    case "completed":
      return riderStartDelivery(order.id);
    case "out_for_delivery":
      return riderDeliverOrder(order.id);
    default:
      return null;
  }
}

/** Move one order exactly one step forward. */
export function devAdvanceOrder(orderId: string): DevOrderRow {
  const order = findOrder(orderId);
  const before = order.status;
  const next = step(order);
  if (!next) {
    log(`${order.code} is already ${ORDER_STATUS_LABEL[before]} — nothing to advance`);
    return toRow(order);
  }
  log(`${next.code}: ${ORDER_STATUS_LABEL[before]} → ${ORDER_STATUS_LABEL[next.status]}`);
  return toRow(next);
}

/** Run one order all the way to "delivered". */
export function devCompleteOrder(orderId: string): DevOrderRow {
  let order = findOrder(orderId);
  let guard = 0;
  while (!TERMINAL.includes(order.status) && guard < 12) {
    const next = step(order);
    if (!next) break;
    order = next;
    guard += 1;
  }
  log(`${order.code} simulated to ${ORDER_STATUS_LABEL[order.status]}`);
  return toRow(order);
}

export function devCancelOrder(orderId: string, reason = "Cancelled from testing panel"): DevOrderRow {
  const order = cancelOrder(orderId, reason, "admin");
  log(`${order.code} cancelled from the testing panel`);
  return toRow(order);
}

/** Advance up to `count` live orders one step each (one simulation tick). */
export function devTick(count = 5): { advanced: number; rows: DevOrderRow[] } {
  const live = getDb()
    .orders.filter((order) => !TERMINAL.includes(order.status))
    .slice(0, count);
  const rows: DevOrderRow[] = [];
  for (const order of live) {
    try {
      rows.push(devAdvanceOrder(order.id));
    } catch {
      /* a guard rejected this transition — keep simulating the rest */
    }
  }
  return { advanced: rows.length, rows };
}

/* ------------------------------ dev mode loop ---------------------------- */

let timer: ReturnType<typeof setInterval> | null = null;

function stopLoop(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

function startLoop(intervalMs: number): void {
  stopLoop();
  if (typeof setInterval === "undefined") return;
  timer = setInterval(() => {
    const dev = getDb().dev;
    if (!dev.enabled || !dev.autoAdvance) {
      stopLoop();
      return;
    }
    devTick(3);
  }, Math.max(intervalMs, 500));
}

export function devState(): MockDevState {
  return getDb().dev;
}

export function setDevState(patch: Partial<MockDevState>): MockDevState {
  const next = mutateDb((db) => {
    db.dev = { ...db.dev, ...patch, log: db.dev.log };
    return db.dev;
  });

  if (next.enabled && next.autoAdvance) startLoop(next.intervalMs);
  else stopLoop();

  if (patch.enabled !== undefined) log(`Developer mode ${next.enabled ? "enabled" : "disabled"}`);
  if (patch.autoAdvance !== undefined) {
    log(`Lifecycle simulation ${next.autoAdvance ? "started" : "stopped"}`);
  }
  return next;
}

export function clearDevLog(): MockDevState {
  return mutateDb((db) => {
    db.dev.log = [];
    return db.dev;
  });
}

/* ------------------------------ generators -------------------------------- */
/* Incrementally add fresh test data on top of whatever is already loaded,   */
/* without touching existing records — unlike `devReseed`, which rebuilds     */
/* the whole dataset from scratch.                                           */

const GEN_FIRST_NAMES = [
  "Advait", "Zoya", "Reyansh", "Myra", "Kian", "Anaya", "Vihaan", "Ira",
  "Shaurya", "Aadhya", "Ayaan", "Navya", "Krish", "Saanvi", "Arnav", "Kiara",
];
const GEN_LAST_NAMES = ["Malhotra", "Bhatt", "Menon", "Pillai", "Kulkarni", "Trivedi", "Chauhan", "Saxena"];
const GEN_STORE_PREFIX = ["Nova", "Aqua", "Silverline", "Everclean", "Rapid", "Golden"];
const GEN_STORE_SUFFIX = ["Wash House", "Laundry Point", "Fabric Care", "Dry Cleaners"];
const GEN_VEHICLES = ["Honda Activa", "TVS Jupiter", "Bajaj Chetak", "Hero Splendor"];
const GEN_CITIES = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune"];

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 9999)}`;
}

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

function genInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function genPhone(): string {
  let digits = String(6 + Math.floor(Math.random() * 4));
  for (let index = 0; index < 9; index += 1) digits += String(Math.floor(Math.random() * 10));
  return digits;
}

/** Generate N fresh customer accounts (with a starter wallet each). */
export function devGenerateCustomers(count = 5): MockStats {
  mutateDb((db) => {
    for (let index = 0; index < count; index += 1) {
      const name = `${pick(GEN_FIRST_NAMES)} ${pick(GEN_LAST_NAMES)}`;
      const id = genId("cus");
      const account: Account = {
        id,
        role: "customer",
        name,
        phone: genPhone(),
        email: `${name.split(" ")[0]!.toLowerCase()}.${id}@quickpress.test`,
        city: pick(GEN_CITIES),
        avatarInitials: genInitials(name),
        isOnboarded: true,
        isVerified: true,
      };
      db.accounts.push(account);
      db.wallets.push({
        accountId: id,
        balance: 0,
        cashbackBalance: 0,
        rewardPoints: 0,
        referralCode: `${name.split(" ")[0]!.toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
        referralEarned: 0,
      });
    }
  });
  log(`Generated ${count} test customers`);
  return mockStats();
}

/** Generate N fresh partner stores (account + partner record + wallet). */
export function devGeneratePartners(count = 5): MockStats {
  mutateDb((db) => {
    for (let index = 0; index < count; index += 1) {
      const id = genId("prt");
      const name = `${pick(GEN_STORE_PREFIX)} ${pick(GEN_STORE_SUFFIX)}`;
      const city = pick(GEN_CITIES);
      const phone = genPhone();
      db.partners.push({
        id,
        accountId: id,
        name,
        ownerName: `${pick(GEN_FIRST_NAMES)} ${pick(GEN_LAST_NAMES)}`,
        phone,
        image: db.partners[0]?.image ?? "",
        city,
        area: "New Area",
        rating: Number((3.8 + Math.random() * 1.2).toFixed(1)),
        totalOrders: 0,
        isOpen: true,
        acceptingNewOrders: true,
        autoAccept: false,
        joinedOn: new Date().toISOString().slice(0, 10),
        status: "active",
        services: db.services.slice(0, 3).map((service) => ({
          id: service.id,
          name: service.name,
          unit: service.unit,
          price: service.price,
          enabled: true,
        })),
      });
      db.accounts.push({
        id,
        role: "partner",
        name,
        phone,
        email: `${id}@quickpress.test`,
        city,
        avatarInitials: genInitials(name),
        isOnboarded: true,
        isVerified: true,
        linkedId: id,
      });
      db.wallets.push({
        accountId: id,
        balance: 0,
        cashbackBalance: 0,
        rewardPoints: 0,
        referralCode: `PRT${Math.floor(100 + Math.random() * 900)}`,
        referralEarned: 0,
      });
    }
  });
  log(`Generated ${count} test partners`);
  return mockStats();
}

/** Generate N fresh riders (account + rider record + wallet). */
export function devGenerateRiders(count = 5): MockStats {
  mutateDb((db) => {
    for (let index = 0; index < count; index += 1) {
      const id = genId("rdr");
      const name = `${pick(GEN_FIRST_NAMES)} ${pick(GEN_LAST_NAMES)}`;
      const city = pick(GEN_CITIES);
      const phone = genPhone();
      db.riders.push({
        id,
        accountId: id,
        name,
        phone,
        city,
        vehicle: pick(GEN_VEHICLES),
        plate: `KA ${Math.floor(1 + Math.random() * 60)} XY ${Math.floor(1000 + Math.random() * 9000)}`,
        rating: Number((3.8 + Math.random() * 1.2).toFixed(1)),
        trips: 0,
        isOnline: true,
        status: "active",
        joinedOn: new Date().toISOString().slice(0, 10),
      });
      db.accounts.push({
        id,
        role: "rider",
        name,
        phone,
        email: `${id}@quickpress.test`,
        city,
        avatarInitials: genInitials(name),
        isOnboarded: true,
        isVerified: true,
        linkedId: id,
      });
      db.wallets.push({
        accountId: id,
        balance: 0,
        cashbackBalance: 0,
        rewardPoints: 0,
        referralCode: `RDR${Math.floor(100 + Math.random() * 900)}`,
        referralEarned: 0,
      });
    }
  });
  log(`Generated ${count} test riders`);
  return mockStats();
}

/** Generate N fresh orders via the real `placeOrder` lifecycle entrypoint. */
export function devGenerateOrders(count = 5): DevOrderRow[] {
  const rows: DevOrderRow[] = [];
  for (let index = 0; index < count; index += 1) {
    const db = getDb();
    const customer = db.accounts.filter((account) => account.role === "customer")[
      Math.floor(Math.random() * Math.max(db.accounts.filter((a) => a.role === "customer").length, 1))
    ];
    const partner = db.partners[Math.floor(Math.random() * Math.max(db.partners.length, 1))];
    if (!customer || !partner) break;
    const service = partner.services[0] ?? { id: "svc-wash-fold", name: "Wash & Fold", price: 79 };
    const qty = 1 + Math.floor(Math.random() * 5);
    const order = placeOrder({
      customerId: customer.id,
      partnerId: partner.id,
      serviceLabel: service.name,
      items: [{ id: `line-1-${service.id}`, name: service.name, qty, price: service.price }],
      pickup: { date: "Today", slot: "6:00 PM - 8:00 PM", express: false },
      payment: { mode: Math.random() > 0.5 ? "online" : "cod", label: "UPI · Google Pay" },
    });
    rows.push(toRow(order));
  }
  log(`Generated ${rows.length} test orders`);
  return rows;
}

/** Empty the mock backend completely (distinct from `devReset`, which restores the default seed). */
export function devClear(): MockStats {
  clearDb();
  log("Mock database cleared — all data removed, nothing reseeded");
  return mockStats();
}

/** Advance every live (non-terminal) order exactly one step. */
export function devAdvanceAllLive(): { advanced: number; rows: DevOrderRow[] } {
  const liveCount = getDb().orders.filter((order) => !TERMINAL.includes(order.status)).length;
  const result = devTick(liveCount);
  log(`Advanced all ${result.advanced} live orders one step`);
  return result;
}

/** Push a synthetic notification to a role's first (or given) account. */
export function devSimulateNotification(input: {
  role: "customer" | "partner" | "rider" | "admin";
  kind?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  accountId?: string | undefined;
}): { id: string; role: string; title: string } {
  const role = input.role;
  const account =
    getDb().accounts.find((item) => item.id === input.accountId) ??
    getDb().accounts.find((item) => item.role === role);
  if (!account) throw new Error(`No ${role} account exists — seed the database first`);

  const title = input.title?.trim() || "Test notification";
  const description = input.description?.trim() || `Simulated ${role} notification`;
  const id = `ntf-sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  mutateDb((db) => {
    db.notifications.unshift({
      id,
      accountId: account.id,
      role,
      kind: (input.kind ?? "system") as never,
      title,
      description,
      createdAt: new Date().toISOString(),
      read: false,
    });
  });
  log(`Notification sent to ${role} ${account.name ?? account.id}: ${title}`);
  return { id, role, title };
}
