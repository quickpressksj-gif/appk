/**
 * Home Screen projections for the mock backend.
 *
 * The FastAPI service (`backend-python/app/api/home.py`) returns exactly these
 * shapes from `/api/home`, `/api/partners`, `/api/partners/nearby`,
 * `/api/services` and `/api/services/popular`. Keeping the projection here means
 * the Customer Home screen consumes the same contract in mock and live mode.
 */

import type { Account, ServiceEntity } from "@/shared/types";

import type { Partner, PopularService, Profile } from "../customer/home-api";
import type { MockDb } from "./db";
import type { MockPartner } from "./seed";

const CATEGORY_ICON: Record<string, string> = {
  c1: "washing-machine",
  c2: "shirt",
  c3: "flame",
  c4: "sparkles",
  c5: "footprints",
  c6: "blinds",
  c7: "bed-double",
  c8: "layout-grid",
  c9: "zap",
};

/** Stable pseudo-random number in [0, 1) derived from an id. */
function hash(id: string): number {
  let value = 0;
  for (let i = 0; i < id.length; i += 1) value = (value * 31 + id.charCodeAt(i)) % 100000;
  return value / 100000;
}

function reviewsLabel(count: number): string {
  return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
}

/** Canonical Home partner card. Additive — every original field is preserved. */
export function toHomePartner(partner: MockPartner, index = 0): Partner & MockPartner {
  const seed = hash(partner.id);
  const distanceKm = Math.round((0.6 + seed * 4.2) * 10) / 10;
  const pickupMinutes = 20 + Math.round(seed * 6) * 5;
  const reviewsCount = partner.totalOrders ?? Math.round(200 + seed * 900);
  const services = (partner.services ?? []).filter((service) => service.enabled);
  const minPrice = services.length > 0 ? Math.min(...services.map((s) => s.price)) : 79;

  return {
    ...partner,
    image: partner.image,
    /** Partner card: logo */
    logo: partner.image,
    name: partner.name,
    rating: partner.rating,
    reviews: reviewsLabel(reviewsCount),
    reviewsCount,
    distanceKm,
    eta: `${pickupMinutes} min pickup`,
    pickupTime: `${pickupMinutes} min`,
    deliveryTime: index % 2 === 0 ? "24 hrs" : "36 hrs",
    open: partner.isOpen && partner.acceptingNewOrders,
    status: partner.isOpen && partner.acceptingNewOrders ? "open" : "closed",
    minPrice,
    minOrderValue: 149 + (index % 4) * 25,
    servicesCount: services.length,
    serviceNames: services.map((service) => service.name),
    services: services.map((service) => service.name),
  } as unknown as Partner & MockPartner;
}

/** Canonical Home service card. Additive over `ServiceEntity`. */
export function toServiceCard(
  service: ServiceEntity,
  partnerCount: number,
): PopularService & ServiceEntity {
  const seed = hash(service.id);
  const discountPercent = [0, 10, 15, 20, 25][Math.round(seed * 4)] ?? 0;
  const processingHours = [12, 24, 36, 48][Math.round(seed * 3)] ?? 24;

  return {
    ...service,
    /** Service card: icon + name + description */
    icon: CATEGORY_ICON[service.categoryId] ?? "sparkles",
    title: service.name,
    name: service.name,
    description: service.description,
    /** Service card: base price + discount */
    price: service.price,
    basePrice: service.price,
    discountPercent,
    discountLabel: discountPercent > 0 ? `${discountPercent}% OFF` : null,
    finalPrice: Math.round(service.price * (1 - discountPercent / 100)),
    /** Service card: processing time + partner count */
    processingTime: `${processingHours} hrs`,
    partnerCount,
  } as unknown as PopularService & ServiceEntity;
}

export function toProfile(account: Account, unread: number): Profile {
  return {
    id: account.id,
    name: account.name,
    initials: account.avatarInitials,
    avatarUrl: (account as { avatarUrl?: string | null }).avatarUrl ?? null,
    phone: account.phone,
    unreadNotifications: unread,
  };
}

/** Aggregate payload behind `GET /api/home`. */
export function homePayload(db: MockDb, account: Account) {
  const partnerCount = db.partners.length;
  const unread = db.notifications.filter((item) => item.accountId === account.id && !item.read).length;
  const services = db.services.map((service) =>
    toServiceCard(
      service,
      db.partners.filter((partner) =>
        (partner.services ?? []).some((entry) => entry.enabled),
      ).length || partnerCount,
    ),
  );

  return {
    profile: toProfile(account, unread),
    location: { area: "Koramangala 5th Block", city: "Bengaluru", state: "Karnataka" },
    banners: [...db.banners].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99)),
    categories: db.categories
      .filter((category) => category.status !== "inactive")
      .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99)),
    services,
    popularServices: services.filter((service) => service.popular),
    partners: db.partners
      .filter((partner) => partner.status === "active" && partner.isOpen && partner.acceptingNewOrders)
      .map((partner, index) => toHomePartner(partner, index)),
    offers: db.offers,
    unreadNotifications: unread,
  };
}
