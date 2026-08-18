/**
 * Sprint 3.4 — Service Management & Pricing (Partner app, UI only).
 *
 * Mock rate card used by the Manage Services module. No backend calls: every
 * mutation lives in `PartnerServicesContext` until the API is wired up.
 */

export type ServiceUnit = "kg" | "piece" | "pair" | "fixed";

export type ServiceCategoryId =
  | "wash"
  | "dry-clean"
  | "iron"
  | "premium"
  | "shoe-care"
  | "home-care";

export type ServiceIconKey =
  | "wash"
  | "dryclean"
  | "iron"
  | "premium"
  | "shoe"
  | "blanket"
  | "curtain"
  | "carpet";

export type OfferType = "flat" | "percent" | "limited" | "festival";

export type ServiceOffer = {
  id: string;
  serviceId: string;
  type: OfferType;
  /** Rupees for flat offers, percentage for the rest. */
  value: number;
  title: string;
  validTill: string;
};

export type ManagedService = {
  id: string;
  name: string;
  category: ServiceCategoryId;
  icon: ServiceIconKey;
  description: string;
  price: number;
  unit: ServiceUnit;
  estimatedHours: number;
  minOrderValue: number;
  enabled: boolean;
  /** Popularity signal used by the "Most Ordered" filter + sort. */
  ordersThisMonth: number;
  updatedMinutesAgo: number;
  /** UI-only image placeholder label (no upload wired). */
  imageLabel: string | null;
};

export const SERVICE_CATEGORIES: { id: ServiceCategoryId; label: string }[] = [
  { id: "wash", label: "Wash" },
  { id: "dry-clean", label: "Dry Cleaning" },
  { id: "iron", label: "Ironing" },
  { id: "premium", label: "Premium" },
  { id: "shoe-care", label: "Shoe Care" },
  { id: "home-care", label: "Home Care" },
];

export const SERVICE_UNITS: { id: ServiceUnit; label: string; suffix: string }[] = [
  { id: "kg", label: "Per Kg", suffix: "/kg" },
  { id: "piece", label: "Per Piece", suffix: "/piece" },
  { id: "pair", label: "Per Pair", suffix: "/pair" },
  { id: "fixed", label: "Fixed Price", suffix: " flat" },
];

export const OFFER_TYPES: { id: OfferType; label: string; hint: string }[] = [
  { id: "flat", label: "Flat Discount", hint: "Flat ₹ off the order total" },
  { id: "percent", label: "Percentage Discount", hint: "% off the service price" },
  { id: "limited", label: "Limited-Time Offer", hint: "Runs for a short window" },
  { id: "festival", label: "Festival Offer", hint: "Seasonal campaign pricing" },
];

export function categoryLabel(id: ServiceCategoryId) {
  return SERVICE_CATEGORIES.find((item) => item.id === id)?.label ?? "Service";
}

export function unitLabel(unit: ServiceUnit) {
  return SERVICE_UNITS.find((item) => item.id === unit)?.label ?? "Per Piece";
}

export function unitSuffix(unit: ServiceUnit) {
  return SERVICE_UNITS.find((item) => item.id === unit)?.suffix ?? "";
}

export function offerTypeLabel(type: OfferType) {
  return OFFER_TYPES.find((item) => item.id === type)?.label ?? "Offer";
}

export function formatTurnaround(hours: number) {
  if (hours < 24) return `${hours} hr`;
  const days = Math.round(hours / 24);
  return `${days} day${days > 1 ? "s" : ""}`;
}

export function formatUpdated(minutes: number) {
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / 1440)}d ago`;
}

export const managedServices: ManagedService[] = [
  {
    id: "svc-wash-fold",
    name: "Wash & Fold",
    category: "wash",
    icon: "wash",
    description: "Everyday laundry washed, dried and neatly folded in 24 hours.",
    price: 79,
    unit: "kg",
    estimatedHours: 24,
    minOrderValue: 199,
    enabled: true,
    ordersThisMonth: 412,
    updatedMinutesAgo: 35,
    imageLabel: "wash-fold.jpg",
  },
  {
    id: "svc-dry-clean",
    name: "Dry Cleaning",
    category: "dry-clean",
    icon: "dryclean",
    description: "Solvent cleaning for suits, sarees, silk and delicate fabrics.",
    price: 149,
    unit: "piece",
    estimatedHours: 48,
    minOrderValue: 299,
    enabled: true,
    ordersThisMonth: 286,
    updatedMinutesAgo: 180,
    imageLabel: "dry-clean.jpg",
  },
  {
    id: "svc-steam-iron",
    name: "Steam Iron",
    category: "iron",
    icon: "iron",
    description: "Crisp steam pressing with fabric-safe temperature control.",
    price: 15,
    unit: "piece",
    estimatedHours: 12,
    minOrderValue: 149,
    enabled: true,
    ordersThisMonth: 531,
    updatedMinutesAgo: 90,
    imageLabel: "steam-iron.jpg",
  },
  {
    id: "svc-premium-laundry",
    name: "Premium Laundry",
    category: "premium",
    icon: "premium",
    description: "Hand-finished wash with fabric conditioner and premium packing.",
    price: 129,
    unit: "kg",
    estimatedHours: 36,
    minOrderValue: 499,
    enabled: true,
    ordersThisMonth: 118,
    updatedMinutesAgo: 1320,
    imageLabel: null,
  },
  {
    id: "svc-shoe-cleaning",
    name: "Shoe Cleaning",
    category: "shoe-care",
    icon: "shoe",
    description: "Deep clean, deodorise and polish for sneakers and leather shoes.",
    price: 249,
    unit: "pair",
    estimatedHours: 72,
    minOrderValue: 249,
    enabled: true,
    ordersThisMonth: 64,
    updatedMinutesAgo: 2880,
    imageLabel: "shoe-care.jpg",
  },
  {
    id: "svc-blanket-cleaning",
    name: "Blanket Cleaning",
    category: "home-care",
    icon: "blanket",
    description: "Bulk wash for blankets, quilts and comforters with sun drying.",
    price: 349,
    unit: "fixed",
    estimatedHours: 72,
    minOrderValue: 349,
    enabled: false,
    ordersThisMonth: 41,
    updatedMinutesAgo: 4320,
    imageLabel: null,
  },
  {
    id: "svc-curtain-cleaning",
    name: "Curtain Cleaning",
    category: "home-care",
    icon: "curtain",
    description: "Dust extraction and gentle wash for sheer and blackout curtains.",
    price: 199,
    unit: "piece",
    estimatedHours: 96,
    minOrderValue: 599,
    enabled: false,
    ordersThisMonth: 22,
    updatedMinutesAgo: 7200,
    imageLabel: null,
  },
  {
    id: "svc-carpet-cleaning",
    name: "Carpet Cleaning",
    category: "home-care",
    icon: "carpet",
    description: "Shampoo extraction for rugs and carpets, dried within 48 hours.",
    price: 899,
    unit: "fixed",
    estimatedHours: 96,
    minOrderValue: 899,
    enabled: true,
    ordersThisMonth: 17,
    updatedMinutesAgo: 10080,
    imageLabel: "carpet.jpg",
  },
];

export const managedOffers: ServiceOffer[] = [
  {
    id: "ofr-1",
    serviceId: "svc-wash-fold",
    type: "percent",
    value: 15,
    title: "Monsoon 15% off",
    validTill: "30 Sep",
  },
  {
    id: "ofr-2",
    serviceId: "svc-steam-iron",
    type: "flat",
    value: 30,
    title: "Flat ₹30 off above ₹299",
    validTill: "15 Sep",
  },
];

/** Popularity threshold for the "Most Ordered" filter. */
export const MOST_ORDERED_THRESHOLD = 200;
