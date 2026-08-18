/**
 * Offers data layer — every function is one backend endpoint:
 *
 *   GET  /api/offers/page      → banners, special offers, scratch cards, points
 *   GET  /api/offers           → offers + coupons catalogue
 *   POST /api/offers/{code}/apply
 */

import type { CouponEntity, OfferEntity } from "@shared/types";

import { apiGetJson, apiPostJson } from "../core/transport";

export const OFFERS_API_ENDPOINTS = {
  page: "/api/offers/page",
  offers: "/api/offers",
  apply: "/api/offers/{code}/apply",
} as const;

export type OfferBanner = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  tone: "festival" | "discount" | "cashback";
};

export type Coupon = {
  id: string;
  code: string;
  discount: string;
  description: string;
  expiry: string;
  minOrder: number;
};

export type SpecialOffer = {
  id: string;
  kind: "first-order" | "referral" | "membership" | "festival";
  title: string;
  description: string;
  highlight: string;
};

export type ScratchCard = {
  id: string;
  reward: string;
  caption: string;
};

export type OffersPage = {
  banners: OfferBanner[];
  specialOffers: SpecialOffer[];
  scratchCards: ScratchCard[];
  rewardPoints: number;
};

/** GET /api/offers/page */
export async function fetchOffers(): Promise<OffersPage> {
  return apiGetJson<OffersPage>(OFFERS_API_ENDPOINTS.page);
}

/** GET /api/offers — coupons the customer can apply. */
export async function fetchCoupons(): Promise<Coupon[]> {
  const { coupons } = await apiGetJson<{ offers: OfferEntity[]; coupons: CouponEntity[] }>(
    OFFERS_API_ENDPOINTS.offers,
  );
  return coupons
    .filter((coupon) => coupon.status === "Active")
    .map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      discount: coupon.discount,
      description: coupon.description,
      expiry: coupon.expiry,
      minOrder: coupon.minOrder,
    }));
}

/** POST /api/offers/{code}/apply */
export async function applyCoupon(code: string) {
  await apiPostJson<unknown>(`/api/offers/${encodeURIComponent(code)}/apply`, {});
  return { ok: true as const, code };
}
