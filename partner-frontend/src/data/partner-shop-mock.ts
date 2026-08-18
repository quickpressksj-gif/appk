/**
 * Sprint 3.5 — Shop Management (Partner app, UI only).
 *
 * Mock shop profile, gallery, business hours, service area and statistics.
 * Nothing here talks to the backend: every mutation is kept in
 * `PartnerShopContext` until the API / Cloudinary layer is wired up.
 */

export type ShopStatusId = "online" | "offline" | "busy" | "temporarily_closed" | "vacation";

export type ShopStatusMeta = {
  id: ShopStatusId;
  label: string;
  description: string;
  tone: "green" | "muted" | "amber" | "red";
};

export const SHOP_STATUSES: readonly ShopStatusMeta[] = [
  {
    id: "online",
    label: "Online",
    description: "Accepting new pickups and orders right now.",
    tone: "green",
  },
  {
    id: "offline",
    label: "Offline",
    description: "Hidden from customers until you go online again.",
    tone: "muted",
  },
  {
    id: "busy",
    label: "Busy",
    description: "Visible, but new orders are throttled.",
    tone: "amber",
  },
  {
    id: "temporarily_closed",
    label: "Temporarily Closed",
    description: "Closed for a few hours — reopens automatically.",
    tone: "red",
  },
  {
    id: "vacation",
    label: "Vacation Mode",
    description: "Long break. Orders paused until you return.",
    tone: "red",
  },
];

export function shopStatusMeta(id: ShopStatusId): ShopStatusMeta {
  return SHOP_STATUSES.find((status) => status.id === id) ?? (SHOP_STATUSES[0] as ShopStatusMeta);
}

export type VerificationStatus = "verified" | "pending" | "rejected";

export type ShopProfile = {
  shopId: string;
  name: string;
  ownerName: string;
  description: string;
  category: string;
  businessType: string;
  rating: number;
  reviewCount: number;
  verification: VerificationStatus;
  contactNumber: string;
  email: string;
  gstNumber: string;
  /** Placeholder tints — real images arrive with the Cloudinary integration. */
  logoTint: string;
  bannerTint: string;
};

export type GalleryImage = {
  id: string;
  title: string;
  tag: string;
  /** Placeholder gradient until real uploads are wired. */
  tint: string;
  uploadedOn: string;
};

export type BusinessHours = {
  openingTime: string;
  closingTime: string;
  weeklyOff: string;
  holidayMode: boolean;
  temporarilyClosed: boolean;
};

export type ServiceArea = {
  city: string;
  area: string;
  pickupRadiusKm: number;
  deliveryRadiusKm: number;
};

export type ShopStatistics = {
  totalOrders: number;
  completedOrders: number;
  activeCustomers: number;
  averageRating: number;
  revenue: number;
};

export const BUSINESS_CATEGORIES = [
  "Laundry & Dry Clean",
  "Premium Dry Clean",
  "Ironing & Steam Press",
  "Shoe & Leather Care",
  "Home Care",
] as const;

export const BUSINESS_TYPES = [
  "Sole Proprietorship",
  "Partnership",
  "Private Limited",
  "LLP",
] as const;

export const WEEKLY_OFF_OPTIONS = [
  "None",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const GALLERY_MAX_IMAGES = 10;

export const shopProfileMock: ShopProfile = {
  shopId: "QP-SHOP-4821",
  name: "QuickPress Laundry Studio",
  ownerName: "Rohan Mehta",
  description:
    "Premium steam press, dry clean and express wash studio serving Indiranagar since 2019. Same-day delivery on orders picked up before 11 AM.",
  category: "Laundry & Dry Clean",
  businessType: "Sole Proprietorship",
  rating: 4.8,
  reviewCount: 412,
  verification: "verified",
  contactNumber: "98765 43210",
  email: "studio@quickpress.in",
  gstNumber: "29ABCDE1234F1Z5",
  logoTint: "from-primary/35 to-secondary/25",
  bannerTint: "from-primary/30 via-secondary/20 to-primary/10",
};

export const galleryMock: GalleryImage[] = [
  {
    id: "img-1",
    title: "Storefront",
    tag: "Exterior",
    tint: "from-primary/35 to-primary/10",
    uploadedOn: "12 Jul 2026",
  },
  {
    id: "img-2",
    title: "Press Counter",
    tag: "Interior",
    tint: "from-secondary/30 to-secondary/10",
    uploadedOn: "12 Jul 2026",
  },
  {
    id: "img-3",
    title: "Steam Station",
    tag: "Equipment",
    tint: "from-primary/25 to-secondary/20",
    uploadedOn: "18 Jul 2026",
  },
  {
    id: "img-4",
    title: "Packing Desk",
    tag: "Interior",
    tint: "from-secondary/25 to-primary/15",
    uploadedOn: "02 Aug 2026",
  },
  {
    id: "img-5",
    title: "Delivery Bay",
    tag: "Exterior",
    tint: "from-primary/20 to-secondary/25",
    uploadedOn: "04 Aug 2026",
  },
];

export const businessHoursMock: BusinessHours = {
  openingTime: "08:00",
  closingTime: "21:00",
  weeklyOff: "Sunday",
  holidayMode: false,
  temporarilyClosed: false,
};

export const serviceAreaMock: ServiceArea = {
  city: "Bengaluru",
  area: "Indiranagar · 100ft Road",
  pickupRadiusKm: 5,
  deliveryRadiusKm: 8,
};

export const shopStatisticsMock: ShopStatistics = {
  totalOrders: 2148,
  completedOrders: 2039,
  activeCustomers: 386,
  averageRating: 4.8,
  revenue: 486500,
};

export function formatTimeLabel(value: string) {
  const [hourRaw, minute] = value.split(":");
  const hour = Number(hourRaw ?? 0);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${minute ?? "00"} ${suffix}`;
}

export function matchesGalleryQuery(image: GalleryImage, rawQuery: string) {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  return (
    image.title.toLowerCase().includes(q) ||
    image.tag.toLowerCase().includes(q) ||
    image.uploadedOn.toLowerCase().includes(q)
  );
}
