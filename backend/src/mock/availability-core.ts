/**
 * Mock Service Availability + Smart Reorder engine — Sprint 2.12.
 *
 * Mirrors `backend-python/app/db/availability_repositories.py` and
 * `reorder_repositories.py` so the customer screens behave identically on the
 * mock transport and against FastAPI. Same rule order, same states, same copy.
 */

import type { CartItemEntity, Order } from "@shared/types";

import { getDb, mutateDb } from "./db";

export type MockAvailabilityState =
  | "available"
  | "service_unavailable"
  | "maintenance"
  | "partner_inactive"
  | "partner_closed"
  | "out_of_service_area"
  | "pickup_unavailable"
  | "delivery_unavailable"
  | "capacity_reached";

type Rule = { id: string; label: string; ok: boolean; detail: string };

const STATE_COPY: Record<MockAvailabilityState, [string, string]> = {
  available: ["Available", "Pickup and delivery are available for this service."],
  service_unavailable: [
    "Service Not Available",
    "This service isn't available right now. Try one of the alternatives below.",
  ],
  maintenance: [
    "Service Temporarily Unavailable",
    "We've paused this service for maintenance. It will be back shortly.",
  ],
  partner_inactive: [
    "Service Not Available",
    "This laundry partner isn't accepting orders at the moment.",
  ],
  partner_closed: [
    "Partner Closed",
    "This store is closed right now. You can schedule with another partner nearby.",
  ],
  out_of_service_area: [
    "Out of Service Area",
    "We don't serve this area yet. Try a nearby PIN code or another location.",
  ],
  pickup_unavailable: ["Out of Service Area", "Doorstep pickup isn't available at this address yet."],
  delivery_unavailable: [
    "Delivery Not Available",
    "We can pick up here, but delivery isn't live in this area yet.",
  ],
  capacity_reached: [
    "Daily Capacity Reached",
    "Today's slots are fully booked. Try another partner or book for tomorrow.",
  ],
};

/** Delivery zones — the mock mirror of the `delivery_zones` collection. */
const ZONES = [
  {
    id: "zone-blr-indiranagar",
    city: "Bengaluru",
    area: "Indiranagar",
    pincodes: ["560038", "560008", "560075"],
    pickupAvailable: true,
    deliveryAvailable: true,
    etaMinutes: 30,
  },
  {
    id: "zone-blr-koramangala",
    city: "Bengaluru",
    area: "Koramangala",
    pincodes: ["560034", "560095", "560047"],
    pickupAvailable: true,
    deliveryAvailable: true,
    etaMinutes: 35,
  },
  {
    id: "zone-blr-whitefield",
    city: "Bengaluru",
    area: "Whitefield",
    pincodes: ["560066", "560067"],
    pickupAvailable: true,
    deliveryAvailable: false,
    etaMinutes: 55,
  },
  {
    id: "zone-blr-hebbal",
    city: "Bengaluru",
    area: "Hebbal",
    pincodes: ["560024", "560092"],
    pickupAvailable: true,
    deliveryAvailable: true,
    etaMinutes: 45,
  },
];

/** Daily order cap per partner, keyed by index so any seed size works. */
const DAILY_CAPACITY = 60;

/** Services paused for maintenance in the mock dataset. */
const MAINTENANCE = new Map<string, string>([
  ["Carpet Shampoo", "Carpet Shampoo is paused for equipment servicing. It returns shortly."],
]);

function partnersForZone(zoneId: string): string[] {
  const db = getDb();
  const zone = ZONES.find((entry) => entry.id === zoneId);
  if (!zone) return [];
  return db.partners.filter((partner) => partner.area === zone.area).map((partner) => partner.id);
}

export function mockServiceAreas() {
  return ZONES.map((zone) => ({
    ...zone,
    partnerIds: partnersForZone(zone.id),
  }));
}

function matchingZones(city: string, pincode: string, partnerId: string) {
  const pin = pincode.trim();
  const town = city.trim().toLowerCase();
  const areas = mockServiceAreas();
  if (pin) {
    const byPin = areas.filter((zone) => zone.pincodes.includes(pin));
    if (byPin.length > 0) return byPin;
  }
  if (town) {
    const byName = areas.filter(
      (zone) =>
        zone.city.toLowerCase() === town ||
        zone.area.toLowerCase() === town ||
        `${zone.area}, ${zone.city}`.toLowerCase() === town,
    );
    if (byName.length > 0) return byName;
  }
  if (!pin && !town && partnerId) {
    return areas.filter((zone) => zone.partnerIds.includes(partnerId));
  }
  return [];
}

function ordersToday(partnerId: string): number {
  const today = new Date().toDateString();
  return getDb().orders.filter(
    (order) =>
      order.partner.id === partnerId &&
      order.status !== "cancelled" &&
      new Date(order.createdAt).toDateString() === today,
  ).length;
}

type AvailabilityQueryInput = {
  serviceId?: string | undefined;
  partnerId?: string | undefined;
  city?: string | undefined;
  pincode?: string | undefined;
};

export function mockAvailability(query: AvailabilityQueryInput) {
  const db = getDb();
  const city = query.city ?? "";
  const pincode = query.pincode ?? "";
  const checks: Rule[] = [];
  let state: MockAvailabilityState = "available";
  let message = "";

  const service = query.serviceId
    ? db.services.find((entry) => entry.id === query.serviceId)
    : undefined;
  if (query.serviceId) {
    checks.push({
      id: "service_enabled",
      label: "Service is enabled",
      ok: Boolean(service),
      detail: service?.name ?? query.serviceId,
    });
    if (!service) state = "service_unavailable";

    const maintenance = service ? MAINTENANCE.get(service.name) : undefined;
    checks.push({
      id: "service_maintenance",
      label: "Service is not under maintenance",
      ok: !maintenance,
      detail: maintenance ?? "",
    });
    if (maintenance && state === "available") {
      state = "maintenance";
      message = maintenance;
    }
  }

  const partner = query.partnerId
    ? db.partners.find((entry) => entry.id === query.partnerId)
    : undefined;
  if (query.partnerId) {
    const active = Boolean(partner) && partner?.status === "active" && partner.acceptingNewOrders;
    checks.push({
      id: "partner_active",
      label: "Partner is active",
      ok: active,
      detail: partner?.name ?? query.partnerId,
    });
    if (!active && state === "available") state = "partner_inactive";

    const open = Boolean(partner?.isOpen);
    checks.push({ id: "partner_open", label: "Partner is open", ok: open, detail: "" });
    if (!open && state === "available") state = "partner_closed";
  }

  const zones = matchingZones(city, pincode, query.partnerId ?? "");
  const located = Boolean(city.trim() || pincode.trim());
  if (located || query.partnerId) {
    const supported = zones.length > 0;
    checks.push({
      id: "city_supported",
      label: "Customer city is supported",
      ok: supported || !located,
      detail: city,
    });
    checks.push({
      id: "pincode_supported",
      label: "PIN Code is supported",
      ok: supported || !pincode.trim(),
      detail: pincode,
    });
    if (!supported && located && state === "available") state = "out_of_service_area";

    const pickupOk = supported ? zones.some((zone) => zone.pickupAvailable) : true;
    const deliveryOk = supported ? zones.some((zone) => zone.deliveryAvailable) : true;
    checks.push({ id: "pickup_area", label: "Pickup area is supported", ok: pickupOk, detail: "" });
    checks.push({
      id: "delivery_area",
      label: "Delivery area is supported",
      ok: deliveryOk,
      detail: "",
    });
    if (supported && !pickupOk && state === "available") state = "pickup_unavailable";
    if (supported && pickupOk && !deliveryOk && state === "available") {
      state = "delivery_unavailable";
    }
  }

  const used = query.partnerId ? ordersToday(query.partnerId) : 0;
  const limit = query.partnerId ? DAILY_CAPACITY : 0;
  checks.push({
    id: "daily_capacity",
    label: "Daily order capacity not exceeded",
    ok: !limit || used < limit,
    detail: limit ? `${used}/${limit}` : "No cap",
  });
  if (limit && used >= limit && state === "available") state = "capacity_reached";

  const [title, defaultMessage] = STATE_COPY[state];
  const available = state === "available";

  return {
    available,
    state,
    title,
    message: message || defaultMessage,
    serviceId: query.serviceId ?? null,
    partnerId: query.partnerId ?? null,
    city,
    pincode,
    checks,
    capacity: { limit, used, remaining: Math.max(0, limit - used) },
    nextOpenLabel: state === "partner_closed" ? "Opens tomorrow at 08:00" : "",
    alternatives: available ? [] : mockAlternatives(state, query),
  };
}

function mockAlternatives(
  state: MockAvailabilityState,
  query: AvailabilityQueryInput,
) {
  const db = getDb();
  if (state === "service_unavailable" || state === "maintenance") {
    return db.services
      .filter((entry) => entry.id !== query.serviceId && !MAINTENANCE.has(entry.name))
      .slice(0, 4)
      .map((entry) => ({
        kind: "service" as const,
        id: entry.id,
        name: entry.name,
        subtitle: entry.description,
        image: entry.image,
        rating: 0,
        price: entry.price,
      }));
  }
  const zones = matchingZones(query.city ?? "", query.pincode ?? "", "");
  const allowed = new Set(zones.flatMap((zone) => zone.partnerIds));
  return db.partners
    .filter(
      (partner) =>
        partner.id !== query.partnerId &&
        partner.status === "active" &&
        partner.isOpen &&
        (allowed.size === 0 || allowed.has(partner.id)),
    )
    .slice(0, 4)
    .map((partner) => ({
      kind: "partner" as const,
      id: partner.id,
      name: partner.name,
      subtitle: `${partner.area}, ${partner.city}`,
      image: partner.image,
      rating: partner.rating,
      price: partner.services[0]?.price ?? 0,
    }));
}

/* --------------------------------- reorder -------------------------------- */

type MockReorderLine = {
  id: string;
  serviceId: string;
  name: string;
  qty: number;
  previousPrice: number;
  currentPrice: number;
  priceChanged: boolean;
  available: boolean;
  unavailableReason: string;
};

/** One counter per customer/order pair — the mock `reorder_history`. */
const reorderCounts = new Map<string, { count: number; at: string }>();

function repriceLines(order: Order): { restorable: MockReorderLine[]; skipped: MockReorderLine[] } {
  const db = getDb();
  const restorable: MockReorderLine[] = [];
  const skipped: MockReorderLine[] = [];
  for (const item of order.items) {
    const service =
      db.services.find((entry) => entry.id === item.id) ??
      db.services.find((entry) => entry.name.toLowerCase() === item.name.toLowerCase());
    const currentPrice = service?.price ?? item.price;
    const reason = service ? MAINTENANCE.get(service.name) : "This service isn't available today";
    const line: MockReorderLine = {
      id: item.id,
      serviceId: service?.id ?? item.id,
      name: service?.name ?? item.name,
      qty: Math.max(1, item.qty),
      previousPrice: item.price,
      currentPrice,
      priceChanged: currentPrice !== item.price,
      available: !reason,
      unavailableReason: reason ?? "",
    };
    (line.available ? restorable : skipped).push(line);
  }
  return { restorable, skipped };
}

export function mockReorderHistory(accountId: string) {
  const db = getDb();
  return db.orders
    .filter(
      (order) =>
        order.customer.id === accountId &&
        (order.status === "delivered" || order.status === "completed"),
    )
    .map((order) => {
      const { restorable, skipped } = repriceLines(order);
      const stat = reorderCounts.get(`${accountId}:${order.id}`);
      return {
        orderId: order.id,
        orderCode: order.code,
        partnerId: order.partner.id,
        partnerName: order.partner.name,
        partnerImage: order.partner.image ?? "",
        serviceLabel: order.serviceLabel,
        placedAt: order.createdAt,
        deliveredAt: order.updatedAt,
        itemCount: restorable.reduce((sum, line) => sum + line.qty, 0),
        previousTotal: [...restorable, ...skipped].reduce(
          (sum, line) => sum + line.previousPrice * line.qty,
          0,
        ),
        estimatedTotal: restorable.reduce((sum, line) => sum + line.currentPrice * line.qty, 0),
        priceChanged: restorable.some((line) => line.priceChanged),
        reorderable: restorable.length > 0,
        availability: mockAvailability({
          serviceId: restorable[0]?.serviceId,
          partnerId: order.partner.id,
          city: order.address.city ?? "",
        }),
        items: [...restorable, ...skipped],
        lastReorderedAt: stat?.at ?? null,
        reorderCount: stat?.count ?? 0,
      };
    });
}

export function mockSmartReorder(order: Order, accountId: string) {
  const { restorable, skipped } = repriceLines(order);

  mutateDb((db) => {
    for (const line of restorable) {
      const existing = db.carts.find(
        (entry) => entry.id === line.serviceId && entry.accountId === accountId,
      );
      if (existing) {
        existing.qty += line.qty;
        existing.price = line.currentPrice;
        continue;
      }
      const cartLine: CartItemEntity = {
        id: line.serviceId,
        accountId,
        partnerId: order.partner.id,
        serviceId: line.serviceId,
        name: line.name,
        price: line.currentPrice,
        unit: "per piece",
        qty: line.qty,
        image: order.partner.image ?? "",
      };
      db.carts.push(cartLine);
    }
    return null;
  });

  const key = `${accountId}:${order.id}`;
  const previous = reorderCounts.get(key);
  reorderCounts.set(key, { count: (previous?.count ?? 0) + 1, at: new Date().toISOString() });

  return {
    ok: restorable.length > 0,
    orderId: order.id,
    orderCode: order.code,
    redirectTo: "/cart",
    restoredItems: restorable.length,
    previousTotal: [...restorable, ...skipped].reduce(
      (sum, line) => sum + line.previousPrice * line.qty,
      0,
    ),
    estimatedTotal: restorable.reduce((sum, line) => sum + line.currentPrice * line.qty, 0),
    priceChanged: restorable.some((line) => line.priceChanged),
    skipped,
    items: restorable,
    availability: mockAvailability({
      serviceId: restorable[0]?.serviceId,
      partnerId: order.partner.id,
      city: order.address.city ?? "",
    }),
  };
}
