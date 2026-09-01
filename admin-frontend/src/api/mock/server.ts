/**
 * The mock backend router.
 *
 * It looks and behaves like the future FastAPI service: routes are matched by
 * method + path, bodies and query strings are parsed the same way, latency is
 * simulated, and failures come back as `ApiError` with HTTP-style codes.
 * Swapping in the real API means setting VITE_API_BASE_URL — nothing here is
 * imported by any screen.
 */

import type {
  Account,
  AccountRole,
  NotificationCategory,
  NotificationEntity,
  Order,
} from "@/shared/types";
import { ORDER_STATUS_LABEL } from "@/shared/types/order";

import { ApiError } from "../core/errors";
import {
  demoAccounts,
  loginWithPassword,
  logout,
  requestOtp,
  requireAccount,
  verifyOtp,
} from "./auth-core";
import { getDb, mutateDb } from "./db";
import { paymentRoutes } from "./payment-routes";
import {
  MOCK_MAPS_STATUS,
  mockAutocomplete,
  mockDeliveryArea,
  mockGeocode,
  mockLiveMap,
  mockMatrix,
  mockPlaceDetails,
  mockPushRiderLocation,
  mockReverseGeocode,
  mockRiderLocation,
  mockRoute,
} from "./maps-core";

import {
  mockAvailability,
  mockReorderHistory,
  mockServiceAreas,
  mockSmartReorder,
} from "./availability-core";
import { homePayload, toHomePartner, toProfile, toServiceCard } from "./home-projections";
import {
  cartStateFor,
  relatedServicesFor,
  serviceDetailFor,
  servicePartnersFor,
} from "./service-cart-projections";
import {
  filterOptionsPayload,
  listPartnerCards,
  partnerDetailPayload,
  partnerServicesPayload,
  searchPayload,
  toPartnerReviews,
  toReviewSummary,
} from "./partner-projections";

import {
  mockReferralApply,
  mockReferralDashboard,
  mockReferralHistory,
  mockReferralInvite,
  mockReferralRewards,
  mockReferralStats,
} from "./referral-core";
import { SEED_FAQS, SEED_HELP_TOPICS, SEED_SUPPORT_CONTACT } from "./seed";
import {
  SEED_LOCATIONS_RECENT,
  SEED_LOCATIONS_SAVED,
  SEED_LOCATIONS_NEARBY,
  SEED_LOCATIONS_POPULAR,
  SEED_COUNTRIES,
  SEED_SLOT_DAYS,
  SEED_SLOT_TIMES,
  SEED_APP_META,
  SEED_CART_CHARGES,
  SEED_CART_COUPONS,
  SEED_CART_FULFILMENT,
  SEED_CART_INSTRUCTION_CHIPS,
  SEED_CART_ITEM_DESCRIPTIONS,
  SEED_MEMBERSHIP,
  SEED_OFFER_BANNERS,
  SEED_PAYMENT_PROVIDERS,
  SEED_SCRATCH_CARDS,
  SEED_SPECIAL_OFFERS,
} from "./seed";
import {
  clearDevLog,
  devAdvanceAllLive,
  devAdvanceOrder,
  devCancelOrder,
  devClear,
  devCompleteOrder,
  devGenerateCustomers,
  devGenerateOrders,
  devSimulateNotification,
  devGeneratePartners,
  devGenerateRiders,
  devOrders,
  devReseed,
  devReset,
  devTick,
  mockStats,
  setDevState,
} from "./devtools";
import { toAdminOrderRow, toPartnerOrder, toRiderOrder } from "./mappers";
import {
  adminAssignRider,
  cancelOrder,
  findOrder,
  listOrders,
  partnerAcceptOrder,
  partnerCompleteOrder,
  partnerRejectOrder,
  partnerStartProcessing,
  placeOrder,
  riderAcceptAssignment,
  riderDeliverOrder,
  riderDropAtPartner,
  riderPickupOrder,
  riderStartDelivery,
} from "./orders-core";

/**
 * Sprint 2.7 — enrich a stored notification with its filter category and the
 * related order, so the customer feed can group, filter and deep link.
 */
const NOTIFICATION_CATEGORY: Record<string, NotificationCategory> = {
  "partner-accepted": "order",
  "pickup-scheduled": "order",
  "pickup-completed": "order",
  processing: "order",
  "out-for-delivery": "order",
  delivered: "order",
  "order-new": "order",
  "order-cancelled": "order",
  "rider-assigned": "order",
  wallet: "wallet",
  cashback: "wallet",
  offer: "offer",
  coupon: "offer",
  membership: "membership",
  referral: "referral",
  system: "system",
};

function projectNotification(item: NotificationEntity, accountId: string): NotificationEntity {
  const category = NOTIFICATION_CATEGORY[item.kind] ?? "system";
  if (category !== "order") return { ...item, category, orderId: null, orderCode: null };
  const orders = getDb().orders.filter(
    (order) => order.customer?.id === accountId || order.partner?.id === accountId,
  );
  const related = orders.length > 0 ? orders[orders.length - 1] : undefined;
  return {
    ...item,
    category,
    orderId: item.orderId ?? related?.id ?? null,
    orderCode: item.orderCode ?? related?.code ?? null,
  };
}

export type MockRequestContext = {
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal | null;
};

type Ctx = {
  /** Path params, e.g. `:id`. Typed loosely because the router is generic. */
  params: any;
  query: URLSearchParams;
  /** Parsed JSON body, shaped by each endpoint's payload type. */
  body: any;
  token: string | null;
  account: (role?: AccountRole) => Account;
};

type Handler = (ctx: Ctx) => unknown;

const LATENCY_MS = 60;

function delay(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new ApiError("timeout", "Request cancelled"));
    });
  });
}

/**
 * PUT/PATCH /api/addresses/:id — a partial body only touches the fields it
 * sends, and only one address per customer can be the default.
 */
function updateMockAddress(id: string, body: Record<string, unknown>) {
  return mutateDb((db) => {
    const address = db.addresses.find((item) => item.id === id);
    if (!address) return null;
    Object.assign(address, body);
    if (body['isDefault'] === true) {
      for (const other of db.addresses) {
        if (other.accountId === address.accountId && other.id !== address.id) {
          other.isDefault = false;
        }
      }
    }
    return address;
  });
}

/* ----------------------- profile / settings (mock) ---------------------- */

/**
 * Profile photo and city are not part of the seeded `Account` shape, so the
 * mock keeps them beside the account for the lifetime of the session — the
 * FastAPI service stores them on the `users` document.
 */
const mockProfileExtras: Record<string, { city?: string; photoUrl?: string | null }> = {};

/** One settings document per customer, mirroring `customer_settings`. */
const mockSettings: Record<string, Record<string, unknown>> = {};

const DEFAULT_MOCK_SETTINGS = {
  theme: "system",
  language: "en-IN",
  notifications: {
    orderUpdates: true,
    deliveryAlerts: true,
    promotions: true,
    email: true,
    sms: false,
    push: true,
  },
  privacy: { personalizedOffers: true, shareUsageData: false, profileVisible: true },
  updatedAt: null as string | null,
};

function readMockSettings(accountId: string) {
  return { ...DEFAULT_MOCK_SETTINGS, ...(mockSettings[accountId] ?? {}) };
}

function writeMockSettings(accountId: string, patch: Record<string, unknown>) {
  const current = readMockSettings(accountId);
  const next = {
    ...current,
    ...patch,
    notifications: { ...current.notifications, ...((patch['notifications'] as object) ?? {}) },
    privacy: { ...current.privacy, ...((patch['privacy'] as object) ?? {}) },
    updatedAt: new Date().toISOString(),
  };
  mockSettings[accountId] = next;
  return next;
}

/** PUT/PATCH /api/profile and POST /api/profile/photo. */
function updateMockProfile(accountId: string, body: Record<string, unknown>) {
  const { city, photoUrl, ...accountFields } = body;
  if (city !== undefined || photoUrl !== undefined) {
    mockProfileExtras[accountId] = {
      ...(mockProfileExtras[accountId] ?? {}),
      ...(city !== undefined ? { city: String(city) } : {}),
      ...(photoUrl !== undefined ? { photoUrl: photoUrl as string } : {}),
    };
  }
  const record = mutateDb((db) => {
    const account = db.accounts.find((item) => item.id === accountId);
    if (account) {
      Object.assign(account, accountFields);
      if (typeof accountFields['name'] === "string") {
        account.avatarInitials = initialsFor(String(accountFields['name']));
      }
    }
    return account ?? null;
  });
  const extras = mockProfileExtras[accountId] ?? {};
  return {
    ...(record ?? {}),
    city: extras.city ?? "",
    photoUrl: extras.photoUrl ?? null,
    avatarUrl: extras.photoUrl ?? null,
  };
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "QP";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

function statusLabel(order: Order): string {
  return ORDER_STATUS_LABEL[order.status];
}

/* ------------------------------- routes -------------------------------- */

const routes: Array<[string, string, Handler]> = [
  /* Phase 5 · Sprint 5.6 — Razorpay, wallet ledger, settlements, admin ops. */
  ...paymentRoutes,

  /* --------------------------- maps (Sprint 5.4) ------------------------ */
  ["GET", "/api/maps/status", () => MOCK_MAPS_STATUS],
  ["GET", "/api/maps/geocode", ({ query }) => mockGeocode(query.get("address") ?? "")],
  [
    "GET",
    "/api/maps/reverse-geocode",
    ({ query }) =>
      mockReverseGeocode(Number(query.get("latitude") ?? 0), Number(query.get("longitude") ?? 0)),
  ],
  ["GET", "/api/maps/autocomplete", ({ query }) => mockAutocomplete(query.get("q") ?? "")],
  ["GET", "/api/maps/place/:placeId", ({ params }) => mockPlaceDetails(params.placeId!)],
  ["POST", "/api/maps/route", ({ body }) => mockRoute(body.origin, body.destination)],
  ["POST", "/api/maps/eta", ({ body }) => mockRoute(body.origin, body.destination)],
  [
    "POST",
    "/api/maps/distance-matrix",
    ({ body }) => mockMatrix(body.origins ?? [], body.destinations ?? []),
  ],
  ["POST", "/api/maps/delivery-area", ({ body }) => mockDeliveryArea(body)],
  [
    "POST",
    "/api/maps/live/rider",
    ({ account, body }) => {
      const rider = account("rider");
      return mockPushRiderLocation(rider.linkedId ?? rider.id, rider.name ?? "Rider", body);
    },
  ],
  ["GET", "/api/maps/live/rider/:riderId", ({ params }) => mockRiderLocation(params.riderId!)],
  ["GET", "/api/maps/live", () => mockLiveMap()],


  /* ----------------------------- auth ---------------------------------- */
  ["POST", "/api/auth/request-otp", ({ body }) => requestOtp(body.phone, body.role ?? "customer")],
  [
    "POST",
    "/api/auth/verify-otp",
    ({ body }) => verifyOtp(body.phone, body.otp ?? body.code, body.role ?? "customer"),
  ],
  [
    "POST",
    "/api/auth/login",
    ({ body }) => loginWithPassword(body.email, body.password, body.role ?? "admin"),
  ],
  ["POST", "/api/auth/logout", ({ token }) => logout(token)],
  ["GET", "/api/auth/me", ({ account }) => account()],
  [
    "GET",
    "/api/auth/demo-accounts",
    ({ query }) => demoAccounts((query.get("role") ?? "customer") as AccountRole),
  ],

  /* --------------------------- customer -------------------------------- */
  [
    "POST",
    "/api/orders",
    ({ body, account }) => {
      const customer = account("customer");
      return placeOrder({ ...body, customerId: body.customerId ?? customer.id } as any);
    },
  ],
  [
    "GET",
    "/api/orders",
    ({ account, query }) => {
      const customer = account("customer");
      return listOrders({ customerId: customer.id, status: query.get("status") ?? undefined });
    },
  ],
  /* Sprint 2.5 — history is matched before `/api/orders/:id`. */
  [
    "GET",
    "/api/orders/history",
    ({ account, query }) => {
      const customer = account("customer");
      const orders = listOrders({ customerId: customer.id });
      const term = (query.get("q") ?? "").trim().toLowerCase();
      const status = (query.get("status") ?? "").trim().toLowerCase();
      const from = query.get("from") ?? "";
      const to = query.get("to") ?? "";
      const partnerId = query.get("partnerId") ?? "";
      return orders.filter((order) => {
        if (partnerId && order.partner.id !== partnerId) return false;
        if (status && status !== "all") {
          if (status === "completed" && order.status !== "delivered") return false;
          if (status === "cancelled" && order.status !== "cancelled") return false;
          if (
            status === "active" &&
            (order.status === "delivered" || order.status === "cancelled")
          ) {
            return false;
          }
          if (
            !["completed", "cancelled", "active"].includes(status) &&
            order.status !== status
          ) {
            return false;
          }
        }
        const created = (order.createdAt ?? "").slice(0, 10);
        if (from && created < from.slice(0, 10)) return false;
        if (to && created > to.slice(0, 10)) return false;
        if (term) {
          const haystack = [
            order.code,
            order.serviceLabel,
            order.partner.name,
            ...order.items.map((item) => item.name),
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      });
    },
  ],
  ["GET", "/api/orders/:id", ({ params }) => findOrder(params.id!)],
  ["GET", "/api/orders/:id/tracking", ({ params }) => findOrder(params.id!)],
  [
    "POST",
    "/api/orders/:id/cancel",
    ({ params, body }) => cancelOrder(params.id!, body.reason ?? ""),
  ],
  /** POST /api/orders/{id}/reorder — Sprint 2.12 smart reorder. */
  [
    "POST",
    "/api/orders/:id/reorder",
    ({ params, account }) => mockSmartReorder(findOrder(params.id!), account("customer").id),
  ],

  /* --------------------- availability & reorder (2.12) ------------------ */
  ["GET", "/api/service-areas", () => mockServiceAreas()],
  [
    "GET",
    "/api/services/:id/availability",
    ({ params, query }) =>
      mockAvailability({
        serviceId: params.id!,
        partnerId: query.get("partnerId") ?? undefined,
        city: query.get("city") ?? "",
        pincode: query.get("pincode") ?? "",
      }),
  ],
  [
    "GET",
    "/api/partners/:id/availability",
    ({ params, query }) =>
      mockAvailability({
        partnerId: params.id!,
        serviceId: query.get("serviceId") ?? undefined,
        city: query.get("city") ?? "",
        pincode: query.get("pincode") ?? "",
      }),
  ],
  [
    "POST",
    "/api/availability/check",
    ({ body }) =>
      mockAvailability({
        serviceId: body.serviceId || undefined,
        partnerId: body.partnerId || undefined,
        city: body.city ?? "",
        pincode: body.pincode ?? "",
      }),
  ],
  ["GET", "/api/reorder/history", ({ account }) => mockReorderHistory(account("customer").id)],

  /* ---------------------------- partner -------------------------------- */
  [
    "GET",
    "/api/partner/orders",
    ({ account, query }) => {
      const partner = account("partner");
      const orders = listOrders({ partnerId: partner.linkedId ?? partner.id });
      const status = query.get("status");
      const mapped = orders.map(toPartnerOrder);
      return status && status !== "all" ? mapped.filter((item) => item.status === status) : mapped;
    },
  ],
  ["GET", "/api/partner/orders/:id", ({ params }) => toPartnerOrder(findOrder(params.id!))],
  [
    "POST",
    "/api/partner/orders/:id/accept",
    ({ params }) => toPartnerOrder(partnerAcceptOrder(params.id!)),
  ],
  [
    "POST",
    "/api/partner/orders/:id/reject",
    ({ params, body }) => toPartnerOrder(partnerRejectOrder(params.id!, body.reason ?? "")),
  ],
  [
    "POST",
    "/api/partner/orders/:id/start-processing",
    ({ params }) => toPartnerOrder(partnerStartProcessing(params.id!)),
  ],
  [
    "POST",
    "/api/partner/orders/:id/complete",
    ({ params }) => toPartnerOrder(partnerCompleteOrder(params.id!)),
  ],
  [
    "GET",
    "/api/partner/profile",
    ({ account }) => {
      const partner = account("partner");
      const record = getDb().partners.find((item) => item.id === (partner.linkedId ?? partner.id));
      if (!record) throw new ApiError("not-found", "Partner store not found", 404);
      return record;
    },
  ],
  [
    "GET",
    "/api/partner/dashboard",
    ({ account }) => {
      const partner = account("partner");
      const orders = listOrders({ partnerId: partner.linkedId ?? partner.id });
      return {
        newOrders: orders.filter((order) => order.status === "placed").length,
        inProgress: orders.filter((order) =>
          ["partner_accepted", "rider_assigned", "picked_up", "at_partner", "processing"].includes(
            order.status,
          ),
        ).length,
        readyForDelivery: orders.filter((order) => order.status === "completed").length,
        delivered: orders.filter((order) => order.status === "delivered").length,
        earningsToday: orders
          .filter((order) => order.status === "delivered")
          .reduce((sum, order) => sum + Math.round(order.totals.grandTotal * 0.8), 0),
      };
    },
  ],

  /* ----------------------------- rider --------------------------------- */
  [
    "GET",
    "/api/rider/orders",
    ({ account, query }) => {
      const rider = account("rider");
      const orders = listOrders({ riderId: rider.linkedId ?? rider.id });
      const mapped = orders.map(toRiderOrder);
      const task = query.get("taskType");
      return task && task !== "all" ? mapped.filter((item) => item.taskType === task) : mapped;
    },
  ],
  ["GET", "/api/rider/orders/:id", ({ params }) => toRiderOrder(findOrder(params.id!))],
  [
    "POST",
    "/api/rider/orders/:id/accept",
    ({ params, account }) => {
      const rider = account("rider");
      return toRiderOrder(riderAcceptAssignment(params.id!, rider.linkedId ?? rider.id));
    },
  ],
  [
    "POST",
    "/api/rider/orders/:id/pickup",
    ({ params, body }) => toRiderOrder(riderPickupOrder(params.id!, body.otp)),
  ],
  [
    "POST",
    "/api/rider/orders/:id/drop-at-partner",
    ({ params }) => toRiderOrder(riderDropAtPartner(params.id!)),
  ],
  [
    "POST",
    "/api/rider/orders/:id/start-delivery",
    ({ params }) => toRiderOrder(riderStartDelivery(params.id!)),
  ],
  [
    "POST",
    "/api/rider/orders/:id/deliver",
    ({ params, body }) => toRiderOrder(riderDeliverOrder(params.id!, body.otp)),
  ],
  [
    "GET",
    "/api/rider/dashboard",
    ({ account }) => {
      const rider = account("rider");
      const orders = listOrders({ riderId: rider.linkedId ?? rider.id });
      const delivered = orders.filter((order) => order.status === "delivered");
      return {
        assigned: orders.filter((order) => order.status === "rider_assigned").length,
        active: orders.filter((order) =>
          ["picked_up", "at_partner", "processing", "completed", "out_for_delivery"].includes(
            order.status,
          ),
        ).length,
        completedToday: delivered.length,
        earningsToday: delivered.reduce(
          (sum, order) => sum + 35 + Math.round(order.totals.grandTotal * 0.05),
          0,
        ),
      };
    },
  ],

  /* ----------------------------- admin --------------------------------- */
  [
    "GET",
    "/api/admin/orders",
    ({ account, query }) => {
      account("admin");
      const status = query.get("status");
      return getDb()
        .orders.filter((order) => !status || status === "all" || order.status === status)
        .map((order) => toAdminOrderRow(order, statusLabel(order)));
    },
  ],
  [
    "GET",
    "/api/admin/orders/:id",
    ({ params, account }) => {
      account("admin");
      return findOrder(params.id!);
    },
  ],
  [
    "POST",
    "/api/admin/orders/:id/assign-rider",
    ({ params, body, account }) => {
      account("admin");
      const order = adminAssignRider(params.id!, body.riderId);
      return toAdminOrderRow(order, statusLabel(order));
    },
  ],
  [
    "POST",
    "/api/admin/orders/:id/cancel",
    ({ params, body, account }) => {
      account("admin");
      const order = cancelOrder(params.id!, body.reason ?? "Cancelled by admin", "admin");
      return toAdminOrderRow(order, statusLabel(order));
    },
  ],
  [
    "GET",
    "/api/admin/partners",
    ({ account }) => {
      account("admin");
      return getDb().partners;
    },
  ],
  [
    "GET",
    "/api/admin/riders",
    ({ account }) => {
      account("admin");
      const riders = getDb().riders;
      return {
        items: riders,
        total: riders.length,
        page: 1,
        pageSize: 100,
      };
    },
  ],
  [
    "GET",
    "/api/admin/riders/stats",
    ({ account }) => {
      account("admin");
      const riders = getDb().riders;
      return {
        totalFleet: riders.length,
        onlineFleet: riders.filter((r) => r.isOnline).length,
        onDelivery: 1,
        availableDispatch: Math.max(0, riders.filter((r) => r.isOnline).length - 1),
        kycVerified: riders.filter((r) => r.kycStatus === "verified").length,
        kycPending: 0,
        suspendedFleet: riders.filter((r) => r.status === "suspended").length,
        totalTripsDelivered: 42,
        totalEarningsPaid: 12500,
        fleetUtilization: 50.0,
      };
    },
  ],
  [
    "GET",
    "/api/admin/customers/stats",
    ({ account }) => {
      account("admin");
      const db = getDb();
      const customers = db.accounts.filter((item) => item.role === "customer");
      return {
        totalCustomers: customers.length,
        activeCustomers: customers.length,
        blockedCustomers: 0,
        newCustomersToday: 1,
        newCustomersThisWeek: customers.length,
        newCustomersThisMonth: customers.length,
        repeatCustomers: 2,
        inactiveCustomers: 0,
        vipCustomers: 1,
        membershipCustomers: 1,
        totalRevenue: 2450,
        totalOrders: db.orders.length,
        averageOrderValue: 350,
      };
    },
  ],
  [
    "GET",
    "/api/admin/customers",
    ({ account }) => {
      account("admin");
      const db = getDb();
      const items = db.accounts
        .filter((item) => item.role === "customer")
        .map((customer) => {
          const orders = db.orders.filter((order) => order.customer.id === customer.id);
          const spend = orders.reduce((sum, order) => sum + order.totals.grandTotal, 0);
          return {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            city: customer.city || "Kasganj",
            zone: "Central Zone",
            orders: orders.length,
            completedOrders: orders.filter((o) => o.status === "delivered").length,
            cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
            spend,
            spendRaw: spend,
            walletBalance: 150.0,
            walletRaw: 150.0,
            loyaltyPoints: 120,
            loyaltyLevel: "Silver Tier",
            membership: "Standard",
            status: "active",
            registrationDate: "2026-08-30",
            registrationTimestamp: "2026-08-30T04:49:41.200Z",
            lastActive: "2026-08-30",
            lastLoginTimestamp: "2026-08-30T04:49:42.400Z",
            lastOrder: orders.length > 0 ? "2026-08-31" : "—",
            lastOrderTimestamp: orders.length > 0 ? "2026-08-31T12:00:00Z" : undefined,
            isVip: spend >= 500,
            tags: ["Customer", "Kasganj"],
            addressCount: 1,
            primaryAddress: `${customer.city || "Kasganj"}, Uttar Pradesh`,
            deviceInfo: "Mobile App (Android/iOS)",
          };
        });
      return {
        items,
        total: items.length,
        page: 1,
        pageSize: 100,
      };
    },
  ],
  [
    "GET",
    "/api/admin/dashboard",
    ({ account }) => {
      account("admin");
      const db = getDb();
      const delivered = db.orders.filter((order) => order.status === "delivered");
      return {
        totalOrders: db.orders.length,
        liveOrders: db.orders.filter(
          (order) => order.status !== "delivered" && order.status !== "cancelled",
        ).length,
        deliveredOrders: delivered.length,
        cancelledOrders: db.orders.filter((order) => order.status === "cancelled").length,
        revenue: delivered.reduce((sum, order) => sum + order.totals.grandTotal, 0),
        partners: db.partners.length,
        riders: db.riders.length,
        customers: db.accounts.filter((item) => item.role === "customer").length,
        statusBreakdown: Object.keys(ORDER_STATUS_LABEL).map((status) => ({
          status,
          label: ORDER_STATUS_LABEL[status as keyof typeof ORDER_STATUS_LABEL],
          count: db.orders.filter((order) => order.status === status).length,
        })),
      };
    },
  ],

  /* ---------------------------- catalog -------------------------------- */
  /**
   * GET /api/partners — Partner Listing cards with server side search,
   * filtering and sorting. Mirrors `PartnerRepository.partner_cards`.
   */
  [
    "GET",
    "/api/partners",
    ({ query }) => {
      const num = (key: string) => {
        const raw = query.get(key);
        const value = raw === null ? 0 : Number(raw);
        return Number.isFinite(value) ? value : 0;
      };
      const flag = (key: string) => query.get(key) === "true" || query.get(key) === "1";
      return listPartnerCards(getDb(), {
        q: query.get("q") ?? undefined,
        city: query.get("city") ?? undefined,
        serviceName: query.get("serviceName") ?? undefined,
        sort: query.get("sort") ?? undefined,
        minRating: num("minRating"),
        maxDistance: num("maxDistance"),
        maxPrice: num("maxPrice"),
        maxPickupMinutes: num("maxPickupMinutes"),
        openNow: flag("openNow"),
        offers: flag("offers"),
        verified: flag("verified"),
        freePickup: flag("freePickup"),
        newlyAdded: flag("newlyAdded"),
      });
    },
  ],
  /** Declared before `/api/partners/:id` so "nearby" is not read as an id. */
  [
    "GET",
    "/api/partners/nearby",
    ({ query }) => {
      const city = query.get("city");
      return listPartnerCards(getDb(), { city: city ?? undefined, sort: "distance" });
    },
  ],
  /** GET /api/partners/{id} — full Partner Details payload. */
  [
    "GET",
    "/api/partners/:id",
    ({ params }) => {
      const detail = partnerDetailPayload(getDb(), params.id!);
      if (!detail) throw new ApiError("not-found", "Partner not found", 404);
      return detail;
    },
  ],
  /** GET /api/partners/{id}/services */
  [
    "GET",
    "/api/partners/:id/services",
    ({ params }) => {
      const services = partnerServicesPayload(getDb(), params.id!);
      if (!services) throw new ApiError("not-found", "Partner not found", 404);
      return services;
    },
  ],
  /** GET /api/filter — sorts, toggles, ranges and cities for the filter sheet. */
  ["GET", "/api/filter", () => filterOptionsPayload(getDb())],

  ["GET", "/api/riders", () => getDb().riders],

  /* ---------------------------- catalog data ---------------------------- */
  ["GET", "/api/home", ({ account }) => homePayload(getDb(), account("customer"))],
  [
    "GET",
    "/api/profile",
    ({ account }) => {
      const db = getDb();
      const acc = account("customer");
      const unread = db.notifications.filter(
        (item) => item.accountId === acc.id && !item.read,
      ).length;
      const extras = mockProfileExtras[acc.id] ?? {};
      return {
        ...acc,
        ...toProfile(acc, unread),
        city: extras.city ?? acc.city ?? "",
        photoUrl: extras.photoUrl ?? null,
        avatarUrl: extras.photoUrl ?? null,
        memberSince: SEED_APP_META.memberSince,
      };
    },
  ],
  [
    "PUT",
    "/api/profile",
    ({ account, body }) => updateMockProfile(account("customer").id, body),
  ],
  [
    "PATCH",
    "/api/profile",
    ({ account, body }) => updateMockProfile(account("customer").id, body),
  ],
  // POST /api/profile/photo — a hosted URL or a small base64 data URL.
  [
    "POST",
    "/api/profile/photo",
    ({ account, body }) => updateMockProfile(account("customer").id, { photoUrl: body.photo }),
  ],
  /* -------------------------- customer settings ------------------------- */
  ["GET", "/api/me/settings", ({ account }) => readMockSettings(account("customer").id)],
  [
    "PUT",
    "/api/me/settings",
    ({ account, body }) => writeMockSettings(account("customer").id, body),
  ],
  [
    "PATCH",
    "/api/me/settings",
    ({ account, body }) => writeMockSettings(account("customer").id, body),
  ],
  [
    "GET",
    "/api/location",
    () => ({ area: "Koramangala 5th Block", city: "Bengaluru", state: "Karnataka" }),
  ],
  ["GET", "/api/banners", () => getDb().banners],
  ["GET", "/api/categories", () => getDb().categories],
  [
    "GET",
    "/api/services",
    ({ query }) => {
      const db = getDb();
      const categoryId = query.get("categoryId");
      return db.services
        .filter((service) => !categoryId || service.categoryId === categoryId)
        .map((service) => toServiceCard(service, db.partners.length));
    },
  ],
  [
    "GET",
    "/api/services/popular",
    () => {
      const db = getDb();
      return db.services
        .filter((service) => service.popular)
        .map((service) => toServiceCard(service, db.partners.length));
    },
  ],
  [
    "GET",
    "/api/services/:id",
    ({ params }) => {
      const db = getDb();
      const service = db.services.find((item) => item.id === params.id);
      if (!service) throw new ApiError("not-found", "Service not found", 404);
      return serviceDetailFor(db, service);
    },
  ],
  /** GET /api/services/{id}/faq */
  [
    "GET",
    "/api/services/:id/faq",
    ({ params }) => {
      const db = getDb();
      const service = db.services.find((item) => item.id === params.id);
      if (!service) throw new ApiError("not-found", "Service not found", 404);
      return serviceDetailFor(db, service).faq;
    },
  ],
  /** GET /api/services/{id}/related */
  [
    "GET",
    "/api/services/:id/related",
    ({ params }) => {
      const db = getDb();
      const service = db.services.find((item) => item.id === params.id);
      if (!service) throw new ApiError("not-found", "Service not found", 404);
      return relatedServicesFor(db, service);
    },
  ],
  /** GET /api/services/{id}/partners */
  [
    "GET",
    "/api/services/:id/partners",
    ({ params }) => {
      const db = getDb();
      const service = db.services.find((item) => item.id === params.id);
      if (!service) throw new ApiError("not-found", "Service not found", 404);
      return servicePartnersFor(db, service);
    },
  ],
  /** GET /api/search — partner name, service, category and city search. */
  [
    "GET",
    "/api/search",
    ({ query }) => {
      const scopes = query.getAll("scope");
      return searchPayload(getDb(), query.get("q") ?? "", scopes);
    },
  ],
  /** GET /api/partners/{id}/reviews — rating summary + review list. */
  [
    "GET",
    "/api/partners/:id/reviews",
    ({ params }) => {
      const db = getDb();
      const partner = db.partners.find((item) => item.id === params.id);
      if (!partner) throw new ApiError("not-found", "Partner not found", 404);
      const reviews = toPartnerReviews(db, params.id!);
      return { summary: toReviewSummary(reviews, partner.rating), reviews };
    },
  ],

  [
    "GET",
    "/api/reviews",
    ({ query }) => {
      const partnerId = query.get("partnerId");
      const db = getDb();
      return partnerId ? db.reviews.filter((review) => review.partnerId === partnerId) : db.reviews;
    },
  ],
  [
    "POST",
    "/api/reviews",
    ({ body, account }) => {
      const customer = account("customer");
      return mutateDb((db) => {
        const review = {
          id: `rev-${Date.now().toString(36)}`,
          orderId: body.orderId ?? null,
          partnerId: body.partnerId ?? null,
          riderId: body.riderId ?? null,
          customerId: customer.id,
          customerName: customer.name,
          initials: customer.avatarInitials,
          rating: Number(body.rating ?? 5),
          text: body.text ?? "",
          createdAt: new Date().toISOString(),
        };
        db.reviews.unshift(review);
        return review;
      });
    },
  ],
  [
    "GET",
    "/api/recommendations",
    () =>
      getDb()
        .services.slice(0, 3)
        .map((service) => ({
          id: service.id,
          title: service.name,
          reason: "Popular with customers near you",
          price: service.price,
          icon: "sparkles",
        })),
  ],
  [
    "GET",
    "/api/orders/recent",
    ({ account }) => {
      const customer = account("customer");
      return listOrders({ customerId: customer.id }).slice(0, 5);
    },
  ],

  /* ------------------------------- cart ---------------------------------- */
  [
    "GET",
    "/api/cart",
    ({ account, query }) =>
      cartStateFor(getDb(), account("customer").id, Number(query.get("couponDiscount") ?? 0)),
  ],
  [
    "POST",
    "/api/cart",
    ({ account, body }) =>
      mutateDb((db) => {
        const customer = account("customer");
        const id = body.id ?? body.itemId ?? `cart-${Date.now().toString(36)}`;
        const existing = db.carts.find((item) => item.id === id && item.accountId === customer.id);
        if (existing) {
          existing.qty += Number(body.qty ?? 1);
          return existing;
        }
        const line = {
          id,
          accountId: customer.id,
          partnerId: body.partnerId ?? "",
          serviceId: body.serviceId ?? body.itemId ?? "",
          name: body.name ?? "Item",
          price: Number(body.price ?? 0),
          unit: body.unit ?? "per item",
          qty: Number(body.qty ?? 1),
          image: body.image ?? "",
        };
        db.carts.push(line);
        return line;
      }),
  ],
  [
    "PUT",
    "/api/cart",
    ({ account, body }) =>
      mutateDb((db) => {
        const customer = account("customer");
        const line = db.carts.find((item) => item.id === body.id && item.accountId === customer.id);
        if (line) line.qty = Number(body.qty ?? line.qty);
        return line ?? null;
      }),
  ],
  [
    "DELETE",
    "/api/cart",
    ({ account }) =>
      mutateDb((db) => {
        const customer = account("customer");
        db.carts = db.carts.filter((item) => item.accountId !== customer.id);
        return { ok: true };
      }),
  ],
  ["GET", "/api/cart/items", ({ account }) => cartStateFor(getDb(), account("customer").id).items],
  [
    "POST",
    "/api/cart/items",
    ({ account, body }) =>
      mutateDb((db) => {
        const customer = account("customer");
        const id = body.id ?? body.itemId ?? `cart-${Date.now().toString(36)}`;
        const existing = db.carts.find((item) => item.id === id && item.accountId === customer.id);
        if (existing) {
          existing.qty += Number(body.qty ?? 1);
          return existing;
        }
        const line = {
          id,
          accountId: customer.id,
          partnerId: body.partnerId ?? "",
          serviceId: body.serviceId ?? body.itemId ?? "",
          name: body.name ?? "Item",
          price: Number(body.price ?? 0),
          unit: body.unit ?? "per item",
          qty: Number(body.qty ?? 1),
          image: body.image ?? "",
        };
        db.carts.push(line);
        return line;
      }),
  ],
  /** PUT /api/cart/items/{id} — returns the recomputed cart. */
  [
    "PUT",
    "/api/cart/items/:id",
    ({ account, params, body }) =>
      mutateDb((db) => {
        const customer = account("customer");
        const qty = Number(body.qty ?? 1);
        const line = db.carts.find(
          (item) => item.id === params.id && item.accountId === customer.id,
        );
        if (line && qty <= 0) {
          db.carts = db.carts.filter((item) => item !== line);
        } else if (line) {
          line.qty = qty;
        }
        return cartStateFor(db, customer.id);
      }),
  ],
  /** DELETE /api/cart/items/{id} — returns the recomputed cart. */
  [
    "DELETE",
    "/api/cart/items/:id",
    ({ account, params }) =>
      mutateDb((db) => {
        const customer = account("customer");
        db.carts = db.carts.filter(
          (item) => !(item.id === params.id && item.accountId === customer.id),
        );
        return cartStateFor(db, customer.id);
      }),
  ],

  /* ------------------------------ offers ---------------------------------- */
  ["GET", "/api/offers", () => ({ offers: getDb().offers, coupons: getDb().coupons })],
  [
    "POST",
    "/api/offers/:code/apply",
    ({ params }) => {
      const coupon = getDb().coupons.find((item) => item.code === params.code);
      if (!coupon) throw new ApiError("not-found", "Coupon not found", 404);
      return { ok: true, code: coupon.code, discount: coupon.discount, minOrder: coupon.minOrder };
    },
  ],

  /* --------------------------- notifications ------------------------------ */
  [
    "GET",
    "/api/notifications",
    ({ account, query }) => {
      const acc = account();
      const page = Math.max(1, Number(query.get("page") ?? 1) || 1);
      const limit = Math.max(1, Number(query.get("limit") ?? 15) || 15);
      const type = (query.get("type") ?? "all").trim();
      const search = (query.get("search") ?? "").trim().toLowerCase();

      const all = getDb()
        .notifications.filter((item) => item.accountId === acc.id)
        .map((item) => projectNotification(item, acc.id))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const matching = all.filter((item) => {
        if (type && type !== "all" && item.category !== type) return false;
        if (!search) return true;
        return (
          item.title.toLowerCase().includes(search) ||
          item.description.toLowerCase().includes(search) ||
          String(item.orderCode ?? "").toLowerCase().includes(search)
        );
      });

      return {
        items: matching.slice((page - 1) * limit, page * limit),
        page,
        limit,
        total: matching.length,
        hasMore: page * limit < matching.length,
        unread: all.filter((item) => !item.read).length,
      };
    },
  ],
  [
    "GET",
    "/api/notifications/unread-count",
    ({ account }) => {
      const acc = account();
      return {
        count: getDb().notifications.filter((item) => item.accountId === acc.id && !item.read)
          .length,
      };
    },
  ],
  [
    "PUT",
    "/api/notifications/read-all",
    ({ account }) =>
      mutateDb((db) => {
        const acc = account();
        db.notifications
          .filter((n) => n.accountId === acc.id)
          .forEach((n) => {
            n.read = true;
          });
        return { ok: true, unread: 0 };
      }),
  ],
  [
    "POST",
    "/api/notifications/read-all",
    ({ account }) =>
      mutateDb((db) => {
        const acc = account();
        db.notifications
          .filter((n) => n.accountId === acc.id)
          .forEach((n) => {
            n.read = true;
          });
        return { ok: true, unread: 0 };
      }),
  ],
  [
    "PUT",
    "/api/notifications/:id/read",
    ({ params, account }) =>
      mutateDb((db) => {
        const acc = account();
        const item = db.notifications.find((n) => n.id === params.id);
        if (!item) throw new ApiError("not-found", "Notification not found", 404);
        item.read = true;
        return {
          ok: true,
          id: item.id,
          unread: db.notifications.filter((n) => n.accountId === acc.id && !n.read).length,
        };
      }),
  ],
  [
    "POST",
    "/api/notifications/:id/read",
    ({ params }) =>
      mutateDb((db) => {
        const item = db.notifications.find((n) => n.id === params.id);
        if (item) item.read = true;
        return item ?? null;
      }),
  ],
  [
    "DELETE",
    "/api/notifications/:id",
    ({ params, account }) =>
      mutateDb((db) => {
        const acc = account();
        const index = db.notifications.findIndex((n) => n.id === params.id);
        if (index === -1) throw new ApiError("not-found", "Notification not found", 404);
        db.notifications.splice(index, 1);
        return {
          ok: true,
          id: params.id,
          unread: db.notifications.filter((n) => n.accountId === acc.id && !n.read).length,
        };
      }),
  ],

  /* ------------------------- referral (Sprint 2.8) -------------------------- */
  [
    "GET",
    "/api/referral",
    ({ account }) => {
      const acc = account("customer");
      return mockReferralDashboard(acc.id, acc.name);
    },
  ],
  [
    "GET",
    "/api/referral/history",
    ({ account }) => {
      const acc = account("customer");
      return mockReferralHistory(acc.id, acc.name);
    },
  ],
  [
    "GET",
    "/api/referral/rewards",
    ({ account }) => {
      const acc = account("customer");
      return mockReferralRewards(acc.id, acc.name);
    },
  ],
  [
    "GET",
    "/api/referral/stats",
    ({ account }) => {
      const acc = account("customer");
      return mockReferralStats(acc.id, acc.name);
    },
  ],
  [
    "POST",
    "/api/referral/apply",
    ({ account, body }) => {
      const acc = account("customer");
      return mockReferralApply(acc.id, acc.name, String(body?.code ?? ""));
    },
  ],
  [
    "POST",
    "/api/referral/invite",
    ({ account, body }) => {
      const acc = account("customer");
      return mockReferralInvite(
        acc.id,
        acc.name,
        String(body?.channel ?? "share"),
        body?.contact ? String(body.contact) : undefined,
      );
    },
  ],

  /* ------------------------------- wallet ---------------------------------- */
  [
    "GET",
    "/api/wallet",
    ({ account }) => {
      const acc = account();
      return getDb().wallets.find((item) => item.accountId === acc.id) ?? null;
    },
  ],
  [
    "GET",
    "/api/wallet/transactions",
    ({ account }) => {
      const acc = account();
      return getDb().transactions.filter((item) => item.accountId === acc.id);
    },
  ],
  [
    "POST",
    "/api/wallet/topup",
    ({ account, body }) =>
      mutateDb((db) => {
        const acc = account();
        const wallet = db.wallets.find((item) => item.accountId === acc.id);
        const amount = Number(body.amount ?? 0);
        if (wallet) wallet.balance += amount;
        db.transactions.unshift({
          id: `txn-${Date.now().toString(36)}`,
          accountId: acc.id,
          kind: "recharge",
          title: "Wallet Recharge",
          date: new Date().toISOString(),
          amount,
          direction: "credit",
          status: "success",
        });
        return wallet ?? null;
      }),
  ],

  /* ------------------------------ addresses -------------------------------- */
  [
    "GET",
    "/api/addresses",
    ({ account }) => getDb().addresses.filter((item) => item.accountId === account("customer").id),
  ],
  [
    "POST",
    "/api/addresses",
    ({ account, body }) =>
      mutateDb((db) => {
        const customer = account("customer");
        const first = !db.addresses.some((item) => item.accountId === customer.id);
        const isDefault = body.isDefault === true || first;
        const address = {
          ...body,
          id: `addr-${Date.now().toString(36)}`,
          accountId: customer.id,
          isDefault,
        };
        db.addresses.push(address);
        if (isDefault) {
          for (const other of db.addresses) {
            if (other.accountId === customer.id && other.id !== address.id) {
              other.isDefault = false;
            }
          }
        }
        return address;
      }),
  ],
  [
    "PUT",
    "/api/addresses/:id",
    ({ params, body }) => updateMockAddress(params.id!, body),
  ],
  // The customer app sends PATCH for "make this my default address".
  [
    "PATCH",
    "/api/addresses/:id",
    ({ params, body }) => updateMockAddress(params.id!, body),
  ],
  // PUT /api/addresses/:id/default — exactly one default per customer.
  [
    "PUT",
    "/api/addresses/:id/default",
    ({ params }) => updateMockAddress(params.id!, { isDefault: true }),
  ],
  [
    "PATCH",
    "/api/addresses/:id/default",
    ({ params }) => updateMockAddress(params.id!, { isDefault: true }),
  ],
  [
    "DELETE",
    "/api/addresses/:id",
    ({ params }) =>
      mutateDb((db) => {
        const removed = db.addresses.find((item) => item.id === params.id);
        db.addresses = db.addresses.filter((item) => item.id !== params.id);
        if (removed?.isDefault) {
          const survivor = db.addresses.find((item) => item.accountId === removed.accountId);
          if (survivor) survivor.isDefault = true;
        }
        return { ok: true };
      }),
  ],

  /* --------------------------- misc customer data -------------------------- */
  ["GET", "/api/payment-methods", () => getDb().paymentMethods],
  [
    "POST",
    "/api/payment-methods",
    ({ body }) =>
      mutateDb((db) => {
        const method = {
          id: `PM-${8800 + db.paymentMethods.length + 1}`,
          kind: body.kind ?? "upi",
          name: body.name ?? "New method",
          masked: body.masked ?? "",
          note: "Added just now",
          isDefault: false,
        };
        db.paymentMethods = [...db.paymentMethods, method];
        return method;
      }),
  ],
  [
    "PUT",
    "/api/payment-methods/:id",
    ({ params, body }) =>
      mutateDb((db) => {
        db.paymentMethods = db.paymentMethods.map((method) => ({
          ...method,
          ...(method.id === params.id ? body : {}),
          isDefault: body.isDefault === true ? method.id === params.id : method.isDefault,
        }));
        return db.paymentMethods.find((method) => method.id === params.id) ?? null;
      }),
  ],
  [
    "DELETE",
    "/api/payment-methods/:id",
    ({ params }) =>
      mutateDb((db) => {
        db.paymentMethods = db.paymentMethods.filter((method) => method.id !== params.id);
        return { ok: true, id: params.id };
      }),
  ],
  ["GET", "/api/payment-providers", () => SEED_PAYMENT_PROVIDERS],
  [
    "GET",
    "/api/membership",
    ({ account }) => {
      account("customer");
      return SEED_MEMBERSHIP;
    },
  ],
  ["GET", "/api/app-meta", () => SEED_APP_META],
  // Sprint 2.4: one read for the whole checkout screen.
  [
    "GET",
    "/api/checkout",
    ({ account, query }) => {
      const db = getDb();
      const customer = account("customer");
      const state = cartStateFor(db, customer.id, Number(query.get("couponDiscount") ?? 0));
      const addresses = db.addresses.filter((item) => item.accountId === customer.id);
      const selected = addresses.find((item) => item.isDefault) ?? addresses[0];
      const wallet = db.wallets?.find((item) => item.accountId === customer.id);
      const balance = Number(wallet?.balance ?? 0);
      const payable = state.totals.grandTotal;
      return {
        addresses: addresses.map((address) => ({
          ...address,
          line: [address.houseNumber, address.building, address.street]
            .filter(Boolean)
            .join(", "),
          cityLine: `${address.area}, ${address.city} ${address.pincode}`.trim(),
        })),
        selectedAddressId: selected?.id ?? "",
        pickup: {
          days: SEED_SLOT_DAYS,
          slots: SEED_SLOT_TIMES,
          selectedDay: SEED_SLOT_DAYS[0]?.id ?? "",
          selectedSlot: SEED_SLOT_TIMES[0]?.id ?? "",
        },
        store: state.store,
        items: state.items,
        coupons: SEED_CART_COUPONS,
        charges: state.charges,
        totals: state.totals,
        payments: [
          {
            id: "cod",
            kind: "cod",
            name: "Cash on delivery",
            note: "Pay the rider when your laundry arrives",
            enabled: true,
            comingSoon: false,
          },
          {
            id: "wallet",
            kind: "wallet",
            name: "QuickPress wallet",
            note:
              balance >= payable
                ? `Balance ₹${balance}`
                : `Balance ₹${balance} — not enough for this order`,
            enabled: balance >= payable && payable > 0,
            comingSoon: false,
          },
          {
            id: "online",
            kind: "upi",
            name: "UPI / Cards / NetBanking",
            note: "Instant online payment via Razorpay",
            enabled: true,
            comingSoon: false,
          },
        ],
        selectedPaymentId: "cod",
        walletBalance: balance,
        // Standard turnaround: 48 hrs after pickup, same time window.
        deliveryEstimate: `${new Date(Date.now() + 2 * 86400000).toLocaleDateString("en-IN", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        })} · ${SEED_SLOT_TIMES[0]?.label ?? ""}`,
      };
    },
  ],
  [
    "GET",
    "/api/cart/summary",
    ({ account, query }) => {
      const db = getDb();
      const customer = account("customer");
      const state = cartStateFor(db, customer.id, Number(query.get("couponDiscount") ?? 0));
      return {
        store: state.store,
        items: state.items,
        coupons: SEED_CART_COUPONS,
        charges: state.charges,
        totals: state.totals,
      };
    },
  ],
  ["GET", "/api/cart/instructions", () => SEED_CART_INSTRUCTION_CHIPS],
  [
    "GET",
    "/api/offers/page",
    ({ account }) => {
      const db = getDb();
      const customer = account("customer");
      const wallet = db.wallets.find((entry) => entry.accountId === customer.id) ?? null;
      return {
        banners: SEED_OFFER_BANNERS,
        specialOffers: SEED_SPECIAL_OFFERS,
        scratchCards: SEED_SCRATCH_CARDS,
        rewardPoints: wallet?.rewardPoints ?? 0,
      };
    },
  ],
  [
    "GET",
    "/api/help",
    () => ({ topics: SEED_HELP_TOPICS, faqs: SEED_FAQS, contact: SEED_SUPPORT_CONTACT }),
  ],
  ["GET", "/api/cities", () => getDb().cities],
  ["GET", "/api/settings", () => getDb().settings],
  [
    "GET",
    "/api/analytics",
    () => {
      const db = getDb();
      const delivered = db.orders.filter((order) => order.status === "delivered");
      return {
        totalOrders: db.orders.length,
        revenue: delivered.reduce((sum, order) => sum + order.totals.grandTotal, 0),
        partners: db.partners.length,
        riders: db.riders.length,
        customers: db.accounts.filter((item) => item.role === "customer").length,
      };
    },
  ],

  /* --------------------------- partner namespace ---------------------------- */
  [
    "GET",
    "/api/partner/earnings",
    ({ account }) => {
      const partner = account("partner");
      const orders = listOrders({ partnerId: partner.linkedId ?? partner.id }).filter(
        (o) => o.status === "delivered",
      );
      return {
        total: orders.reduce((sum, o) => sum + Math.round(o.totals.grandTotal * 0.8), 0),
        orders: orders.length,
      };
    },
  ],
  [
    "GET",
    "/api/partner/wallet",
    ({ account }) => {
      const partner = account("partner");
      return getDb().wallets.find((item) => item.accountId === partner.id) ?? null;
    },
  ],
  [
    "GET",
    "/api/partner/services",
    ({ account }) => {
      const partner = account("partner");
      const record = getDb().partners.find((item) => item.id === (partner.linkedId ?? partner.id));
      return record?.services ?? [];
    },
  ],
  [
    "GET",
    "/api/partner/notifications",
    ({ account }) => {
      const partner = account("partner");
      return getDb().notifications.filter((item) => item.accountId === partner.id);
    },
  ],
  [
    "GET",
    "/api/partner/reviews",
    ({ account }) => {
      const partner = account("partner");
      return getDb().reviews.filter((item) => item.partnerId === (partner.linkedId ?? partner.id));
    },
  ],

  /* ----------------------------- rider namespace ----------------------------- */
  [
    "GET",
    "/api/rider/wallet",
    ({ account }) => {
      const rider = account("rider");
      return getDb().wallets.find((item) => item.accountId === rider.id) ?? null;
    },
  ],
  [
    "GET",
    "/api/rider/earnings",
    ({ account }) => {
      const rider = account("rider");
      const orders = listOrders({ riderId: rider.linkedId ?? rider.id }).filter(
        (o) => o.status === "delivered",
      );
      return {
        total: orders.reduce((sum, o) => sum + 35 + Math.round(o.totals.grandTotal * 0.05), 0),
        orders: orders.length,
      };
    },
  ],
  [
    "GET",
    "/api/rider/notifications",
    ({ account }) => {
      const rider = account("rider");
      return getDb().notifications.filter((item) => item.accountId === rider.id);
    },
  ],
  [
    "GET",
    "/api/rider/profile",
    ({ account }) => {
      const rider = account("rider");
      return getDb().riders.find((item) => item.id === (rider.linkedId ?? rider.id)) ?? null;
    },
  ],
  [
    "GET",
    "/api/rider/history",
    ({ account }) => {
      const rider = account("rider");
      return listOrders({ riderId: rider.linkedId ?? rider.id }).filter(
        (o) => o.status === "delivered",
      );
    },
  ],

  /* ----------------------------- admin namespace ------------------------------ */
  [
    "GET",
    "/api/admin/analytics",
    ({ account }) => {
      account("admin");
      const db = getDb();
      const delivered = db.orders.filter((order) => order.status === "delivered");
      return {
        totalOrders: db.orders.length,
        revenue: delivered.reduce((sum, order) => sum + order.totals.grandTotal, 0),
        cities: db.cities,
        partners: db.partners.length,
        riders: db.riders.length,
        customers: db.accounts.filter((item) => item.role === "customer").length,
      };
    },
  ],
  [
    "GET",
    "/api/admin/cities",
    ({ account }) => {
      account("admin");
      return getDb().cities;
    },
  ],
  [
    "GET",
    "/api/admin/services",
    ({ account }) => {
      account("admin");
      return getDb().services;
    },
  ],
  [
    "GET",
    "/api/admin/coupons",
    ({ account }) => {
      account("admin");
      return getDb().coupons;
    },
  ],
  [
    "GET",
    "/api/admin/staff",
    ({ account }) => {
      account("admin");
      return getDb().staff;
    },
  ],
  [
    "GET",
    "/api/admin/support",
    ({ account }) => {
      account("admin");
      return getDb().supportTickets;
    },
  ],
  [
    "GET",
    "/api/admin/settings",
    ({ account }) => {
      account("admin");
      return getDb().settings;
    },
  ],
  [
    "PUT",
    "/api/admin/settings",
    ({ account, body }) => {
      account("admin");
      return mutateDb((db) => {
        db.settings = { ...db.settings, ...body };
        return db.settings;
      });
    },
  ],
  [
    "GET",
    "/api/admin/wallet",
    ({ account }) => {
      account("admin");
      const db = getDb();
      return { transactions: db.transactions, wallets: db.wallets };
    },
  ],
  [
    "GET",
    "/api/admin/notifications",
    ({ account }) => {
      account("admin");
      return getDb().notifications;
    },
  ],
  [
    "GET",
    "/api/admin/customers/:id/360",
    ({ params, account }) => {
      account("admin");
      const db = getDb();
      const customer = db.accounts.find(
        (item) => item.id === params.id && item.role === "customer",
      );
      if (!customer) throw new ApiError("not-found", "Customer not found", 404);
      const orders = db.orders.filter((order) => order.customer.id === customer.id);
      const spend = orders.reduce((sum, o) => sum + o.totals.grandTotal, 0);
      return {
        profile: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          city: customer.city || "Kasganj",
          zone: "Central Zone",
          orders: orders.length,
          completedOrders: orders.filter((o) => o.status === "delivered").length,
          cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
          spend: `₹${spend}`,
          spendRaw: spend,
          wallet: "₹150",
          walletRaw: 150,
          loyaltyPoints: 120,
          loyaltyLevel: "Silver Tier",
          membership: "Standard",
          joined: "2026-08-30",
          registrationTimestamp: "2026-08-30T04:49:41.200Z",
          lastActive: "2026-08-30",
          lastLoginTimestamp: "2026-08-30T04:49:42.400Z",
          lastOrder: orders.length > 0 ? "2026-08-31" : "—",
          isVip: spend >= 500,
          status: "Active",
          tags: ["Customer", "Kasganj"],
          addressCount: 1,
          primaryAddress: `${customer.city || "Kasganj"}, Uttar Pradesh`,
          deviceInfo: "Mobile App (Android/iOS)",
        },
        overview: {
          firstOrder: orders.length > 0 ? orders[0].createdAt : "—",
          lastOrder: orders.length > 0 ? orders[orders.length - 1].createdAt : "—",
          firstLoginAt: "2026-08-30T04:49:41.200Z",
          lastLoginAt: "2026-08-30T04:49:42.400Z",
          totalOrders: orders.length,
          completedOrders: orders.filter((o) => o.status === "delivered").length,
          cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
          totalSpent: spend,
          averageOrderValue: orders.length > 0 ? Math.round(spend / orders.length) : 0,
          favoriteService: "Premium Laundry",
          favoritePartner: "QuickPress Kasganj Hub",
          clv: spend,
          walletBalance: 150,
          loyaltyPoints: 120,
          loyaltyLevel: "Silver Tier",
          membership: "Standard Plan",
          referralCode: "QP-100",
          referralEarnings: 50,
          referredCount: 1,
        },
        orders: orders.map((o) => ({
          id: o.id,
          code: o.id,
          service: o.items[0]?.name || "Laundry Order",
          placedOn: o.createdAt,
          total: `₹${o.totals.grandTotal}`,
          amount: o.totals.grandTotal,
          status: o.status,
          partner: "QuickPress Hub",
          address: customer.address || "Kasganj",
        })),
        wallet: {
          balance: 150,
          totalCashback: 50,
          totalRefund: 0,
          referralRewards: 50,
          ledger: [
            {
              id: "tx_1",
              type: "welcome_bonus",
              amount: 100,
              balanceBefore: 0,
              balanceAfter: 100,
              reason: "Welcome signup bonus",
              createdAt: "2026-08-30T04:49:45Z",
            },
          ],
        },
        loyalty: {
          points: 120,
          availablePoints: 120,
          level: "Silver Tier",
          nextLevel: "Gold Tier",
          progressPercent: 40,
        },
        membership: {
          plan: "Standard Plan",
          startDate: "2026-08-30",
          expiryDate: "2027-08-30",
          status: "Active",
          benefits: ["10% discount on 1st order", "Standard support"],
        },
        addresses: [
          {
            id: "addr_1",
            type: "Home",
            fullAddress: `${customer.city || "Kasganj"}, Uttar Pradesh`,
            city: customer.city || "Kasganj",
            pincode: "207123",
            landmark: "Near Main Market",
            isDefault: true,
          },
        ],
        support: [],
        notes: [],
        tags: ["Customer", "Kasganj"],
        activity: [],
        security: {
          status: "Active",
          registrationDate: "2026-08-30",
          registrationTimestamp: "2026-08-30T04:49:41.200Z",
          lastLoginTimestamp: "2026-08-30T04:49:42.400Z",
          deviceInfo: "Mobile App (Android/iOS)",
          ipAddress: "103.212.144.52",
          activeSessions: 1,
          loginHistory: [
            {
              device: "Android 14 (Mobile App)",
              ip: "103.212.144.52",
              at: "2026-08-30T04:49:42.400Z",
              location: "Kasganj, UP",
              action: "Initial OTP Login",
            },
          ],
        },
      };
    },
  ],
  [
    "GET",
    "/api/admin/customers/:id",
    ({ params, account }) => {
      account("admin");
      const db = getDb();
      const customer = db.accounts.find(
        (item) => item.id === params.id && item.role === "customer",
      );
      if (!customer) throw new ApiError("not-found", "Customer not found", 404);
      const orders = db.orders.filter((order) => order.customer.id === customer.id);
      return {
        ...customer,
        orders: orders.length,
        spend: orders.reduce((sum, o) => sum + o.totals.grandTotal, 0),
      };
    },
  ],
  [
    "GET",
    "/api/admin/partners/:id",
    ({ params, account }) => {
      account("admin");
      const partner = getDb().partners.find((item) => item.id === params.id);
      if (!partner) throw new ApiError("not-found", "Partner not found", 404);
      return partner;
    },
  ],
  [
    "GET",
    "/api/admin/riders/:id",
    ({ params, account }) => {
      account("admin");
      const rider = getDb().riders.find((item) => item.id === params.id);
      if (!rider) throw new ApiError("not-found", "Rider not found", 404);
      return rider;
    },
  ],
  [
    "GET",
    "/api/admin/riders/:id/360",
    ({ params, account }) => {
      account("admin");
      const rider = getDb().riders.find((item) => item.id === params.id) || {
        id: params.id,
        name: "Rahul Express Rider",
        phone: "+91 98719 62596",
        email: "rahul@quickpress.online",
        city: "Kasganj",
        vehicle: "Motorbike",
        plate: "UP-87-AK-4402",
        trips: 18,
        rating: 4.9,
        isOnline: true,
        status: "active",
        kycStatus: "verified",
        bankName: "HDFC Bank",
        accountLast4: "9821",
        ifsc: "HDFC0001824",
      };
      return {
        profile: rider,
        overview: {
          firstLoginAt: "2026-08-30T04:50:28Z",
          lastLoginAt: "2026-08-30T04:50:29Z",
          registrationTimestamp: "2026-08-30T04:50:28Z",
          totalTrips: rider.trips || 18,
          completedDeliveries: rider.trips || 18,
          cancelledDeliveries: 0,
          onTimeDeliveryRate: 98.2,
          acceptanceRate: 99.0,
          averageRating: rider.rating || 4.9,
          totalKmCovered: 84,
          avgDeliveryTimeMins: 22,
          assignedHub: "QuickPress Kasganj Main Hub",
          serviceZone: "Kasganj City Center (0-12 km)",
          batteryLevel: 88,
        },
        vehicle: {
          vehicleType: rider.vehicle || "Motorbike",
          vehicleModel: "Hero Splendor Plus",
          vehicleNumber: rider.plate || "UP-87-AK-4402",
          drivingLicenseNumber: "UP8720230048123",
          rcNumber: "RC-UP87AK4402",
          insuranceExpiry: "2027-04-15",
          pollutionExpiry: "2026-11-20",
        },
        kyc: {
          status: "Verified",
          verifiedAt: "2026-08-30T04:50:28Z",
          documents: [
            {
              id: "doc_dl",
              type: "Driving License",
              name: `DL: ${rider.plate || "UP8720230048123"}`,
              documentUrl: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=600&auto=format&fit=crop&q=80",
              status: "Verified",
              uploadedAt: "2026-08-30T04:50:28Z",
            },
            {
              id: "doc_rc",
              type: "Vehicle RC",
              name: `RC: ${rider.plate || "UP-87-AK-4402"}`,
              documentUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&auto=format&fit=crop&q=80",
              status: "Verified",
              uploadedAt: "2026-08-30T04:50:28Z",
            },
          ],
        },
        trips: [
          {
            id: "ord_101",
            orderCode: "QP1001",
            service: "Express Laundry",
            partner: "Kasganj Central Hub",
            customer: "Amit Sharma",
            pickupAddress: "Station Road, Kasganj",
            dropAddress: "Civil Lines, Kasganj",
            distanceKm: 3.2,
            earning: 65.0,
            tip: 20.0,
            rating: 5.0,
            status: "delivered",
            placedAt: "2026-08-30T10:00:00Z",
            deliveredAt: "2026-08-30T10:45:00Z",
          },
        ],
        wallet: {
          balance: 1450.0,
          codCashInHand: 320.0,
          totalEarnings: 3200.0,
          incentiveBonus: 350.0,
          tipsEarned: 140.0,
          ledger: [
            {
              id: "tx_r1",
              type: "trip_earning",
              amount: 65.0,
              balanceBefore: 1385.0,
              balanceAfter: 1450.0,
              reason: "Delivery fee credited for Order QP1001",
              createdAt: "2026-08-30T10:45:00Z",
            },
          ],
        },
        payouts: {
          bankName: rider.bankName || "HDFC Bank",
          accountNumber: `•••• •••• ${rider.accountLast4 || "9821"}`,
          ifsc: rider.ifsc || "HDFC0001824",
          upiId: `${(rider.phone || "9871962596").replace(/[^0-9]/g, "").slice(-10)}@paytm`,
          beneficiaryName: rider.name,
          payoutHistory: [
            {
              id: "PAY-8821",
              amount: 2500.0,
              utrNumber: "UTR99281726354",
              bankRef: "HDFC-NEFT-8821",
              status: "Processed",
              processedAt: "2026-08-28T18:30:00Z",
            },
          ],
        },
        shifts: [
          {
            date: "2026-08-31",
            loginAt: "09:00 AM",
            logoutAt: "07:30 PM",
            onlineHours: 10.5,
            ordersCompleted: 6,
            status: "Completed",
          },
        ],
        security: {
          status: "Active",
          registrationTimestamp: "2026-08-30T04:50:28Z",
          lastLoginTimestamp: "2026-08-30T04:50:29Z",
          deviceInfo: "Android 14 · Xiaomi Redmi Note 13 Pro",
          appVersion: "QuickPress Rider v2.4.1",
          ipAddress: "103.212.144.60",
          activeSessions: 1,
          loginHistory: [
            {
              device: "Xiaomi Redmi Note 13 Pro",
              ip: "103.212.144.60",
              at: "2026-08-30T04:50:29Z",
              location: "Kasganj, Uttar Pradesh",
              action: "OTP Shift Login",
            },
          ],
        },
      };
    },
  ],
  [
    "POST",
    "/api/admin/riders/:id/wallet/adjust",
    ({ params, body, account }) => {
      account("admin");
      return { ok: true, newBalance: 1950.0, newCodCash: 0.0 };
    },
  ],
  [
    "POST",
    "/api/admin/riders/:id/notify",
    ({ params, body, account }) => {
      account("admin");
      return { ok: true, sent: true, riderId: params.id };
    },
  ],
  [
    "POST",
    "/api/admin/riders/:id/logout-sessions",
    ({ params, account }) => {
      account("admin");
      return { ok: true, invalidated: true, riderId: params.id };
    },
  ],
  [
    "POST",
    "/api/admin/customers/:id/block",
    ({ params, account }) => {
      account("admin");
      return { ok: true, id: params.id, blocked: true };
    },
  ],
  [
    "POST",
    "/api/admin/customers/:id/unblock",
    ({ params, account }) => {
      account("admin");
      return { ok: true, id: params.id, blocked: false };
    },
  ],
  [
    "POST",
    "/api/admin/partners/:id/approve",
    ({ params, account }) =>
      account("admin") &&
      mutateDb((db) => {
        const partner = db.partners.find((item) => item.id === params.id);
        if (partner) partner.status = "active";
        return partner ?? null;
      }),
  ],
  [
    "POST",
    "/api/admin/partners/:id/suspend",
    ({ params, account }) =>
      account("admin") &&
      mutateDb((db) => {
        const partner = db.partners.find((item) => item.id === params.id);
        if (partner) partner.status = "suspended";
        return partner ?? null;
      }),
  ],
  [
    "POST",
    "/api/admin/partners/:id/activate",
    ({ params, account }) =>
      account("admin") &&
      mutateDb((db) => {
        const partner = db.partners.find((item) => item.id === params.id);
        if (partner) partner.status = "active";
        return partner ?? null;
      }),
  ],
  [
    "POST",
    "/api/admin/partners/:id/reject",
    ({ params, account }) =>
      account("admin") &&
      mutateDb((db) => {
        const partner = db.partners.find((item) => item.id === params.id);
        if (partner) partner.status = "suspended";
        return partner ?? null;
      }),
  ],
  [
    "POST",
    "/api/admin/riders/:id/approve",
    ({ params, account }) =>
      account("admin") &&
      mutateDb((db) => {
        const rider = db.riders.find((item) => item.id === params.id);
        if (rider) rider.status = "active";
        return rider ?? null;
      }),
  ],
  [
    "POST",
    "/api/admin/riders/:id/suspend",
    ({ params, account }) =>
      account("admin") &&
      mutateDb((db) => {
        const rider = db.riders.find((item) => item.id === params.id);
        if (rider) rider.status = "suspended";
        return rider ?? null;
      }),
  ],
  [
    "POST",
    "/api/admin/riders/:id/activate",
    ({ params, account }) =>
      account("admin") &&
      mutateDb((db) => {
        const rider = db.riders.find((item) => item.id === params.id);
        if (rider) rider.status = "active";
        return rider ?? null;
      }),
  ],
  [
    "POST",
    "/api/admin/riders/:id/reject",
    ({ params, account }) =>
      account("admin") &&
      mutateDb((db) => {
        const rider = db.riders.find((item) => item.id === params.id);
        if (rider) rider.status = "suspended";
        return rider ?? null;
      }),
  ],
  [
    "POST",
    "/api/admin/wallet/withdrawals/:id/approve",
    ({ params, account }) => {
      account("admin");
      return { ok: true, id: params.id, action: "approve" };
    },
  ],
  [
    "POST",
    "/api/admin/wallet/withdrawals/:id/reject",
    ({ params, account }) => {
      account("admin");
      return { ok: true, id: params.id, action: "reject" };
    },
  ],

  /* ------------------------- developer tooling ------------------------- */
  /* Mock-only endpoints used by the Mock Testing Panel. They never ship to
     the real backend and no app screen depends on them. */
  ["GET", "/api/dev/stats", () => mockStats()],
  [
    "GET",
    "/api/dev/orders",
    ({ query }) =>
      devOrders({
        status: query.get("status") ?? undefined,
        limit: Number(query.get("limit") ?? 25),
      }),
  ],
  ["POST", "/api/dev/reset", () => devReset()],
  ["POST", "/api/dev/seed", ({ body }) => devReseed(body ?? {})],
  ["POST", "/api/dev/mode", ({ body }) => setDevState(body ?? {})],
  ["POST", "/api/dev/log/clear", () => clearDevLog()],
  ["POST", "/api/dev/tick", ({ body }) => devTick(Number(body?.count ?? 3))],
  ["POST", "/api/dev/orders/:id/advance", ({ params }) => devAdvanceOrder(params.id!)],
  ["POST", "/api/dev/orders/:id/complete", ({ params }) => devCompleteOrder(params.id!)],
  [
    "POST",
    "/api/dev/orders/:id/cancel",
    ({ params, body }) =>
      devCancelOrder(params.id!, body?.reason ?? "Cancelled from testing panel"),
  ],
  ["POST", "/api/dev/clear", () => devClear()],
  ["POST", "/api/dev/orders/advance-all", () => devAdvanceAllLive()],
  [
    "POST",
    "/api/dev/generate/customers",
    ({ body }) => devGenerateCustomers(Number(body?.count ?? 5)),
  ],
  [
    "POST",
    "/api/dev/generate/partners",
    ({ body }) => devGeneratePartners(Number(body?.count ?? 5)),
  ],
  ["POST", "/api/dev/generate/riders", ({ body }) => devGenerateRiders(Number(body?.count ?? 5))],
  ["POST", "/api/dev/generate/orders", ({ body }) => devGenerateOrders(Number(body?.count ?? 5))],
  [
    "POST",
    "/api/dev/notifications/simulate",
    ({ body }) =>
      devSimulateNotification({
        role: (body?.role ?? "customer") as "customer" | "partner" | "rider" | "admin",
        kind: body?.kind as string | undefined,
        title: body?.title as string | undefined,
        description: body?.description as string | undefined,
      }),
  ],

  /* ------------------------- misc catalog/location ------------------------- */
  [
    "GET",
    "/api/locations",
    () => ({
      recent: SEED_LOCATIONS_RECENT,
      saved: SEED_LOCATIONS_SAVED,
      nearby: SEED_LOCATIONS_NEARBY,
      popular: SEED_LOCATIONS_POPULAR,
    }),
  ],
  [
    "GET",
    "/api/locations/search",
    ({ query }) => {
      const q = (query.get("q") ?? "").toLowerCase();
      const all = [
        ...SEED_LOCATIONS_RECENT,
        ...SEED_LOCATIONS_SAVED,
        ...SEED_LOCATIONS_NEARBY,
        ...SEED_LOCATIONS_POPULAR,
      ];
      if (!q) return all;
      return all.filter(
        (place) => place.area.toLowerCase().includes(q) || place.city.toLowerCase().includes(q),
      );
    },
  ],
  ["GET", "/api/countries", () => SEED_COUNTRIES],
  ["GET", "/api/slots", () => ({ days: SEED_SLOT_DAYS, slots: SEED_SLOT_TIMES })],
  ["GET", "/api/help/topics", () => SEED_HELP_TOPICS],
  ["GET", "/api/help/faqs", () => SEED_FAQS],
  ["GET", "/api/support/contact", () => SEED_SUPPORT_CONTACT],

  /* --------------------------- admin: coupons/staff/support/etc ------------ */
  [
    "POST",
    "/api/admin/coupons",
    ({ body, account }) => {
      account("admin");
      return mutateDb((db) => {
        const coupon = {
          id: `C-${db.coupons.length + 1}`,
          code: body.code ?? "NEWCODE",
          discount: body.discount ?? "10% OFF",
          description: body.description ?? "",
          expiry: body.expiry ?? "",
          minOrder: Number(body.minOrder ?? 0),
          status: body.status ?? "Active",
        };
        db.coupons.push(coupon);
        return coupon;
      });
    },
  ],
  [
    "PUT",
    "/api/admin/coupons/:id",
    ({ params, body, account }) => {
      account("admin");
      return mutateDb((db) => {
        const coupon = db.coupons.find((item) => item.id === params.id);
        if (coupon) Object.assign(coupon, body);
        return coupon ?? null;
      });
    },
  ],
  [
    "DELETE",
    "/api/admin/coupons/:id",
    ({ params, account }) => {
      account("admin");
      return mutateDb((db) => {
        db.coupons = db.coupons.filter((item) => item.id !== params.id);
        return { ok: true };
      });
    },
  ],
  [
    "POST",
    "/api/admin/staff",
    ({ body, account }) => {
      account("admin");
      return mutateDb((db) => {
        const staff = {
          id: `ST-${db.staff.length + 1}`,
          name: body.name ?? "New Member",
          email: body.email ?? "",
          role: body.role ?? "Ops manager",
          scope: body.scope ?? "All cities",
          lastActive: "—",
          status: "Invited" as const,
        };
        db.staff.push(staff);
        return staff;
      });
    },
  ],
  [
    "PUT",
    "/api/admin/staff/:id",
    ({ params, body, account }) => {
      account("admin");
      return mutateDb((db) => {
        const staff = db.staff.find((item) => item.id === params.id);
        if (staff) Object.assign(staff, body);
        return staff ?? null;
      });
    },
  ],
  [
    "GET",
    "/api/admin/staff/roles",
    ({ account }) => {
      account("admin");
      const db = getDb();
      const roles = [...new Set(db.staff.map((item) => item.role))];
      return roles.map((role, index) => ({
        id: `RO-${index + 1}`,
        name: role,
        members: db.staff.filter((item) => item.role === role).length,
        permissions: ["orders:read"],
      }));
    },
  ],
  [
    "GET",
    "/api/admin/staff/logs",
    ({ account }) => {
      account("admin");
      const db = getDb();
      return db.notifications
        .filter((item) => item.role === "admin")
        .slice(0, 20)
        .map((item) => ({
          id: item.id,
          actor: "System",
          action: item.title,
          target: item.description,
          at: item.createdAt,
        }));
    },
  ],
  [
    "GET",
    "/api/admin/support/:id",
    ({ params, account }) => {
      account("admin");
      const ticket = getDb().supportTickets.find((item) => item.id === params.id);
      if (!ticket) throw new ApiError("not-found", "Ticket not found", 404);
      return ticket;
    },
  ],
  [
    "POST",
    "/api/admin/support/:id/reply",
    ({ params, body, account }) => {
      account("admin");
      return { ok: true, ticketId: params.id, body: body?.body ?? "" };
    },
  ],
  [
    "POST",
    "/api/admin/support/:id/close",
    ({ params, account }) => {
      account("admin");
      return mutateDb((db) => {
        const ticket = db.supportTickets.find((item) => item.id === params.id);
        if (ticket) ticket.status = "Resolved";
        return ticket ?? null;
      });
    },
  ],
  [
    "POST",
    "/api/admin/notifications/broadcast",
    ({ body, account }) => {
      account("admin");
      return mutateDb((db) => {
        const audience = body.audience ?? "All";
        const targets = db.accounts.filter(
          (item) =>
            audience === "All" || item.role === String(audience).toLowerCase().replace(/s$/, ""),
        );
        for (const target of targets) {
          db.notifications.unshift({
            id: `ntf-${target.id}-${Date.now().toString(36)}`,
            accountId: target.id,
            role: target.role,
            kind: "system",
            title: body.title ?? "Announcement",
            description: body.message ?? "",
            createdAt: new Date().toISOString(),
            read: false,
          });
        }
        return { ok: true, reached: targets.length };
      });
    },
  ],
  [
    "GET",
    "/api/admin/cities/stats",
    ({ account }) => {
      account("admin");
      return {
        totalCities: 5,
        totalZones: 8,
        totalGeoRevenue: 366,
        totalCityCustomers: 19,
        totalPartnerHubs: 8,
        totalActiveCaptains: 17,
        avgDeliveryRadius: 15.0,
      };
    },
  ],
  [
    "GET",
    "/api/admin/cities/intelligence",
    ({ account }) => {
      account("admin");
      const db = getDb();
      return (db.cities || []).map((c: any) => ({
        _id: c.id,
        id: c.id,
        city: c.city,
        name: c.city,
        state: c.state || "Uttar Pradesh",
        country: "India",
        tier: "Tier-2",
        status: c.status || "Live",
        deliveryRadiusKm: 15.0,
        pickupRadius: "15 km",
        baseDeliveryFee: 20.0,
        perKmFee: 5.0,
        freeDeliveryAbove: 199.0,
        minOrderValue: 99.0,
        surgeMultiplier: 1.0,
        center: { lat: 27.8083, lng: 78.6473 },
        pincodes: ["207123", "207124", "207125"],
        zones: [
          {
            zoneId: "zone-ksj-1",
            name: "Central Kasganj & Main Market",
            sector: "Sector 1",
            radiusKm: 5.0,
            lat: 27.8083,
            lng: 78.6473,
            pincodes: ["207123"],
            status: "Operational",
            baseFee: 20.0,
          },
          {
            zoneId: "zone-ksj-2",
            name: "Bilram Gate & Nadrai Hub",
            sector: "Sector 2",
            radiusKm: 6.5,
            lat: 27.8150,
            lng: 78.6410,
            pincodes: ["207123", "207124"],
            status: "Operational",
            baseFee: 20.0,
          },
        ],
        totalZones: 2,
        financials: {
          grossRevenue: c.city === "Kasganj" ? 366 : 0,
          platformCommission: c.city === "Kasganj" ? 65.88 : 0,
          partnerEarnings: c.city === "Kasganj" ? 256.2 : 0,
          riderEarnings: c.city === "Kasganj" ? 43.92 : 0,
          totalOrders: c.city === "Kasganj" ? 13 : 0,
          deliveredOrders: c.city === "Kasganj" ? 2 : 0,
          liveOrders: c.city === "Kasganj" ? 7 : 0,
          cancelledOrders: 0,
          aov: 183.0,
        },
        totalCustomers: c.city === "Kasganj" ? 19 : 0,
        totalPartners: c.city === "Kasganj" ? 8 : 0,
        activePartners: c.city === "Kasganj" ? 7 : 0,
        totalRiders: c.city === "Kasganj" ? 17 : 0,
        onlineRiders: c.city === "Kasganj" ? 6 : 0,
        partnerList: [
          {
            id: "prt-1",
            name: "Kasganj Super Clean Hub",
            address: "Main Market, Kasganj",
            phone: "+91 98765 43210",
            rating: 4.9,
            status: "active",
          },
        ],
        riderList: [
          {
            riderId: "rdr-1",
            name: "Rahul Express Rider",
            phone: "+91 98719 62596",
            vehicle: "Motorbike",
            plate: "UP-87-AK-4402",
            rating: 4.9,
            liveState: "Online",
            trips: 8,
            earnings: 59.0,
          },
        ],
        customerList: [],
        recentOrders: [],
      }));
    },
  ],
  [
    "GET",
    "/api/admin/cities/:id/areas",
    ({ params, account }) => {
      account("admin");
      const city = getDb().cities.find((item) => item.id === params.id);
      if (!city) throw new ApiError("not-found", "City not found", 404);
      return Array.from({ length: city.areas }, (_, index) => ({
        id: `${city.id}-area-${index + 1}`,
        area: `Zone ${index + 1}`,
        city: city.city,
        status: city.status,
      }));
    },
  ],
  [
    "PATCH",
    "/api/admin/cities/:id/radius",
    ({ params, body, account }) => {
      account("admin");
      return mutateDb((db) => {
        const city = db.cities.find((item) => item.id === params.id);
        if (city) Object.assign(city, body);
        return city ?? null;
      });
    },
  ],
  [
    "POST",
    "/api/admin/cities/:id/zones",
    ({ params, body, account }) => {
      account("admin");
      return mutateDb((db) => {
        const city = db.cities.find((item) => item.id === params.id);
        return city ?? null;
      });
    },
  ],
  [
    "POST",
    "/api/admin/cities",
    ({ body, account }) => {
      account("admin");
      return mutateDb((db) => {
        const city = {
          id: `CI-${db.cities.length + 1}`,
          city: body.city ?? "New City",
          state: body.state ?? "",
          areas: Number(body.areas ?? 0),
          partners: 0,
          riders: 0,
          pickupRadius: body.pickupRadius ?? "5 km",
          status: body.status ?? "Pilot",
        };
        db.cities.push(city);
        return city;
      });
    },
  ],
  [
    "PUT",
    "/api/admin/cities/:id",
    ({ params, body, account }) => {
      account("admin");
      return mutateDb((db) => {
        const city = db.cities.find((item) => item.id === params.id);
        if (city) Object.assign(city, body);
        return city ?? null;
      });
    },
  ],
  [
    "GET",
    "/api/admin/services/stats",
    ({ account }) => {
      account("admin");
      const db = getDb();
      return {
        totalServices: db.services?.length || 6,
        totalServiceRevenue: 492,
        totalOrdersDelivered: 20,
        topGrossingService: "Wash & Iron",
        topGrossingRevenue: 372,
        activeRidersDispatching: 5,
        activePartnerStores: 8,
      };
    },
  ],
  [
    "GET",
    "/api/admin/services/intelligence",
    ({ account }) => {
      account("admin");
      const db = getDb();
      const services = db.services || [];
      const categories = db.categories || [];
      const catMap = new Map(categories.map((c: any) => [c.id, c.name]));
      return services.map((s: any) => ({
        id: s.id,
        name: s.name,
        category: catMap.get(s.categoryId) || "Laundry",
        categoryId: s.categoryId,
        unit: s.unit || "per kg",
        basePrice: Number(s.price || 60),
        description: s.description || "",
        sla: "24 hrs",
        status: "Active",
        financials: {
          grossRevenue: s.name.includes("Iron") ? 372 : 120,
          platformCommission: s.name.includes("Iron") ? 66.96 : 21.6,
          partnerEarnings: s.name.includes("Iron") ? 260.4 : 84.0,
          riderEarnings: s.name.includes("Iron") ? 44.64 : 14.4,
          totalOrders: s.name.includes("Iron") ? 10 : 4,
          completedOrders: s.name.includes("Iron") ? 8 : 3,
          inProgressOrders: 1,
          cancelledOrders: 0,
          aov: Number(s.price || 60),
        },
        assignedRiders: [
          {
            riderId: "rdr-1",
            name: "Rahul Express Rider",
            phone: "+91 98719 62596",
            vehicle: "Motorbike",
            plate: "UP-87-AK-4402",
            rating: 4.9,
            liveState: "Online",
            tripsForThisService: 6,
            earningsForThisService: 44.64,
          },
          {
            riderId: "rdr-2",
            name: "Test Rider",
            phone: "+91 98765 43210",
            vehicle: "EV Scooter",
            plate: "UP-87-EV-1008",
            rating: 4.8,
            liveState: "On delivery",
            tripsForThisService: 4,
            earningsForThisService: 28.5,
          },
        ],
        partnerStoresCount: 8,
        recentOrders: [],
      }));
    },
  ],
  [
    "GET",
    "/api/admin/services/categories",
    ({ account }) => {
      account("admin");
      return getDb().categories;
    },
  ],
  [
    "GET",
    "/api/admin/services/pricing",
    ({ account }) => {
      account("admin");
      return getDb().services.map((service) => ({
        id: service.id,
        item: service.name,
        service: service.name,
        city: getDb().settings.defaultCity,
        price: service.price,
        commission: getDb().settings.defaultCommission,
      }));
    },
  ],
  [
    "POST",
    "/api/admin/services",
    ({ body, account }) => {
      account("admin");
      return mutateDb((db) => {
        const service = {
          id: `s${db.services.length + 1}`,
          name: body.name ?? "New Service",
          categoryId: body.categoryId ?? db.categories[0]?.id ?? "",
          unit: body.unit ?? "per item",
          price: Number(body.price ?? 0),
          image: body.image ?? "",
          description: body.description ?? "",
          badge: null,
          popular: false,
        };
        db.services.push(service);
        return service;
      });
    },
  ],
  [
    "PUT",
    "/api/admin/services/:id",
    ({ params, body, account }) => {
      account("admin");
      return mutateDb((db) => {
        const service = db.services.find((item) => item.id === params.id);
        if (service) Object.assign(service, body);
        return service ?? null;
      });
    },
  ],
  [
    "GET",
    "/api/admin/dashboard/activity",
    ({ account }) => {
      account("admin");
      return getDb()
        .orders.slice()
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .slice(0, 10)
        .map((order) => ({
          id: order.id,
          title: `Order ${order.code}: ${statusLabel(order)}`,
          meta: `${order.partner.city} · ${order.serviceLabel}`,
          time: order.updatedAt,
          tone:
            order.status === "cancelled"
              ? "danger"
              : order.status === "delivered"
                ? "success"
                : "default",
        }));
    },
  ],
  [
    "GET",
    "/api/admin/dashboard/revenue-series",
    ({ account }) => {
      account("admin");
      const db = getDb();
      const byDay = new Map<string, { value: number; secondary: number }>();
      for (const order of db.orders) {
        const day = order.createdAt.slice(0, 10);
        const entry = byDay.get(day) ?? { value: 0, secondary: 0 };
        if (order.status === "delivered") entry.value += order.totals.grandTotal;
        entry.secondary += order.totals.grandTotal;
        byDay.set(day, entry);
      }
      return [...byDay.entries()]
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .slice(-7)
        .map(([label, values]) => ({ label, ...values }));
    },
  ],
  [
    "GET",
    "/api/admin/dashboard/orders-series",
    ({ account }) => {
      account("admin");
      const db = getDb();
      const byDay = new Map<string, { value: number; secondary: number }>();
      for (const order of db.orders) {
        const day = order.createdAt.slice(0, 10);
        const entry = byDay.get(day) ?? { value: 0, secondary: 0 };
        entry.value += 1;
        if (order.status === "cancelled") entry.secondary += 1;
        byDay.set(day, entry);
      }
      return [...byDay.entries()]
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .slice(-7)
        .map(([label, values]) => ({ label, ...values }));
    },
  ],
  [
    "GET",
    "/api/admin/dashboard/latest-orders",
    ({ account }) => {
      account("admin");
      return getDb()
        .orders.slice()
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .slice(0, 8)
        .map((order) => toAdminOrderRow(order, statusLabel(order)));
    },
  ],
  [
    "GET",
    "/api/admin/wallet/kpis",
    ({ account }) => {
      account("admin");
      const db = getDb();
      const delivered = db.orders.filter((order) => order.status === "delivered");
      const revenue = delivered.reduce((sum, order) => sum + order.totals.grandTotal, 0);
      const commission = Math.round(revenue * 0.18);
      const pendingPayouts = db.wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
      const refunds = db.transactions
        .filter((t) => t.kind === "refund")
        .reduce((sum, t) => sum + t.amount, 0);
      return [
        { id: "revenue", label: "Platform revenue", value: revenue, positive: true },
        { id: "commission", label: "Commission earned", value: commission, positive: true },
        { id: "payouts", label: "Pending payouts", value: pendingPayouts, positive: false },
        { id: "refunds", label: "Refunds", value: refunds, positive: true },
      ];
    },
  ],
  [
    "GET",
    "/api/admin/wallet/revenue-split",
    ({ account }) => {
      account("admin");
      const db = getDb();
      const byDay = new Map<string, { value: number; secondary: number }>();
      for (const order of db.orders.filter((o) => o.status === "delivered")) {
        const day = order.createdAt.slice(0, 7);
        const entry = byDay.get(day) ?? { value: 0, secondary: 0 };
        entry.value += order.totals.grandTotal;
        entry.secondary += Math.round(order.totals.grandTotal * 0.18);
        byDay.set(day, entry);
      }
      return [...byDay.entries()]
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([label, v]) => ({ label, ...v }));
    },
  ],
  [
    "GET",
    "/api/admin/wallet/partner-earnings",
    ({ account }) => {
      account("admin");
      const db = getDb();
      return db.partners.map((partner) => {
        const orders = db.orders.filter(
          (order) => order.partner.id === partner.id && order.status === "delivered",
        );
        const gross = orders.reduce((sum, order) => sum + order.totals.grandTotal, 0);
        const commission = Math.round(gross * 0.18);
        return {
          id: partner.id,
          account: partner.name,
          city: partner.city,
          orders: orders.length,
          gross,
          commission,
          net: gross - commission,
        };
      });
    },
  ],
  [
    "GET",
    "/api/admin/wallet/rider-earnings",
    ({ account }) => {
      account("admin");
      const db = getDb();
      return db.riders.map((rider) => {
        const orders = db.orders.filter(
          (order) => order.rider?.id === rider.id && order.status === "delivered",
        );
        const gross = orders.reduce(
          (sum, order) => sum + 35 + Math.round(order.totals.grandTotal * 0.05),
          0,
        );
        return {
          id: rider.id,
          account: rider.name,
          city: rider.city,
          orders: orders.length,
          gross,
          commission: 0,
          net: gross,
        };
      });
    },
  ],
  [
    "GET",
    "/api/admin/wallet/withdrawals",
    ({ account }) => {
      account("admin");
      return getDb().transactions.filter((t) => t.kind === "payout");
    },
  ],
  [
    "GET",
    "/api/admin/wallet/refunds",
    ({ account }) => {
      account("admin");
      return getDb().transactions.filter((t) => t.kind === "refund");
    },
  ],
  [
    "GET",
    "/api/admin/wallet/transactions",
    ({ account }) => {
      account("admin");
      return getDb().transactions;
    },
  ],

  /* -------------------------- partner: settings/services/history ---------- */
  [
    "GET",
    "/api/partner/settings",
    ({ account }) => {
      const partner = account("partner");
      const record = getDb().partners.find((item) => item.id === (partner.linkedId ?? partner.id));
      if (!record) throw new ApiError("not-found", "Partner store not found", 404);
      return {
        isStoreOpen: record.isOpen,
        acceptingNewOrders: record.acceptingNewOrders,
        autoAcceptOrders: record.autoAccept,
        expressDelivery: true,
        pickupRadiusKm: 6,
        openingTime: "08:00",
        closingTime: "21:00",
        weeklyOff: "Sunday",
        dailyOrderCap: 40,
      };
    },
  ],
  [
    "PUT",
    "/api/partner/settings",
    ({ account, body }) => {
      const partner = account("partner");
      return mutateDb((db) => {
        const record = db.partners.find((item) => item.id === (partner.linkedId ?? partner.id));
        if (record) {
          if (body.isStoreOpen !== undefined) record.isOpen = Boolean(body.isStoreOpen);
          if (body.acceptingNewOrders !== undefined)
            record.acceptingNewOrders = Boolean(body.acceptingNewOrders);
          if (body.autoAcceptOrders !== undefined)
            record.autoAccept = Boolean(body.autoAcceptOrders);
        }
        return { ok: true, ...body };
      });
    },
  ],
  [
    "PUT",
    "/api/partner/profile",
    ({ account, body }) => {
      const partner = account("partner");
      return mutateDb((db) => {
        const record = db.partners.find((item) => item.id === (partner.linkedId ?? partner.id));
        if (record) Object.assign(record, body);
        return record ?? null;
      });
    },
  ],
  [
    "PUT",
    "/api/partner/services/:id",
    ({ account, params, body }) => {
      const partner = account("partner");
      return mutateDb((db) => {
        const record = db.partners.find((item) => item.id === (partner.linkedId ?? partner.id));
        const service = record?.services.find((item) => item.id === params.id);
        if (service) Object.assign(service, body);
        return service ?? null;
      });
    },
  ],
  [
    "GET",
    "/api/partner/history",
    ({ account }) => {
      const partner = account("partner");
      return listOrders({ partnerId: partner.linkedId ?? partner.id }).filter(
        (o) => o.status === "delivered" || o.status === "cancelled",
      );
    },
  ],

  /* --------------------------- rider: settings/profile/online -------------- */
  [
    "GET",
    "/api/rider/settings",
    ({ account }) => {
      const rider = account("rider");
      const record = getDb().riders.find((item) => item.id === (rider.linkedId ?? rider.id));
      return {
        isOnline: record?.isOnline ?? false,
        vehicle: record?.vehicle ?? "",
        plate: record?.plate ?? "",
        notificationsEnabled: true,
      };
    },
  ],
  [
    "PUT",
    "/api/rider/profile",
    ({ account, body }) => {
      const rider = account("rider");
      return mutateDb((db) => {
        const record = db.riders.find((item) => item.id === (rider.linkedId ?? rider.id));
        if (record) Object.assign(record, body);
        return record ?? null;
      });
    },
  ],
  [
    "POST",
    "/api/rider/online",
    ({ account, body }) => {
      const rider = account("rider");
      return mutateDb((db) => {
        const record = db.riders.find((item) => item.id === (rider.linkedId ?? rider.id));
        if (record) record.isOnline = Boolean(body?.isOnline ?? !record.isOnline);
        return { ok: true, isOnline: record?.isOnline ?? false };
      });
    },
  ],
  ["GET", "/api/rider/auth/existing-numbers", () => getDb().riders.map((rider) => rider.phone)],
  [
    "POST",
    "/api/auth/admin/pin",
    ({ body }: any) => {
      const pin = String(body?.pin || "").trim();
      if (pin !== "4502") {
        throw new ApiError("unauthorized", "Incorrect Admin Passcode (PIN). Access denied.", 401);
      }
      return {
        token: "mock-admin-jwt-token-4502",
        refreshToken: "mock-admin-refresh-token-4502",
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        account: {
          id: "admin-root",
          role: "admin",
          name: "QuickPress Super Admin",
          email: "admin@quickpress.online",
          phone: "+910000004502",
          status: "active",
          isVerified: true,
          isOnboarded: true,
        },
      };
    },
  ],
];

function match(
  method: string,
  pathname: string,
): { handler: Handler; params: Record<string, string> } | null {
  const segments = pathname.split("/").filter(Boolean);
  for (const [routeMethod, pattern, handler] of routes) {
    if (routeMethod !== method) continue;
    const patternSegments = pattern.split("/").filter(Boolean);
    if (patternSegments.length !== segments.length) continue;
    const params: Record<string, string> = {};
    let ok = true;
    for (let index = 0; index < patternSegments.length; index += 1) {
      const expected = patternSegments[index]!;
      const actual = segments[index]!;
      if (expected.startsWith(":")) params[expected.slice(1)] = decodeURIComponent(actual);
      else if (expected !== actual) {
        ok = false;
        break;
      }
    }
    if (ok) return { handler, params };
  }
  return null;
}

/** Entry point used by `apiRequest` when the transport is in mock mode. */
export async function handleMockRequest<T>(
  method: string,
  path: string,
  context: MockRequestContext = {},
): Promise<T> {
  const [pathname, search = ""] = path.split("?");
  const route = match(method, pathname!);

  if (!route) throw new ApiError("not-found", `${method} ${pathname} is not implemented`, 404);

  await delay(LATENCY_MS, context.signal ?? null);

  const token = context.token ?? null;
  const ctx: Ctx = {
    params: route.params,
    query: new URLSearchParams(search),
    body: (context.body ?? {}) as any,
    token,
    account: (role) => requireAccount(token, role),
  };

  return route.handler(ctx) as T;
}
