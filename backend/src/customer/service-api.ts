/**
 * QuickPress Service Details — live data layer (Sprint 2.3).
 *
 * Every function maps 1:1 to a FastAPI endpoint served by `backend-python`
 * and goes through the shared transport, so it works in both mock and HTTP
 * modes with identical response shapes. No fixtures remain in this module.
 *
 *   GET  /api/services/{id}            — hero, packages, items, add-ons, charges
 *   GET  /api/services/{id}/faq        — frequently asked questions
 *   GET  /api/services/{id}/related    — related services
 *   GET  /api/services/{id}/partners   — partners offering this service
 *   GET  /api/reviews?serviceId=       — reviews for the service
 *   POST /api/cart/items               — add an item to the Smart Cart
 */

import { apiGetJson } from "@backend/core/transport";
import { postCartItem, type CartItemPayload } from "./cart-api";

export const SERVICE_API_ENDPOINTS = {
  service: "/api/services/:id",
  faq: "/api/services/:id/faq",
  related: "/api/services/:id/related",
  partners: "/api/services/:id/partners",
  pricing: "/api/service-pricing",
  cartItems: "/api/cart/items",
  addons: "/api/addons",
  reviews: "/api/reviews",
} as const;

export type ServiceHero = {
  id: string;
  name: string;
  shortDescription: string;
  image: string;
  rating: number;
  ordersCompleted: string;
  pickupEta: string;
  deliveryEta: string;
  startingPrice: number;
  about: string;
  included: string[];
  benefits: string[];
};

export type ServicePackage = {
  id: string;
  name: string;
  price: number;
  delivery: string;
  benefits: string[];
  tag?: string;
};

export type PriceItem = {
  id: string;
  name: string;
  price: number;
  unit: string;
  eta: string;
  image: string;
};

export type AddOn = {
  id: string;
  name: string;
  note: string;
  price: number;
};

export type Review = {
  id: string;
  name: string;
  initials: string;
  rating: number;
  text: string;
  when: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type RelatedService = {
  id: string;
  name: string;
  price: number;
  unit: string;
  image: string;
};

export type ServicePartner = {
  id: string;
  name: string;
  logo: string;
  rating: number;
  reviewsCount: number;
  area: string;
  pickupTime: string;
  deliveryTime: string;
  price: number;
  offerLabel: string | null;
};

export type ServiceDetailData = {
  service: ServiceHero;
  packages: ServicePackage[];
  items: PriceItem[];
  addons: AddOn[];
  reviews: Review[];
  charges: { pickup: number; handling: number; discount: number };
  /** Fabric care guidance shown under the service description. */
  careInstructions: string[];
  /** GET /api/services/{id}/faq */
  faq: FaqItem[];
  /** GET /api/services/{id}/related */
  related: RelatedService[];
  /** GET /api/services/{id}/partners */
  partners: ServicePartner[];
};

const EMPTY_CHARGES = { pickup: 0, handling: 0, discount: 0 };

function servicePath(serviceId: string, suffix = ""): string {
  return `/api/services/${encodeURIComponent(serviceId)}${suffix}`;
}

/** GET /api/services/{id}/faq */
export async function fetchServiceFaq(serviceId: string): Promise<FaqItem[]> {
  return apiGetJson<FaqItem[]>(servicePath(serviceId, "/faq"));
}

/** GET /api/services/{id}/related */
export async function fetchRelatedServices(serviceId: string): Promise<RelatedService[]> {
  return apiGetJson<RelatedService[]>(servicePath(serviceId, "/related"));
}

/** GET /api/services/{id}/partners */
export async function fetchServicePartners(serviceId: string): Promise<ServicePartner[]> {
  return apiGetJson<ServicePartner[]>(servicePath(serviceId, "/partners"));
}

/** GET /api/reviews?serviceId= */
export async function fetchServiceReviews(serviceId: string): Promise<Review[]> {
  return apiGetJson<Review[]>(SERVICE_API_ENDPOINTS.reviews, { params: { serviceId } });
}

/**
 * GET /api/services/{id} plus its sub-resources.
 *
 * The detail endpoint already embeds faq / related / partners / reviews; the
 * dedicated endpoints are fetched in parallel and win when they return data,
 * so each section stays independently refreshable.
 */
export async function fetchServiceDetail(serviceId: string): Promise<ServiceDetailData> {
  const [detail, faq, related, partners] = await Promise.all([
    apiGetJson<Partial<ServiceDetailData>>(servicePath(serviceId)),
    fetchServiceFaq(serviceId).catch(() => [] as FaqItem[]),
    fetchRelatedServices(serviceId).catch(() => [] as RelatedService[]),
    fetchServicePartners(serviceId).catch(() => [] as ServicePartner[]),
  ]);

  const service = detail.service;
  if (!service) throw new Error(`Service ${serviceId} was not found.`);

  return {
    service,
    packages: detail.packages ?? [],
    items: detail.items ?? [],
    addons: detail.addons ?? [],
    reviews: detail.reviews ?? [],
    charges: detail.charges ?? EMPTY_CHARGES,
    careInstructions: detail.careInstructions ?? [],
    faq: faq.length ? faq : (detail.faq ?? []),
    related: related.length ? related : (detail.related ?? []),
    partners: partners.length ? partners : (detail.partners ?? []),
  };
}

/** POST /api/cart/items — add a service item to the Smart Cart. */
export async function postCart(payload: CartItemPayload) {
  return postCartItem(payload);
}
