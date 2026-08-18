/**
 * Partner Listing + Partner Details projections for the mock backend.
 *
 * These mirror the FastAPI contract in `backend-python/app/api/partners.py`
 * (`PartnerCardResponse`, `PartnerDetailResponse`, `FilterOptionsResponse`,
 * `SearchResultResponse`) so the Customer screens consume byte-identical
 * payloads whether the app talks to the in-memory mock router or MongoDB.
 *
 *   GET /api/partners                  → PartnerCard[]
 *   GET /api/partners/{id}             → PartnerDetailData
 *   GET /api/partners/{id}/services    → PartnerService[]
 *   GET /api/partners/{id}/reviews     → { summary, reviews }
 *   GET /api/filter                    → FilterOptionsData
 *   GET /api/search                    → SearchResult[]
 */

import itemBlanket from "@/shared/assets/item-blanket.jpg";
import itemCarpet from "@/shared/assets/item-carpet.jpg";
import itemCurtain from "@/shared/assets/item-curtain.jpg";
import itemDryClean from "@/shared/assets/item-dry-clean.jpg";
import itemExpress from "@/shared/assets/item-express.jpg";
import itemPremium from "@/shared/assets/item-premium.jpg";
import itemShoes from "@/shared/assets/item-shoes.jpg";
import itemSteamIron from "@/shared/assets/item-steam-iron.jpg";
import itemWashFold from "@/shared/assets/item-wash-fold.jpg";
import serviceHero from "@/shared/assets/service-hero.jpg";
import store1 from "@/shared/assets/store-1.jpg";
import store2 from "@/shared/assets/store-2.jpg";
import store3 from "@/shared/assets/store-3.jpg";

import type {
  GalleryImage,
  PartnerDetailData,
  PartnerFeature,
  PartnerProfile,
  PartnerReview,
  PartnerService,
  PriceRow,
  ReviewSummary,
} from "../customer/partner-api";
import type {
  FilterOptionsData,
  ListingPartner,
  ListingQuery,
  SearchResult,
} from "../customer/service-listing-api";
import type { MockDb } from "./db";
import { toHomePartner } from "./home-projections";
import type { MockPartner } from "./seed";

/** Stable pseudo-random number in [0, 1) derived from an id. */
function hash(id: string): number {
  let value = 0;
  for (let i = 0; i < id.length; i += 1) value = (value * 31 + id.charCodeAt(i)) % 100000;
  return value / 100000;
}

const OFFER_LABELS: (string | null)[] = [
  "20% OFF up to ₹100",
  "Flat ₹75 OFF above ₹499",
  "Buy 5kg get 1kg free",
  null,
  "Free pickup & delivery",
  null,
];

const COVERS = [store1, store2, store3, serviceHero];

const SERVICE_IMAGES: [RegExp, string][] = [
  [/fold/i, itemWashFold],
  [/dry\s*clean/i, itemDryClean],
  [/iron|press|steam/i, itemSteamIron],
  [/premium/i, itemPremium],
  [/shoe|sneaker/i, itemShoes],
  [/blanket|quilt/i, itemBlanket],
  [/curtain/i, itemCurtain],
  [/carpet|rug/i, itemCarpet],
  [/express|same day/i, itemExpress],
];

function serviceImage(name: string): string {
  for (const [pattern, image] of SERVICE_IMAGES) if (pattern.test(name)) return image;
  return serviceHero;
}

function minutesFromEta(eta: string): number {
  const value = Number(String(eta).replace(/[^\d.]/g, "")) || 0;
  return /hr/i.test(eta) ? value * 60 : value;
}

/* --------------------------- listing cards ----------------------------- */

/** Canonical `GET /api/partners` card. Additive over the Home partner card. */
export function toListingCard(partner: MockPartner, index = 0): ListingPartner {
  const base = toHomePartner(partner, index);
  const seed = hash(partner.id);
  const pickupMinutes = minutesFromEta(base.pickupTime ?? base.eta) || 20 + Math.round(seed * 5) * 5;
  const enabled = (partner.services ?? []).filter((service) => service.enabled);

  return {
    ...base,
    logo: partner.image,
    cover: COVERS[index % COVERS.length] ?? store1,
    city: partner.city,
    area: partner.area,
    tagline: `${partner.area} · ${enabled.length} services on QuickPress`,
    pickupTime: base.pickupTime ?? `${pickupMinutes} min`,
    pickupMinutes,
    deliveryTime: base.deliveryTime ?? "24 hrs",
    minOrderValue: base.minOrderValue ?? 149 + (index % 4) * 25,
    services: enabled.map((service) => service.name),
    servicesCount: enabled.length,
    reviewsCount: base.reviewsCount ?? partner.totalOrders,
    status: base.open ? "open" : "closed",
    verified: partner.status === "active",
    offerLabel: OFFER_LABELS[index % OFFER_LABELS.length] ?? null,
    popularity: partner.totalOrders + Math.round(partner.rating * 100),
    joinedDaysAgo: Math.max(
      1,
      Math.round((Date.now() - new Date(partner.joinedOn).getTime()) / 86_400_000),
    ),
  } as ListingPartner;
}

function matchesQuery(card: ListingPartner, needle: string): boolean {
  if (!needle) return true;
  return (
    card.name.toLowerCase().includes(needle) ||
    card.city.toLowerCase().includes(needle) ||
    card.area.toLowerCase().includes(needle) ||
    card.services.some((service) => service.toLowerCase().includes(needle))
  );
}

/** Server side filter + sort, matching `PartnerRepository.partner_cards`. */
export function listPartnerCards(db: MockDb, params: ListingQuery = {}): ListingPartner[] {
  const needle = (params.q ?? "").trim().toLowerCase();
  const cards = db.partners.map((partner, index) => toListingCard(partner, index));

  const filtered = cards.filter((card) => {
    if (params.city && card.city !== params.city) return false;
    if (params.openNow && !card.open) return false;
    if (params.offers && !card.offerLabel) return false;
    if (params.verified && !card.verified) return false;
    if (params.freePickup && card.minOrderValue > 199) return false;
    if (params.newlyAdded && card.joinedDaysAgo > 60) return false;
    if (params.minRating && card.rating < params.minRating) return false;
    if (params.maxDistance && card.distanceKm > params.maxDistance) return false;
    if (params.maxPrice && card.minPrice > params.maxPrice) return false;
    if (params.maxPickupMinutes && card.pickupMinutes > params.maxPickupMinutes) return false;
    if (params.serviceName && !card.services.some((s) => s.toLowerCase().includes(params.serviceName!.toLowerCase())))
      return false;
    return matchesQuery(card, needle);
  });

  return sortPartnerCards(filtered, params.sort);
}

export function sortPartnerCards(cards: ListingPartner[], sort?: string): ListingPartner[] {
  const sorted = [...cards];
  switch (sort) {
    case "rating":
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    case "price-low":
      sorted.sort((a, b) => a.minPrice - b.minPrice);
      break;
    case "price-high":
      sorted.sort((a, b) => b.minPrice - a.minPrice);
      break;
    case "distance":
      sorted.sort((a, b) => a.distanceKm - b.distanceKm);
      break;
    case "pickup":
      sorted.sort((a, b) => a.pickupMinutes - b.pickupMinutes);
      break;
    case "delivery":
      sorted.sort((a, b) => minutesFromEta(a.deliveryTime) - minutesFromEta(b.deliveryTime));
      break;
    case "popular":
      sorted.sort((a, b) => b.popularity - a.popularity);
      break;
    default:
      sorted.sort(
        (a, b) =>
          Number(b.open) - Number(a.open) || b.rating - a.rating || a.distanceKm - b.distanceKm,
      );
      break;
  }
  return sorted;
}

/* --------------------------- partner details --------------------------- */

function findPartner(db: MockDb, partnerId: string): { partner: MockPartner; index: number } | null {
  const index = db.partners.findIndex((item) => item.id === partnerId);
  if (index < 0) return null;
  return { partner: db.partners[index]!, index };
}

export function toPartnerProfile(partner: MockPartner, index = 0): PartnerProfile {
  const card = toListingCard(partner, index);
  const seed = hash(partner.id);
  const openHour = 7 + Math.round(seed * 2);
  const closeHour = 21 + Math.round(seed);
  const radius = 4 + Math.round(seed * 4);

  return {
    id: partner.id,
    name: partner.name,
    cover: card.cover,
    logo: partner.image,
    verified: card.verified,
    rating: partner.rating,
    reviewCount: card.reviews,
    reviewsCount: card.reviewsCount,
    distanceKm: card.distanceKm,
    pickupEta: card.pickupTime,
    deliveryEta: card.deliveryTime,
    open: card.open,
    status: card.status,
    ownerName: partner.ownerName,
    address: `${partner.area}, ${partner.city}`,
    city: partner.city,
    area: partner.area,
    latitude: 12.9 + seed / 10,
    longitude: 77.5 + seed / 10,
    pickupRadius: `${radius} km around ${partner.area}`,
    deliveryRadiusKm: radius,
    workingHours: `Mon – Sun · ${openHour}:00 AM to ${closeHour - 12}:00 PM`,
    hours: Array.from({ length: 7 }).map((_, day) => ({
      day: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][day]!,
      opensAt: `${openHour}:00 AM`,
      closesAt: `${closeHour - 12}:00 PM`,
      closed: false,
    })),
    phone: partner.phone,
    about: `${partner.name} has served ${partner.area} with ${partner.totalOrders.toLocaleString(
      "en-IN",
    )} completed orders. Every garment is sorted by fabric, washed with pH balanced detergents and steam pressed before packaging.`,
    yearsInBusiness: Math.max(1, new Date().getFullYear() - new Date(partner.joinedOn).getFullYear()),
    tagline: card.tagline,
    offerLabel: card.offerLabel,
    minOrderValue: card.minOrderValue,
    policies: [
      "Free pickup and delivery on orders above ₹199",
      "Garments inspected and photographed before processing",
      "Damage protection up to ₹2,000 per garment",
      "Reschedule a pickup free of cost up to 2 hours before the slot",
      "Refund or rewash if you are not satisfied within 24 hours of delivery",
    ],
  };
}

export function toPartnerServices(partner: MockPartner, index = 0): PartnerService[] {
  const card = toListingCard(partner, index);
  return (partner.services ?? []).map((service) => ({
    id: service.id,
    name: service.name,
    description: `${service.name} handled in-house by ${partner.name}`,
    image: serviceImage(service.name),
    startingPrice: service.price,
    basePrice: service.price,
    unit: service.unit,
    deliveryEta: card.deliveryTime,
    available: service.enabled,
  }));
}

export function toPartnerReviews(db: MockDb, partnerId: string): PartnerReview[] {
  return db.reviews
    .filter((review) => review.partnerId === partnerId)
    .map((review) => ({
      id: review.id,
      partnerId,
      name: review.customerName,
      initials: review.initials,
      photo: COVERS[hash(review.id) > 0.5 ? 1 : 2] ?? store2,
      rating: review.rating,
      text: review.text,
      date: review.createdAt,
      images: [],
    }));
}

export function toReviewSummary(reviews: PartnerReview[], fallbackRating: number): ReviewSummary {
  const total = reviews.length;
  const average =
    total > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10 : fallbackRating;
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((review) => Math.round(review.rating) === star).length,
  }));
  return { average, total, breakdown };
}

export function partnerDetailPayload(db: MockDb, partnerId: string): PartnerDetailData | null {
  const found = findPartner(db, partnerId);
  if (!found) return null;
  const { partner, index } = found;

  const services = toPartnerServices(partner, index);
  const reviews = toPartnerReviews(db, partnerId);
  const features: PartnerFeature[] = [
    { id: "f1", title: "Doorstep Pickup", icon: "truck" },
    { id: "f2", title: "Same Day Delivery", icon: "clock" },
    { id: "f3", title: "Express Laundry", icon: "zap" },
    { id: "f4", title: "Eco Friendly Cleaning", icon: "leaf" },
    { id: "f5", title: "Premium Packaging", icon: "package" },
    { id: "f6", title: "Live Order Tracking", icon: "map-pin" },
  ];
  const gallery: GalleryImage[] = [
    { id: "g1", image: store1, caption: "Store Front" },
    { id: "g2", image: store2, caption: "Laundry Machines" },
    { id: "g3", image: store3, caption: "Packing Area" },
    { id: "g4", image: serviceHero, caption: "Cleaning Area" },
  ];
  const priceList: PriceRow[] = services.map((service) => ({
    id: `pl-${service.id}`,
    service: service.name,
    unit: service.unit,
    price: service.startingPrice,
  }));

  return {
    partner: toPartnerProfile(partner, index),
    services,
    features,
    reviews,
    reviewSummary: toReviewSummary(reviews, partner.rating),
    gallery,
    priceList,
  };
}

export function partnerServicesPayload(db: MockDb, partnerId: string): PartnerService[] | null {
  const found = findPartner(db, partnerId);
  return found ? toPartnerServices(found.partner, found.index) : null;
}

/* ----------------------------- filter meta ----------------------------- */

export function filterOptionsPayload(db: MockDb): FilterOptionsData {
  return {
    sorts: [
      { id: "recommended", label: "Recommended" },
      { id: "distance", label: "Nearest" },
      { id: "rating", label: "Highest rated" },
      { id: "price-low", label: "Lowest price" },
      { id: "pickup", label: "Fastest pickup" },
      { id: "popular", label: "Most popular" },
    ],
    toggles: [
      { id: "openNow", label: "Open now" },
      { id: "offers", label: "Offers" },
    ],
    groups: [
      {
        id: "maxDistance",
        label: "Distance",
        kind: "single",
        options: [
          { id: "0", label: "Any", value: 0 },
          { id: "2", label: "2 km", value: 2 },
          { id: "5", label: "5 km", value: 5 },
          { id: "10", label: "10 km", value: 10 },
        ],
      },
      {
        id: "minRating",
        label: "Rating",
        kind: "single",
        options: [
          { id: "0", label: "Any", value: 0 },
          { id: "4", label: "4.0+", value: 4 },
          { id: "4.5", label: "4.5+", value: 4.5 },
        ],
      },
      {
        id: "maxPrice",
        label: "Starting price",
        kind: "single",
        options: [
          { id: "0", label: "Any", value: 0 },
          { id: "20", label: "Under ₹20", value: 20 },
          { id: "50", label: "Under ₹50", value: 50 },
          { id: "100", label: "Under ₹100", value: 100 },
        ],
      },
      {
        id: "maxPickupMinutes",
        label: "Pickup time",
        kind: "single",
        options: [
          { id: "0", label: "Any", value: 0 },
          { id: "20", label: "Under 20 min", value: 20 },
          { id: "30", label: "Under 30 min", value: 30 },
          { id: "45", label: "Under 45 min", value: 45 },
        ],
      },
    ],
    cities: [...new Set(db.partners.map((partner) => partner.city))].filter(Boolean).sort(),
  };
}

/* ------------------------------- search -------------------------------- */

export function searchPayload(db: MockDb, q: string, scopes?: string[]): SearchResult[] {
  const needle = (q ?? "").trim().toLowerCase();
  if (!needle) return [];
  const wanted = new Set(scopes && scopes.length > 0 ? scopes : ["partners", "categories", "services", "offers"]);
  const results: SearchResult[] = [];

  if (wanted.has("partners")) {
    for (const card of listPartnerCards(db, { q: needle })) {
      results.push({
        id: card.id,
        scope: "partners",
        title: card.name,
        subtitle: `${card.area}, ${card.city}`,
        image: card.image,
      });
    }
  }
  if (wanted.has("categories")) {
    for (const category of db.categories) {
      if (
        category.title.toLowerCase().includes(needle) ||
        (category.description ?? "").toLowerCase().includes(needle)
      ) {
        results.push({
          id: category.id,
          scope: "categories",
          title: category.title,
          subtitle: category.description ?? "",
          image: category.image,
        });
      }
    }
  }
  if (wanted.has("services")) {
    for (const service of db.services) {
      if (
        service.name.toLowerCase().includes(needle) ||
        (service.description ?? "").toLowerCase().includes(needle)
      ) {
        results.push({
          id: service.id,
          scope: "services",
          title: service.name,
          subtitle: `₹${service.price} ${service.unit}`,
          image: service.image,
        });
      }
    }
  }
  if (wanted.has("offers")) {
    for (const offer of db.offers) {
      if (
        offer.title.toLowerCase().includes(needle) ||
        (offer.description ?? "").toLowerCase().includes(needle)
      ) {
        results.push({
          id: offer.id,
          scope: "offers",
          title: offer.title,
          subtitle: offer.description ?? "",
          image: offer.banner ?? undefined,
        });
      }
    }
  }
  return results;
}
