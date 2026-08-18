/**
 * Sprint 3.7 — Partner Customers & Reviews mock data (UI only).
 *
 * No backend calls, no Supabase, no persistence. Every value is static demo
 * data used to exercise the Customers and Reviews UI states (loading,
 * populated, filtered, empty). Future backend integration points are marked
 * with `TODO(api)`.
 */

export type CustomerStatus = "active" | "inactive";

export type CustomerSegment = "new" | "repeat" | "premium" | "high-value";

export type CustomerOrderRecord = {
  id: string;
  service: string;
  date: string;
  items: number;
  amount: number;
  status: "delivered" | "cancelled" | "in-progress";
};

export type CustomerAddress = {
  id: string;
  label: string;
  line: string;
  pincode: string;
  isDefault: boolean;
};

export type PartnerCustomer = {
  id: string;
  name: string;
  mobile: string;
  photo: string | null;
  memberSince: string;
  totalOrders: number;
  totalSpend: number;
  lastOrderDate: string;
  status: CustomerStatus;
  segments: CustomerSegment[];
  membership: {
    tier: "None" | "Silver" | "Gold" | "Platinum";
    expiresOn: string | null;
    savedThisYear: number;
  };
  referral: {
    code: string;
    referred: number;
    rewardEarned: number;
  };
  email: string;
  gender: string;
  preferredSlot: string;
  favouriteServices: { name: string; orders: number }[];
  addresses: CustomerAddress[];
  orders: CustomerOrderRecord[];
  avgRating: number;
};

export type ReviewReply = {
  text: string;
  date: string;
};

export type PartnerReview = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhoto: string | null;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  serviceName: string;
  orderId: string;
  date: string;
  helpfulCount: number;
  images: number;
  reply: ReviewReply | null;
};

export type CustomersReviewsData = {
  customers: PartnerCustomer[];
  reviews: PartnerReview[];
};

/* -------------------------------------------------------------------------- */
/* Filters & sorts                                                            */
/* -------------------------------------------------------------------------- */

export const CUSTOMER_FILTERS = [
  { id: "new", label: "New" },
  { id: "repeat", label: "Repeat" },
  { id: "premium", label: "Premium Members" },
  { id: "high-value", label: "High Value" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
] as const;

export type CustomerFilterId = (typeof CUSTOMER_FILTERS)[number]["id"];

export const REVIEW_SORTS = [
  { id: "latest", label: "Latest" },
  { id: "highest", label: "Highest Rating" },
  { id: "lowest", label: "Lowest Rating" },
  { id: "helpful", label: "Most Helpful" },
] as const;

export type ReviewSortId = (typeof REVIEW_SORTS)[number]["id"];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function matchesCustomerQuery(customer: PartnerCustomer, rawQuery: string) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;
  return (
    customer.name.toLowerCase().includes(query) ||
    customer.mobile.replace(/\s/g, "").includes(query.replace(/\s/g, "")) ||
    customer.id.toLowerCase().includes(query)
  );
}

export function matchesCustomerFilter(customer: PartnerCustomer, filter: CustomerFilterId) {
  if (filter === "active" || filter === "inactive") return customer.status === filter;
  return customer.segments.includes(filter);
}

export function sortReviews(reviews: PartnerReview[], sort: ReviewSortId) {
  const list = [...reviews];
  switch (sort) {
    case "highest":
      return list.sort((a, b) => b.rating - a.rating);
    case "lowest":
      return list.sort((a, b) => a.rating - b.rating);
    case "helpful":
      return list.sort((a, b) => b.helpfulCount - a.helpfulCount);
    case "latest":
    default:
      return list.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  }
}

export type ReviewAnalytics = {
  average: number;
  total: number;
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
  replied: number;
};

export function buildReviewAnalytics(reviews: PartnerReview[]): ReviewAnalytics {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
  let sum = 0;
  let replied = 0;
  for (const review of reviews) {
    counts[review.rating] += 1;
    sum += review.rating;
    if (review.reply) replied += 1;
  }
  return {
    average: reviews.length ? Number((sum / reviews.length).toFixed(1)) : 0,
    total: reviews.length,
    counts,
    replied,
  };
}

/* -------------------------------------------------------------------------- */
/* Mock records                                                               */
/* -------------------------------------------------------------------------- */

const customers: PartnerCustomer[] = [
  {
    id: "QPC-10241",
    name: "Ananya Sharma",
    mobile: "+91 98200 41235",
    photo: null,
    memberSince: "2023-04-12",
    totalOrders: 48,
    totalSpend: 38240,
    lastOrderDate: "2026-08-04",
    status: "active",
    segments: ["repeat", "premium", "high-value"],
    membership: { tier: "Platinum", expiresOn: "2027-01-31", savedThisYear: 4120 },
    referral: { code: "ANANYA25", referred: 6, rewardEarned: 1200 },
    email: "ananya.sharma@example.com",
    gender: "Female",
    preferredSlot: "Morning · 8 AM – 11 AM",
    favouriteServices: [
      { name: "Wash & Fold", orders: 22 },
      { name: "Steam Ironing", orders: 14 },
      { name: "Dry Cleaning", orders: 8 },
    ],
    addresses: [
      { id: "a1", label: "Home", line: "Flat 1204, Lodha Bellezza, Andheri West", pincode: "400053", isDefault: true },
      { id: "a2", label: "Office", line: "5th Floor, Nirlon Knowledge Park, Goregaon", pincode: "400063", isDefault: false },
    ],
    orders: [
      { id: "QP-88214", service: "Wash & Fold", date: "2026-08-04", items: 12, amount: 840, status: "delivered" },
      { id: "QP-87990", service: "Dry Cleaning", date: "2026-07-27", items: 3, amount: 960, status: "delivered" },
      { id: "QP-87551", service: "Steam Ironing", date: "2026-07-18", items: 18, amount: 540, status: "delivered" },
      { id: "QP-87102", service: "Wash & Iron", date: "2026-07-06", items: 9, amount: 720, status: "cancelled" },
    ],
    avgRating: 4.8,
  },
  {
    id: "QPC-10388",
    name: "Rohit Verma",
    mobile: "+91 99303 77812",
    photo: null,
    memberSince: "2024-11-02",
    totalOrders: 21,
    totalSpend: 16480,
    lastOrderDate: "2026-08-01",
    status: "active",
    segments: ["repeat", "high-value"],
    membership: { tier: "Gold", expiresOn: "2026-11-02", savedThisYear: 1860 },
    referral: { code: "ROHIT10", referred: 2, rewardEarned: 400 },
    email: "rohit.verma@example.com",
    gender: "Male",
    preferredSlot: "Evening · 6 PM – 9 PM",
    favouriteServices: [
      { name: "Dry Cleaning", orders: 11 },
      { name: "Shoe Cleaning", orders: 6 },
    ],
    addresses: [
      { id: "a1", label: "Home", line: "B-704, Raheja Vihar, Powai", pincode: "400072", isDefault: true },
    ],
    orders: [
      { id: "QP-88180", service: "Dry Cleaning", date: "2026-08-01", items: 4, amount: 1280, status: "delivered" },
      { id: "QP-87720", service: "Shoe Cleaning", date: "2026-07-21", items: 2, amount: 700, status: "delivered" },
      { id: "QP-87330", service: "Wash & Fold", date: "2026-07-09", items: 10, amount: 690, status: "delivered" },
    ],
    avgRating: 4.5,
  },
  {
    id: "QPC-10422",
    name: "Priya Nair",
    mobile: "+91 91670 22458",
    photo: null,
    memberSince: "2026-07-28",
    totalOrders: 2,
    totalSpend: 1340,
    lastOrderDate: "2026-08-05",
    status: "active",
    segments: ["new"],
    membership: { tier: "None", expiresOn: null, savedThisYear: 0 },
    referral: { code: "PRIYA05", referred: 0, rewardEarned: 0 },
    email: "priya.nair@example.com",
    gender: "Female",
    preferredSlot: "Afternoon · 1 PM – 4 PM",
    favouriteServices: [{ name: "Wash & Iron", orders: 2 }],
    addresses: [
      { id: "a1", label: "Home", line: "302, Sea Breeze CHS, Bandra West", pincode: "400050", isDefault: true },
    ],
    orders: [
      { id: "QP-88250", service: "Wash & Iron", date: "2026-08-05", items: 8, amount: 690, status: "in-progress" },
      { id: "QP-88101", service: "Wash & Fold", date: "2026-07-29", items: 7, amount: 650, status: "delivered" },
    ],
    avgRating: 5,
  },
  {
    id: "QPC-10099",
    name: "Imran Qureshi",
    mobile: "+91 98675 10093",
    photo: null,
    memberSince: "2022-09-15",
    totalOrders: 63,
    totalSpend: 51290,
    lastOrderDate: "2026-05-12",
    status: "inactive",
    segments: ["repeat", "high-value", "premium"],
    membership: { tier: "Gold", expiresOn: "2026-09-15", savedThisYear: 2280 },
    referral: { code: "IMRAN63", referred: 9, rewardEarned: 1800 },
    email: "imran.q@example.com",
    gender: "Male",
    preferredSlot: "Morning · 8 AM – 11 AM",
    favouriteServices: [
      { name: "Wash & Fold", orders: 30 },
      { name: "Curtain Cleaning", orders: 9 },
    ],
    addresses: [
      { id: "a1", label: "Home", line: "A-12, Sunshine Residency, Kurla West", pincode: "400070", isDefault: true },
      { id: "a2", label: "Parents", line: "14, Green Park Road, Chembur", pincode: "400071", isDefault: false },
    ],
    orders: [
      { id: "QP-81120", service: "Curtain Cleaning", date: "2026-05-12", items: 5, amount: 2100, status: "delivered" },
      { id: "QP-80540", service: "Wash & Fold", date: "2026-04-28", items: 15, amount: 980, status: "delivered" },
    ],
    avgRating: 4.2,
  },
  {
    id: "QPC-10510",
    name: "Sneha Kulkarni",
    mobile: "+91 90045 88231",
    photo: null,
    memberSince: "2026-06-19",
    totalOrders: 5,
    totalSpend: 4380,
    lastOrderDate: "2026-07-31",
    status: "active",
    segments: ["new", "repeat"],
    membership: { tier: "Silver", expiresOn: "2027-06-19", savedThisYear: 340 },
    referral: { code: "SNEHA20", referred: 1, rewardEarned: 200 },
    email: "sneha.k@example.com",
    gender: "Female",
    preferredSlot: "Evening · 6 PM – 9 PM",
    favouriteServices: [
      { name: "Steam Ironing", orders: 3 },
      { name: "Wash & Fold", orders: 2 },
    ],
    addresses: [
      { id: "a1", label: "Home", line: "701, Orchid Enclave, Malad East", pincode: "400097", isDefault: true },
    ],
    orders: [
      { id: "QP-88040", service: "Steam Ironing", date: "2026-07-31", items: 20, amount: 600, status: "delivered" },
      { id: "QP-87610", service: "Wash & Fold", date: "2026-07-14", items: 11, amount: 820, status: "delivered" },
    ],
    avgRating: 4.6,
  },
  {
    id: "QPC-10634",
    name: "Devansh Patel",
    mobile: "+91 97690 44120",
    photo: null,
    memberSince: "2025-02-08",
    totalOrders: 12,
    totalSpend: 9120,
    lastOrderDate: "2026-06-22",
    status: "inactive",
    segments: ["repeat"],
    membership: { tier: "None", expiresOn: null, savedThisYear: 0 },
    referral: { code: "DEV12", referred: 0, rewardEarned: 0 },
    email: "devansh.patel@example.com",
    gender: "Male",
    preferredSlot: "Afternoon · 1 PM – 4 PM",
    favouriteServices: [{ name: "Wash & Iron", orders: 8 }],
    addresses: [
      { id: "a1", label: "Home", line: "22, Silver Oak Society, Vile Parle East", pincode: "400057", isDefault: true },
    ],
    orders: [
      { id: "QP-84420", service: "Wash & Iron", date: "2026-06-22", items: 9, amount: 740, status: "delivered" },
    ],
    avgRating: 3.9,
  },
];

const reviews: PartnerReview[] = [
  {
    id: "REV-5012",
    customerId: "QPC-10241",
    customerName: "Ananya Sharma",
    customerPhoto: null,
    rating: 5,
    text: "Clothes came back spotless and neatly folded. Pickup was right on time and the delivery partner was very polite.",
    serviceName: "Wash & Fold",
    orderId: "QP-88214",
    date: "2026-08-05",
    helpfulCount: 24,
    images: 2,
    reply: { text: "Thank you Ananya! Always a pleasure serving you.", date: "2026-08-05" },
  },
  {
    id: "REV-5009",
    customerId: "QPC-10422",
    customerName: "Priya Nair",
    customerPhoto: null,
    rating: 4,
    text: "Great ironing quality. Would love a slightly earlier delivery slot next time.",
    serviceName: "Wash & Iron",
    orderId: "QP-88101",
    date: "2026-08-02",
    helpfulCount: 11,
    images: 1,
    reply: null,
  },
  {
    id: "REV-5004",
    customerId: "QPC-10388",
    customerName: "Rohit Verma",
    customerPhoto: null,
    rating: 5,
    text: "Dry cleaning on my blazer was excellent — the stain is completely gone.",
    serviceName: "Dry Cleaning",
    orderId: "QP-88180",
    date: "2026-08-01",
    helpfulCount: 18,
    images: 0,
    reply: null,
  },
  {
    id: "REV-4988",
    customerId: "QPC-10510",
    customerName: "Sneha Kulkarni",
    customerPhoto: null,
    rating: 3,
    text: "Quality was fine but the order reached me a day later than promised.",
    serviceName: "Steam Ironing",
    orderId: "QP-88040",
    date: "2026-07-31",
    helpfulCount: 7,
    images: 0,
    reply: { text: "Sorry about the delay Sneha — we have added an extra evening run in your area.", date: "2026-08-01" },
  },
  {
    id: "REV-4960",
    customerId: "QPC-10634",
    customerName: "Devansh Patel",
    customerPhoto: null,
    rating: 2,
    text: "One shirt button was missing after the wash. Support resolved it, but it was inconvenient.",
    serviceName: "Wash & Iron",
    orderId: "QP-84420",
    date: "2026-06-24",
    helpfulCount: 4,
    images: 3,
    reply: null,
  },
  {
    id: "REV-4931",
    customerId: "QPC-10099",
    customerName: "Imran Qureshi",
    customerPhoto: null,
    rating: 4,
    text: "Curtains look brand new. Pricing is fair for the effort involved.",
    serviceName: "Curtain Cleaning",
    orderId: "QP-81120",
    date: "2026-05-14",
    helpfulCount: 9,
    images: 1,
    reply: null,
  },
  {
    id: "REV-4902",
    customerId: "QPC-10099",
    customerName: "Imran Qureshi",
    customerPhoto: null,
    rating: 1,
    text: "Missed the scheduled pickup slot entirely and I had to reschedule twice.",
    serviceName: "Wash & Fold",
    orderId: "QP-80540",
    date: "2026-04-29",
    helpfulCount: 2,
    images: 0,
    reply: { text: "We are truly sorry — the route has been reassigned to a dedicated rider.", date: "2026-04-30" },
  },
];

/**
 * TODO(api): replace with `GET /partner/customers` + `GET /partner/reviews`.
 * The shape returned here is intentionally the shape the screens consume.
 */
export async function fetchPartnerCustomersData(): Promise<CustomersReviewsData> {
  await new Promise((resolve) => setTimeout(resolve, 650));
  return { customers, reviews };
}
