/**
 * Deterministic test-data factory for the QuickPress mock backend.
 *
 * `seed.ts` holds the hand-written demo records every app relies on (the demo
 * logins, the three named stores, the first six orders). This factory keeps
 * those records first and then generates the bulk dataset on top of them, so
 * QA gets a realistic volume of customers, partners, riders and orders spread
 * across every lifecycle status — without breaking any demo credential.
 *
 * Everything is generated from a numeric seed, so the same config always
 * produces the exact same dataset (reproducible bug reports).
 */

import store1 from "@shared/assets/store-1.jpg";
import store2 from "@shared/assets/store-2.jpg";
import store3 from "@shared/assets/store-3.jpg";
import type {
  Account,
  Order,
  OrderEvent,
  OrderLifecycleStatus,
  OrderLine,
} from "@shared/types";
import { ORDER_LIFECYCLE, ORDER_STATUS_LABEL } from "@shared/types/order";

import {
  SEED_ACCOUNTS,
  SEED_BANNERS,
  SEED_CART_ITEMS,
  SEED_CATEGORIES,
  SEED_CITIES,
  SEED_COUPONS,
  SEED_OFFERS,
  SEED_ORDERS,
  SEED_PAYMENT_METHODS,
  SEED_PARTNERS,
  SEED_RIDERS,
  SEED_SERVICES,
  SEED_SETTINGS,
  SEED_STAFF,
} from "./seed";
import type { MockPartner, MockRider } from "./seed";
import type {
  AddressEntity,
  BannerEntity,
  CartItemEntity,
  CategoryEntity,
  PaymentMethodEntity,
  CityEntity,
  CouponEntity,
  NotificationEntity,
  OfferEntity,
  PlatformSettingsEntity,
  ReviewEntity,
  ServiceEntity,
  StaffEntity,
  SupportTicketEntity,
  TransactionEntity,
  WalletEntity,
} from "@shared/types";

export type SeedConfig = {
  customers: number;
  partners: number;
  riders: number;
  orders: number;
  /** Same seed ⇒ same dataset. */
  seed: number;
};

export const DEFAULT_SEED_CONFIG: SeedConfig = {
  customers: 20,
  partners: 10,
  riders: 15,
  orders: 100,
  seed: 2026,
};

export type MockDataset = {
  accounts: Account[];
  partners: MockPartner[];
  riders: MockRider[];
  orders: Order[];
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
};

/* ---------------------------- random helpers ---------------------------- */

function rngFrom(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRandom(seed: number) {
  const random = rngFrom(seed);
  return {
    float: () => random(),
    int: (min: number, max: number) => min + Math.floor(random() * (max - min + 1)),
    pick: <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)]!,
    chance: (probability: number) => random() < probability,
  };
}

type Random = ReturnType<typeof makeRandom>;

/* ------------------------------- name pools ------------------------------ */

const FIRST_NAMES = [
  "Aarav", "Meera", "Rohan", "Ananya", "Kabir", "Ishita", "Vivaan", "Diya",
  "Arjun", "Sara", "Nikhil", "Tara", "Aditya", "Kavya", "Rahul", "Neha",
  "Siddharth", "Pooja", "Manav", "Riya", "Yash", "Sneha", "Karan", "Aisha",
  "Dev", "Nandini", "Varun", "Priya", "Imran", "Fatima",
];

const LAST_NAMES = [
  "Sharma", "Iyer", "Nair", "Reddy", "Kapoor", "Mehta", "Chopra", "Bose",
  "Verma", "Khan", "Patel", "Joshi", "Rao", "Gupta", "Singh", "Desai",
];

const STORE_PREFIX = [
  "Sparkle", "FreshFold", "UrbanPress", "CityWash", "BlueTide", "Crisp",
  "PurePress", "LaundroHub", "SnowSoft", "MetroClean", "Bubble", "SteamNest",
];
const STORE_SUFFIX = ["Laundry", "Dry Clean", "Studio", "Laundromat", "Care", "Works"];

const CITIES = [
  { city: "Bengaluru", areas: ["Indiranagar", "Koramangala", "HSR Layout", "Whitefield", "Jayanagar"] },
  { city: "Mumbai", areas: ["Andheri", "Bandra", "Powai", "Dadar"] },
  { city: "Delhi", areas: ["Saket", "Dwarka", "Rohini", "Hauz Khas"] },
  { city: "Hyderabad", areas: ["Gachibowli", "Banjara Hills", "Kondapur"] },
  { city: "Pune", areas: ["Kothrud", "Baner", "Viman Nagar"] },
];

const VEHICLES = ["Honda Activa", "TVS Jupiter", "Ather 450X", "Bajaj Chetak", "Hero Splendor"];

const STORE_IMAGES = [store1, store2, store3];

const SERVICE_CATALOG = [
  { id: "svc-wash-fold", name: "Wash & Fold", unit: "per kg", price: 79 },
  { id: "svc-steam-iron", name: "Steam Iron", unit: "per piece", price: 15 },
  { id: "svc-dry-clean", name: "Dry Clean", unit: "per piece", price: 129 },
  { id: "svc-premium", name: "Premium Care", unit: "per piece", price: 249 },
  { id: "svc-shoes", name: "Shoe Care", unit: "per pair", price: 199 },
  { id: "svc-curtain", name: "Curtains", unit: "per piece", price: 159 },
  { id: "svc-blanket", name: "Blanket", unit: "per piece", price: 349 },
];

const ADDRESS_LABELS = ["Home", "Work", "Other"];
const STREETS = [
  "Sunrise Residency, 12th Main",
  "Lake View Apartments, 5th Block",
  "WeWork Galaxy, 43 Residency Road",
  "Green Meadows, 2nd Cross",
  "Palm Grove Towers, 7th Avenue",
];

const PICKUP_SLOTS = ["8:00 AM - 10:00 AM", "12:00 PM - 2:00 PM", "4:00 PM - 6:00 PM", "6:00 PM - 8:00 PM"];

/* ------------------------------- generators ------------------------------ */

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function phoneFrom(random: Random): string {
  let digits = String(random.int(6, 9));
  for (let index = 0; index < 9; index += 1) digits += String(random.int(0, 9));
  return digits;
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function daysAgoDate(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

function makeCustomers(random: Random, count: number): Account[] {
  const base = SEED_ACCOUNTS.filter((account) => account.role === "customer");
  const extras: Account[] = [];
  for (let index = base.length; index < count; index += 1) {
    const name = `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)}`;
    const place = random.pick(CITIES);
    extras.push({
      id: `cus-${1001 + index}`,
      role: "customer",
      name,
      phone: phoneFrom(random),
      email: `${name.split(" ")[0]!.toLowerCase()}.${index}@quickpress.test`,
      city: place.city,
      avatarInitials: initials(name),
      isOnboarded: true,
      isVerified: random.chance(0.9),
    });
  }
  return [...structuredClone(base), ...extras].slice(0, Math.max(count, base.length));
}

function makePartners(random: Random, count: number): MockPartner[] {
  const base = structuredClone(SEED_PARTNERS);
  const extras: MockPartner[] = [];
  for (let index = base.length; index < count; index += 1) {
    const id = `prt-${2001 + index}`;
    const name = `${random.pick(STORE_PREFIX)} ${random.pick(STORE_SUFFIX)}`;
    const place = random.pick(CITIES);
    const status = random.chance(0.8) ? "active" : random.chance(0.5) ? "pending" : "suspended";
    const services = SERVICE_CATALOG.slice(0, random.int(2, SERVICE_CATALOG.length)).map(
      (service) => ({
        ...service,
        price: service.price + random.int(-10, 20),
        enabled: random.chance(0.85),
      }),
    );
    extras.push({
      id,
      accountId: id,
      name,
      ownerName: `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)}`,
      phone: phoneFrom(random),
      image: STORE_IMAGES[index % STORE_IMAGES.length]!,
      city: place.city,
      area: random.pick(place.areas),
      rating: Number((3.6 + random.float() * 1.4).toFixed(1)),
      totalOrders: random.int(12, 2400),
      isOpen: status === "active" ? random.chance(0.85) : false,
      acceptingNewOrders: status === "active",
      autoAccept: random.chance(0.3),
      joinedOn: daysAgoDate(random.int(30, 900)),
      status: status as MockPartner["status"],
      services,
    });
  }
  return [...base, ...extras].slice(0, Math.max(count, base.length));
}

function makeRiders(random: Random, count: number): MockRider[] {
  const base = structuredClone(SEED_RIDERS);
  const extras: MockRider[] = [];
  for (let index = base.length; index < count; index += 1) {
    const id = `rdr-${3001 + index}`;
    const name = `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)}`;
    const place = random.pick(CITIES);
    const status = random.chance(0.85) ? "active" : random.chance(0.5) ? "pending" : "suspended";
    extras.push({
      id,
      accountId: id,
      name,
      phone: phoneFrom(random),
      city: place.city,
      vehicle: random.pick(VEHICLES),
      plate: `KA ${random.int(1, 60)} ${random.pick(["JD", "MN", "EV", "AB"])} ${random.int(1000, 9999)}`,
      rating: Number((3.8 + random.float() * 1.2).toFixed(1)),
      trips: random.int(4, 2100),
      isOnline: status === "active" ? random.chance(0.7) : false,
      status: status as MockRider["status"],
      joinedOn: daysAgoDate(random.int(20, 800)),
    });
  }
  return [...base, ...extras].slice(0, Math.max(count, base.length));
}

function accountsForRole(
  partners: MockPartner[],
  riders: MockRider[],
): Account[] {
  const partnerAccounts: Account[] = partners.map((partner) => ({
    id: partner.accountId,
    role: "partner",
    name: partner.name,
    phone: partner.phone,
    email: `${partner.id}@quickpress.test`,
    city: partner.city,
    avatarInitials: initials(partner.name),
    isOnboarded: partner.status !== "pending",
    isVerified: partner.status === "active",
    linkedId: partner.id,
  }));
  const riderAccounts: Account[] = riders.map((rider) => ({
    id: rider.accountId,
    role: "rider",
    name: rider.name,
    phone: rider.phone,
    email: `${rider.id}@quickpress.test`,
    city: rider.city,
    avatarInitials: initials(rider.name),
    isOnboarded: rider.status !== "pending",
    isVerified: rider.status === "active",
    linkedId: rider.id,
  }));
  return [...partnerAccounts, ...riderAccounts];
}

/** Statuses generated orders are spread across, weighted like real traffic. */
const STATUS_MIX: OrderLifecycleStatus[] = [
  "placed",
  "placed",
  "partner_accepted",
  "rider_assigned",
  "rider_assigned",
  "picked_up",
  "at_partner",
  "processing",
  "processing",
  "completed",
  "out_for_delivery",
  "delivered",
  "delivered",
  "delivered",
  "delivered",
  "cancelled",
];

function totalsFor(items: OrderLine[], discount: number) {
  const itemsTotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const pickup = 0;
  const delivery = 29;
  const handling = 9;
  const gst = Math.round(itemsTotal * 0.05);
  return {
    itemsTotal,
    pickup,
    delivery,
    handling,
    gst,
    discount,
    grandTotal: itemsTotal + pickup + delivery + handling + gst - discount,
  };
}

function eventsFor(
  code: string,
  status: OrderLifecycleStatus,
  ageHours: number,
): OrderEvent[] {
  const reached =
    status === "cancelled"
      ? (["placed"] as OrderLifecycleStatus[])
      : ORDER_LIFECYCLE.slice(0, ORDER_LIFECYCLE.indexOf(status) + 1);
  const timeline = status === "cancelled" ? [...reached, "cancelled" as OrderLifecycleStatus] : reached;

  return timeline.map((step, position) => ({
    id: `${code}-evt-${position}`,
    status: step,
    label: ORDER_STATUS_LABEL[step],
    at: hoursAgo(Math.max(ageHours - position * 0.6, 0.1)),
    actor:
      step === "placed"
        ? "customer"
        : step === "partner_accepted" || step === "processing" || step === "completed"
          ? "partner"
          : step === "rider_assigned"
            ? "system"
            : step === "cancelled"
              ? "admin"
              : "rider",
  }));
}

function makeOrders(
  random: Random,
  count: number,
  customers: Account[],
  partners: MockPartner[],
  riders: MockRider[],
): Order[] {
  const base = structuredClone(SEED_ORDERS);
  const orders: Order[] = [...base];

  for (let index = base.length; index < count; index += 1) {
    const status = STATUS_MIX[index % STATUS_MIX.length]!;
    const customer = random.pick(customers);
    const partner = random.pick(partners);
    const rider =
      status === "placed" || status === "partner_accepted" || status === "cancelled"
        ? null
        : random.pick(riders);
    const code = `QP${2000 + index}`;
    const ageHours = random.int(1, 720);

    const items: OrderLine[] = Array.from({ length: random.int(1, 3) }, (_, line) => {
      const service = random.pick(SERVICE_CATALOG);
      return {
        id: `line-${line + 1}-${service.id}`,
        name: service.name,
        qty: random.int(1, 8),
        price: service.price,
      };
    });

    const mode: "online" | "cod" = random.chance(0.7) ? "online" : "cod";
    const paid = mode === "online" || status === "delivered";

    orders.push({
      id: `ord-${code}`,
      code,
      status,
      createdAt: hoursAgo(ageHours),
      updatedAt: hoursAgo(Math.max(ageHours - 1, 0.1)),
      customer: { id: customer.id, name: customer.name, phone: customer.phone },
      partner: {
        id: partner.id,
        name: partner.name,
        phone: partner.phone,
        image: partner.image,
        city: partner.city,
      },
      rider: rider
        ? {
            id: rider.id,
            name: rider.name,
            phone: rider.phone,
            vehicle: rider.vehicle,
            plate: rider.plate,
            rating: rider.rating,
            trips: `${rider.trips}+ trips`,
          }
        : null,
      serviceLabel: items[0]!.name,
      items,
      totals: totalsFor(items, random.chance(0.35) ? random.int(20, 80) : 0),
      address: {
        label: random.pick(ADDRESS_LABELS),
        line: `${random.int(101, 909)}, ${random.pick(STREETS)}`,
        city: `${partner.area}, ${partner.city}`,
        phone: customer.phone,
      },
      pickup: { date: "Today", slot: random.pick(PICKUP_SLOTS), express: random.chance(0.25) },
      delivery: { date: "Tomorrow", slot: random.pick(PICKUP_SLOTS) },
      payment: {
        mode,
        label: mode === "online" ? "UPI · Google Pay" : "Cash on delivery",
        note: paid ? "Paid" : "Pay after delivery",
        paid,
      },
      otp: { pickup: String(random.int(1000, 9999)), delivery: String(random.int(1000, 9999)) },
      events: eventsFor(code, status, ageHours),
      cancelledReason: status === "cancelled" ? "Cancelled during testing" : null,
    });
  }

  return orders.slice(0, Math.max(count, base.length));
}


const STREET_LABELS = ["Home", "Office", "Other"] as const;

function makeAddressesFor(random: Random, accounts: Account[]): AddressEntity[] {
  const addresses: AddressEntity[] = [];
  accounts
    .filter((account) => account.role === "customer")
    .forEach((account, index) => {
      const count = random.int(1, 3);
      for (let slot = 0; slot < count; slot += 1) {
        const type = (["home", "office", "other"] as const)[slot % 3]!;
        addresses.push({
          id: `addr-${account.id}-${slot}`,
          accountId: account.id,
          type,
          label: STREET_LABELS[slot % STREET_LABELS.length]!,
          houseNumber: `${random.int(1, 900)}`,
          building: random.pick(STREETS),
          street: random.pick(STREETS),
          area: random.pick(random.pick(CITIES).areas),
          landmark: "Near Metro Station",
          city: account.city,
          state: "Karnataka",
          pincode: `5600${random.int(10, 99)}`,
          contactName: account.name,
          phone: account.phone,
          isDefault: slot === 0,
        });
      }
      void index;
    });
  return addresses;
}

function makeWalletsAndTransactions(
  random: Random,
  accounts: Account[],
): { wallets: WalletEntity[]; transactions: TransactionEntity[] } {
  const wallets: WalletEntity[] = [];
  const transactions: TransactionEntity[] = [];
  for (const account of accounts) {
    wallets.push({
      accountId: account.id,
      balance: random.int(0, 2500),
      cashbackBalance: random.int(0, 500),
      rewardPoints: random.int(0, 2000),
      referralCode: `${account.name.split(" ")[0]?.toUpperCase() ?? "QP"}${random.int(100, 999)}`,
      referralEarned: random.int(0, 1000),
    });
    const kinds: TransactionEntity["kind"][] = [
      "order-cashback",
      "referral-bonus",
      "refund",
      "recharge",
      "reward-credit",
    ];
    const count = random.int(2, 5);
    for (let index = 0; index < count; index += 1) {
      const kind = random.pick(kinds);
      transactions.push({
        id: `txn-${account.id}-${index}`,
        accountId: account.id,
        kind,
        title:
          kind === "order-cashback"
            ? "Order cashback credited"
            : kind === "referral-bonus"
              ? "Referral bonus credited"
              : kind === "refund"
                ? "Order refund"
                : kind === "recharge"
                  ? "Wallet recharge · UPI"
                  : "Reward points redeemed",
        date: daysAgoDate(random.int(0, 60)),
        amount: random.int(20, 1000),
        direction: kind === "reward-credit" ? "debit" : "credit",
        status: random.chance(0.85) ? "success" : random.chance(0.5) ? "pending" : "failed",
      });
    }
  }
  return { wallets, transactions };
}

const NOTIFICATION_TEMPLATES: { kind: NotificationEntity["kind"]; title: string; description: string }[] = [
  { kind: "out-for-delivery", title: "Out for delivery", description: "Your order is on its way. Keep your phone handy." },
  { kind: "processing", title: "Laundry processing", description: "Your store started the wash & fold cycle." },
  { kind: "cashback", title: "Cashback credited", description: "Cashback for your last order has been added to your wallet." },
  { kind: "pickup-completed", title: "Pickup completed", description: "Your items were collected from your doorstep." },
  { kind: "partner-accepted", title: "Partner accepted your order", description: "Your store accepted the order." },
  { kind: "offer", title: "New offer is live", description: "Check out the latest QuickPress offers." },
  { kind: "delivered", title: "Order delivered", description: "Your order was delivered. Rate your experience." },
  { kind: "system", title: "Security update", description: "We refreshed our privacy policy and payment security." },
  { kind: "coupon", title: "Coupon unlocked", description: "FRESH20 is ready to use on your next pickup." },
  { kind: "wallet", title: "Wallet recharged", description: "Your QuickPress wallet balance was topped up." },
  { kind: "membership", title: "QuickPress Plus renewed", description: "Your membership is active for another month." },
  { kind: "referral", title: "Referral reward credited", description: "A friend joined with your code — reward added." },
];

function makeNotificationsFor(random: Random, accounts: Account[]): NotificationEntity[] {
  const notifications: NotificationEntity[] = [];
  for (const account of accounts) {
    const count = random.int(3, 8);
    for (let index = 0; index < count; index += 1) {
      const template = random.pick(NOTIFICATION_TEMPLATES);
      notifications.push({
        id: `ntf-${account.id}-${index}`,
        accountId: account.id,
        role: account.role,
        kind: template.kind,
        title: template.title,
        description: template.description,
        createdAt: hoursAgo(random.int(1, 400)),
        read: random.chance(0.6),
      });
    }
  }
  return notifications;
}

function makeReviews(random: Random, orders: Order[]): ReviewEntity[] {
  const delivered = orders.filter((order) => order.status === "delivered");
  return delivered.slice(0, Math.min(delivered.length, 40)).map((order, index) => ({
    id: `rev-${order.code}`,
    orderId: order.id,
    partnerId: order.partner.id,
    riderId: order.rider?.id ?? null,
    customerId: order.customer.id,
    customerName: order.customer.name,
    initials: initials(order.customer.name),
    rating: Number((3.6 + random.float() * 1.4).toFixed(1)),
    text: random.pick([
      "Clothes came back spotless and beautifully folded.",
      "Pickup was right on time and the delivery was quick.",
      "Great quality, will order again.",
      "Loved the packaging and the fresh scent.",
      "Good service overall, slightly late delivery.",
    ]),
    createdAt: hoursAgo(index + random.int(1, 200)),
  }));
}

function makeSupportTickets(random: Random, accounts: Account[]): SupportTicketEntity[] {
  const base = accounts.filter((account) => account.role !== "admin").slice(0, 5);
  return base.map((account, index) => ({
    id: `TKT-${1000 + index}`,
    accountId: account.id,
    subject: random.pick(["Missing garment", "Payout not received", "App crash on OTP", "Wrong pickup slot"]),
    description: "Auto-generated demo support ticket for testing.",
    source: account.role === "customer" ? "Customer" : account.role === "partner" ? "Partner" : "Rider",
    priority: random.pick(["High", "Medium", "Low"]),
    status: random.pick(["Open", "In progress", "Resolved"]),
    createdAt: hoursAgo(random.int(1, 500)),
  }));
}

/** Build a complete, reproducible mock dataset. */
export function generateDataset(config: SeedConfig = DEFAULT_SEED_CONFIG): MockDataset {
  const random = makeRandom(config.seed);
  const customers = makeCustomers(random, config.customers);
  const partners = makePartners(random, config.partners);
  const riders = makeRiders(random, config.riders);
  const orders = makeOrders(random, config.orders, customers, partners, riders);

  const admin = SEED_ACCOUNTS.filter((account) => account.role === "admin");
  const accounts: Account[] = [...customers, ...accountsForRole(partners, riders), ...structuredClone(admin)];

  // De-duplicate: hand-written seed accounts may already cover a partner/rider.
  const unique = new Map<string, Account>();
  for (const account of accounts) unique.set(`${account.role}:${account.id}`, account);
  const allAccounts = [...unique.values()];

  const addresses = makeAddressesFor(random, allAccounts);
  const { wallets, transactions } = makeWalletsAndTransactions(random, allAccounts);
  const notifications = makeNotificationsFor(random, allAccounts);
  const reviews = makeReviews(random, orders);
  const supportTickets = makeSupportTickets(random, allAccounts);

  return {
    accounts: allAccounts,
    partners,
    riders,
    orders,
    categories: structuredClone(SEED_CATEGORIES),
    services: structuredClone(SEED_SERVICES),
    banners: structuredClone(SEED_BANNERS),
    offers: structuredClone(SEED_OFFERS),
    coupons: structuredClone(SEED_COUPONS),
    cities: structuredClone(SEED_CITIES),
    settings: structuredClone(SEED_SETTINGS),
    staff: structuredClone(SEED_STAFF),
    addresses,
    wallets,
    transactions,
    notifications,
    reviews,
    supportTickets,
    carts: structuredClone(SEED_CART_ITEMS),
    paymentMethods: structuredClone(SEED_PAYMENT_METHODS),
  };
}

/** An empty dataset — used by the "reset" button in the mock testing panel. */
export function emptyDataset(): MockDataset {
  return {
    accounts: structuredClone(SEED_ACCOUNTS.filter((account) => account.role === "admin")),
    partners: [],
    riders: [],
    orders: [],
    categories: structuredClone(SEED_CATEGORIES),
    services: structuredClone(SEED_SERVICES),
    banners: structuredClone(SEED_BANNERS),
    offers: structuredClone(SEED_OFFERS),
    coupons: structuredClone(SEED_COUPONS),
    cities: structuredClone(SEED_CITIES),
    settings: structuredClone(SEED_SETTINGS),
    staff: structuredClone(SEED_STAFF),
    addresses: [],
    wallets: [],
    transactions: [],
    notifications: [],
    reviews: [],
    supportTickets: [],
    carts: [],
    paymentMethods: structuredClone(SEED_PAYMENT_METHODS),
  };
}
