/**
 * Dummy dataset for the QuickPress mock backend.
 *
 * Everything the four apps need to run an end-to-end lifecycle test:
 * dummy customers, partners, riders, an admin, and a handful of orders spread
 * across the lifecycle so every screen has realistic content on first load.
 */

import store1 from "@/shared/assets/store-1.jpg";
import store2 from "@/shared/assets/store-2.jpg";
import store3 from "@/shared/assets/store-3.jpg";
import type { Account, Order, OrderLifecycleStatus, OrderLine } from "@/shared/types";

export type MockPartner = {
  id: string;
  accountId: string;
  name: string;
  ownerName: string;
  phone: string;
  image: string;
  city: string;
  area: string;
  rating: number;
  totalOrders: number;
  isOpen: boolean;
  acceptingNewOrders: boolean;
  autoAccept: boolean;
  joinedOn: string;
  status: "active" | "pending" | "suspended";
  services: { id: string; name: string; unit: string; price: number; enabled: boolean }[];
};

export type MockRider = {
  id: string;
  accountId: string;
  name: string;
  phone: string;
  city: string;
  vehicle: string;
  plate: string;
  rating: number;
  trips: number;
  isOnline: boolean;
  status: "active" | "pending" | "suspended";
  joinedOn: string;
};

export const SEED_ACCOUNTS: Account[] = [
  {
    id: "cus-1001",
    role: "customer",
    name: "Aarav Sharma",
    phone: "9876543210",
    email: "aarav@quickpress.test",
    city: "Bengaluru",
    avatarInitials: "AS",
    isOnboarded: true,
    isVerified: true,
  },
  {
    id: "cus-1002",
    role: "customer",
    name: "Meera Iyer",
    phone: "9812345678",
    email: "meera@quickpress.test",
    city: "Bengaluru",
    avatarInitials: "MI",
    isOnboarded: true,
    isVerified: true,
  },
  {
    id: "prt-2001",
    role: "partner",
    name: "Sparkle Laundry Works",
    phone: "9900112233",
    email: "sparkle@quickpress.test",
    city: "Bengaluru",
    avatarInitials: "SL",
    isOnboarded: true,
    isVerified: true,
  },
  {
    id: "prt-2002",
    role: "partner",
    name: "FreshFold Dry Clean",
    phone: "9900445566",
    email: "freshfold@quickpress.test",
    city: "Bengaluru",
    avatarInitials: "FD",
    isOnboarded: true,
    isVerified: true,
  },
  {
    id: "rdr-3001",
    role: "rider",
    name: "Imran Khan",
    phone: "9765432109",
    email: "imran@quickpress.test",
    city: "Bengaluru",
    avatarInitials: "IK",
    isOnboarded: true,
    isVerified: true,
  },
  {
    id: "rdr-3002",
    role: "rider",
    name: "Ravi Verma",
    phone: "9765111222",
    email: "ravi@quickpress.test",
    city: "Bengaluru",
    avatarInitials: "RV",
    isOnboarded: true,
    isVerified: true,
  },
  {
    id: "adm-4001",
    role: "admin",
    name: "QuickPress Ops",
    phone: "9000000001",
    email: "admin@quickpress.test",
    city: "Bengaluru",
    avatarInitials: "QP",
    isOnboarded: true,
    isVerified: true,
  },
];

export const SEED_PARTNERS: MockPartner[] = [
  {
    id: "prt-2001",
    accountId: "prt-2001",
    name: "Sparkle Laundry Works",
    ownerName: "Vikram Rao",
    phone: "9900112233",
    image: store1,
    city: "Bengaluru",
    area: "Indiranagar",
    rating: 4.7,
    totalOrders: 1284,
    isOpen: true,
    acceptingNewOrders: true,
    autoAccept: false,
    joinedOn: "2024-03-12",
    status: "active",
    services: [
      { id: "svc-wash-fold", name: "Wash & Fold", unit: "per kg", price: 79, enabled: true },
      { id: "svc-steam-iron", name: "Steam Iron", unit: "per piece", price: 15, enabled: true },
      { id: "svc-dry-clean", name: "Dry Clean", unit: "per piece", price: 129, enabled: true },
      { id: "svc-premium", name: "Premium Care", unit: "per piece", price: 249, enabled: false },
    ],
  },
  {
    id: "prt-2002",
    accountId: "prt-2002",
    name: "FreshFold Dry Clean",
    ownerName: "Anita Desai",
    phone: "9900445566",
    image: store2,
    city: "Bengaluru",
    area: "Koramangala",
    rating: 4.5,
    totalOrders: 862,
    isOpen: true,
    acceptingNewOrders: true,
    autoAccept: false,
    joinedOn: "2024-07-02",
    status: "active",
    services: [
      { id: "svc-wash-fold", name: "Wash & Fold", unit: "per kg", price: 89, enabled: true },
      { id: "svc-shoes", name: "Shoe Care", unit: "per pair", price: 199, enabled: true },
      { id: "svc-curtain", name: "Curtains", unit: "per piece", price: 159, enabled: true },
    ],
  },
  {
    id: "prt-2003",
    accountId: "prt-2003",
    name: "UrbanPress Studio",
    ownerName: "Sameer Joshi",
    phone: "9900778899",
    image: store3,
    city: "Bengaluru",
    area: "HSR Layout",
    rating: 4.3,
    totalOrders: 219,
    isOpen: false,
    acceptingNewOrders: false,
    autoAccept: false,
    joinedOn: "2025-11-18",
    status: "pending",
    services: [
      { id: "svc-wash-fold", name: "Wash & Fold", unit: "per kg", price: 75, enabled: true },
    ],
  },
];

export const SEED_RIDERS: MockRider[] = [
  {
    id: "rdr-3001",
    accountId: "rdr-3001",
    name: "Imran Khan",
    phone: "9765432109",
    city: "Bengaluru",
    vehicle: "Honda Activa",
    plate: "KA 05 JD 4412",
    rating: 4.8,
    trips: 1420,
    isOnline: true,
    status: "active",
    joinedOn: "2024-05-21",
  },
  {
    id: "rdr-3002",
    accountId: "rdr-3002",
    name: "Ravi Verma",
    phone: "9765111222",
    city: "Bengaluru",
    vehicle: "TVS Jupiter",
    plate: "KA 03 MN 8890",
    rating: 4.6,
    trips: 733,
    isOnline: true,
    status: "active",
    joinedOn: "2025-01-09",
  },
  {
    id: "rdr-3003",
    accountId: "rdr-3003",
    name: "Sunil Yadav",
    phone: "9765333444",
    city: "Bengaluru",
    vehicle: "Ather 450X",
    plate: "KA 51 EV 1207",
    rating: 4.4,
    trips: 96,
    isOnline: false,
    status: "pending",
    joinedOn: "2026-02-02",
  },
];

const ADDRESSES = [
  { label: "Home", line: "402, Sunrise Residency, 12th Main", city: "Indiranagar, Bengaluru" },
  { label: "Work", line: "WeWork Galaxy, 43 Residency Road", city: "Bengaluru" },
  { label: "Home", line: "18, Lake View Apartments, 5th Block", city: "Koramangala, Bengaluru" },
];

function lines(...items: [string, number, number][]): OrderLine[] {
  return items.map(([name, qty, price], index) => ({
    id: `line-${index + 1}-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    qty,
    price,
  }));
}

function totalsFor(items: OrderLine[], discount = 0) {
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

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function seedOrder(input: {
  index: number;
  status: OrderLifecycleStatus;
  customerIndex: 0 | 1;
  partnerIndex: 0 | 1;
  riderIndex: 0 | 1 | null;
  ageHours: number;
  items: OrderLine[];
  serviceLabel: string;
  paid: boolean;
  mode: "online" | "cod";
}): Order {
  const customer = SEED_ACCOUNTS.filter((a) => a.role === "customer")[input.customerIndex]!;
  const partner = SEED_PARTNERS[input.partnerIndex]!;
  const rider = input.riderIndex === null ? null : SEED_RIDERS[input.riderIndex]!;
  const address = ADDRESSES[input.index % ADDRESSES.length]!;
  const code = `QP${1040 + input.index}`;
  const createdAt = hoursAgo(input.ageHours);

  const lifecycleUpTo: OrderLifecycleStatus[] = [
    "placed",
    "partner_accepted",
    "rider_assigned",
    "picked_up",
    "at_partner",
    "processing",
    "completed",
    "out_for_delivery",
    "delivered",
  ];
  const stopAt = lifecycleUpTo.indexOf(input.status);
  const events = lifecycleUpTo.slice(0, stopAt + 1).map((status, position) => ({
    id: `${code}-evt-${position}`,
    status,
    label: status,
    at: hoursAgo(Math.max(input.ageHours - position * 0.6, 0.1)),
    actor: (status === "placed"
      ? "customer"
      : status === "partner_accepted" || status === "processing" || status === "completed"
        ? "partner"
        : status === "rider_assigned"
          ? "system"
          : "rider") as "customer" | "partner" | "rider" | "system",
  }));

  return {
    id: `ord-${code}`,
    code,
    status: input.status,
    createdAt,
    updatedAt: events[events.length - 1]?.at ?? createdAt,
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
    serviceLabel: input.serviceLabel,
    items: input.items,
    totals: totalsFor(input.items, input.index % 2 === 0 ? 40 : 0),
    address: { ...address, phone: customer.phone },
    pickup: { date: "Today", slot: "6:00 PM - 8:00 PM", express: input.index % 3 === 0 },
    delivery: { date: "Tomorrow", slot: "10:00 AM - 12:00 PM" },
    payment: {
      mode: input.mode,
      label: input.mode === "online" ? "UPI · Google Pay" : "Cash on delivery",
      note: input.paid ? "Paid" : "Pay after delivery",
      paid: input.paid,
    },
    otp: { pickup: "4271", delivery: "8615" },
    events,
    cancelledReason: null,
  };
}

export const SEED_ORDERS: Order[] = [
  seedOrder({
    index: 1,
    status: "placed",
    customerIndex: 0,
    partnerIndex: 0,
    riderIndex: null,
    ageHours: 0.4,
    items: lines(["Wash & Fold", 4, 79], ["Steam Iron", 6, 15]),
    serviceLabel: "Wash & Fold",
    paid: true,
    mode: "online",
  }),
  seedOrder({
    index: 2,
    status: "rider_assigned",
    customerIndex: 1,
    partnerIndex: 0,
    riderIndex: 0,
    ageHours: 1.6,
    items: lines(["Dry Clean · Blazer", 1, 129], ["Dry Clean · Saree", 2, 149]),
    serviceLabel: "Dry Clean",
    paid: false,
    mode: "cod",
  }),
  seedOrder({
    index: 3,
    status: "processing",
    customerIndex: 0,
    partnerIndex: 1,
    riderIndex: 1,
    ageHours: 6,
    items: lines(["Wash & Iron", 5, 89], ["Curtains", 2, 159]),
    serviceLabel: "Wash & Iron",
    paid: true,
    mode: "online",
  }),
  seedOrder({
    index: 4,
    status: "out_for_delivery",
    customerIndex: 1,
    partnerIndex: 1,
    riderIndex: 0,
    ageHours: 20,
    items: lines(["Shoe Care", 1, 199]),
    serviceLabel: "Shoe Care",
    paid: true,
    mode: "online",
  }),
  seedOrder({
    index: 5,
    status: "delivered",
    customerIndex: 0,
    partnerIndex: 0,
    riderIndex: 1,
    ageHours: 52,
    items: lines(["Wash & Fold", 7, 79], ["Blanket", 1, 349]),
    serviceLabel: "Wash & Fold",
    paid: true,
    mode: "online",
  }),
  seedOrder({
    index: 6,
    status: "delivered",
    customerIndex: 1,
    partnerIndex: 1,
    riderIndex: 0,
    ageHours: 96,
    items: lines(["Premium Care", 2, 249]),
    serviceLabel: "Premium Care",
    paid: true,
    mode: "online",
  }),
];
/* ------------------------------------------------------------------------ */
/*  Catalog, offers, cities, settings, help — canonical demo content.       */
/*  Copied verbatim from the *_FIXTURE constants the customer app used to   */
/*  hold locally, so every screen renders identical content once wired to  */
/*  these mock endpoints.                                                  */
/* ------------------------------------------------------------------------ */

import bannerOffer from "@/shared/assets/banner-offer.jpg";
import itemBlanket from "@/shared/assets/item-blanket.jpg";
import itemCarpet from "@/shared/assets/item-carpet.jpg";
import itemCurtain from "@/shared/assets/item-curtain.jpg";
import itemDryClean from "@/shared/assets/item-dry-clean.jpg";
import itemExpress from "@/shared/assets/item-express.jpg";
import itemPremium from "@/shared/assets/item-premium.jpg";
import itemShoes from "@/shared/assets/item-shoes.jpg";
import itemSteamIron from "@/shared/assets/item-steam-iron.jpg";
import itemWashFold from "@/shared/assets/item-wash-fold.jpg";
import type {
  BannerEntity,
  CartItemEntity,
  CategoryEntity,
  CityEntity,
  CouponEntity,
  OfferEntity,
  PaymentMethodEntity,
  PlatformSettingsEntity,
  ServiceEntity,
  StaffEntity,
} from "@/shared/types";

export const SEED_CATEGORIES: CategoryEntity[] = [
  { id: "c1", title: "Wash & Fold", description: "Everyday laundry", icon: "washing-machine", image: itemWashFold, sortOrder: 1, status: "active" },
  { id: "c2", title: "Dry Cleaning", description: "Delicate fabrics", icon: "shirt", image: itemDryClean, sortOrder: 2, status: "active" },
  { id: "c3", title: "Steam Iron", description: "Crisp finish", icon: "flame", image: itemSteamIron, sortOrder: 3, status: "active" },
  { id: "c4", title: "Premium Laundry", description: "Hand finished", icon: "sparkles", image: itemPremium, sortOrder: 4, status: "active" },
  { id: "c5", title: "Shoe Cleaning", description: "Deep restore", icon: "footprints", image: itemShoes, sortOrder: 5, status: "active" },
  { id: "c6", title: "Curtain Cleaning", description: "Home fabrics", icon: "blinds", image: itemCurtain, sortOrder: 6, status: "active" },
  { id: "c7", title: "Blanket Cleaning", description: "Bulky care", icon: "bed-double", image: itemBlanket, sortOrder: 7, status: "active" },
  { id: "c8", title: "Carpet Cleaning", description: "Fibre deep wash", icon: "layout-grid", image: itemCarpet, sortOrder: 8, status: "active" },
  { id: "c9", title: "Express Laundry", description: "Same day back", icon: "zap", image: itemExpress, sortOrder: 9, status: "active" },
];

export const SEED_SERVICES: ServiceEntity[] = [
  { id: "s1", name: "Wash & Iron", categoryId: "c1", unit: "per kg", price: 79, image: itemWashFold, description: "Everyday laundry washed, dried and neatly folded.", badge: "Trending", popular: true },
  { id: "s2", name: "Shirt Dry Clean", categoryId: "c2", unit: "per piece", price: 99, image: itemDryClean, description: "Solvent care for shirts and delicate fabrics.", badge: "Best Seller", popular: true },
  { id: "s3", name: "Saree Care", categoryId: "c4", unit: "per piece", price: 249, image: itemPremium, description: "Hand finished care for fine sarees.", badge: null, popular: true },
  { id: "s4", name: "Sneaker Spa", categoryId: "c5", unit: "per pair", price: 299, image: itemShoes, description: "Deep restore for sneakers, leather and suede.", badge: "Trending", popular: true },
  { id: "s5", name: "Blanket Wash", categoryId: "c7", unit: "per piece", price: 349, image: itemBlanket, description: "Bulky quilts and blankets washed and sun dried.", badge: null, popular: true },
  { id: "s6", name: "Curtain Cleaning", categoryId: "c6", unit: "per panel", price: 229, image: itemCurtain, description: "Dust free home fabrics with shrink safe washing.", badge: null, popular: false },
  { id: "s7", name: "Carpet Shampoo", categoryId: "c8", unit: "per carpet", price: 449, image: itemCarpet, description: "Fibre deep shampoo wash with odour removal.", badge: null, popular: false },
  { id: "s8", name: "Express Laundry", categoryId: "c9", unit: "per kg", price: 129, image: itemExpress, description: "Same day turnaround for urgent wardrobe rescues.", badge: null, popular: false },
  { id: "s9", name: "Steam Iron", categoryId: "c3", unit: "per piece", price: 15, image: itemSteamIron, description: "Crisp, wrinkle free finish with industrial steam presses.", badge: null, popular: false },
];

export const SEED_BANNERS: BannerEntity[] = [
  {
    id: "b1",
    eyebrow: "Limited period",
    title: "30% OFF",
    subtitle: "On your first three laundry pickups",
    cta: "Claim offer",
    image: bannerOffer,
    tone: "primary",
    redirectUrl: "/offers",
    priority: 1,
  },
  {
    id: "b2",
    eyebrow: "New",
    title: "Express Pickup",
    subtitle: "Doorstep collection in under 30 minutes",
    cta: "Book express",
    tone: "green",
    redirectUrl: null,
    priority: 2,
  },
  {
    id: "b3",
    eyebrow: "QuickPress Signature",
    title: "Premium Laundry",
    subtitle: "Hand finished care for your finest fabrics",
    cta: "Explore",
    tone: "dark",
    redirectUrl: null,
    priority: 3,
  },
  {
    id: "b4",
    eyebrow: "Festival special",
    title: "Flat ₹150 OFF",
    subtitle: "Fresh clothes for the celebrations",
    cta: "Grab now",
    tone: "primary",
    redirectUrl: "/offers",
    priority: 4,
  },
];

export const SEED_OFFERS: OfferEntity[] = [
  {
    id: "o1",
    code: "CASH50",
    title: "₹50 Cashback",
    description: "On orders above ₹499 paid via wallet",
    kind: "cashback",
    discountLabel: "₹50 back",
    expiresAt: null,
    banner: null,
  },
  {
    id: "o2",
    code: "FEST25",
    title: "25% Festival Off",
    description: "Valid on all dry cleaning this week",
    kind: "festival",
    discountLabel: "25% off",
    expiresAt: null,
    banner: null,
  },
  {
    id: "o3",
    code: "REFER100",
    title: "Refer & Earn ₹100",
    description: "For you and every friend who joins",
    kind: "referral",
    discountLabel: "₹100",
    expiresAt: null,
    banner: null,
  },
];

export const SEED_COUPONS: CouponEntity[] = [
  { id: "C-1", code: "QPFIRST50", discount: "50% OFF", description: "On your first QuickPress pickup", expiry: "Valid till 31 Aug", minOrder: 199, status: "Active" },
  { id: "C-2", code: "PRESS250", discount: "₹250 OFF", description: "On premium dry clean orders", expiry: "Valid till 20 Aug", minOrder: 799, status: "Active" },
  { id: "C-3", code: "WALLET15", discount: "15% CASHBACK", description: "Pay using QuickPress wallet", expiry: "Valid till 12 Aug", minOrder: 349, status: "Active" },
  { id: "C-4", code: "QUICK150", discount: "₹150 OFF", description: "On orders above ₹499", expiry: "Valid till 30 Sep", minOrder: 499, status: "Active" },
];

export const SEED_CITIES: CityEntity[] = [
  { id: "CI-1", city: "Mumbai", state: "Maharashtra", areas: 18, partners: 64, riders: 210, pickupRadius: "6 km", status: "Live" },
  { id: "CI-2", city: "Pune", state: "Maharashtra", areas: 9, partners: 28, riders: 74, pickupRadius: "5 km", status: "Live" },
  { id: "CI-3", city: "Bengaluru", state: "Karnataka", areas: 14, partners: 41, riders: 128, pickupRadius: "7 km", status: "Live" },
  { id: "CI-4", city: "Hyderabad", state: "Telangana", areas: 6, partners: 12, riders: 30, pickupRadius: "4 km", status: "Pilot" },
];

export const SEED_SETTINGS: PlatformSettingsEntity = {
  platformName: "QuickPress",
  supportEmail: "help@quickpress.in",
  supportPhone: "+91 1800 200 400",
  defaultCity: "Mumbai",
  currency: "INR (₹)",
  gstPercent: "18%",
  defaultCommission: "18%",
  riderCommission: "12%",
};

export const SEED_STAFF: StaffEntity[] = [
  { id: "ST-1", name: "Meera Iyer", email: "meera@quickpress.in", role: "Super admin", scope: "All cities", lastActive: "2 min ago", status: "Active" },
  { id: "ST-2", name: "Arjun Bose", email: "arjun@quickpress.in", role: "Ops manager", scope: "Mumbai", lastActive: "18 min ago", status: "Active" },
  { id: "ST-3", name: "Tanvi Sheth", email: "tanvi@quickpress.in", role: "Support lead", scope: "All cities", lastActive: "1 hr ago", status: "Active" },
  { id: "ST-4", name: "Raghav Nanda", email: "raghav@quickpress.in", role: "Finance", scope: "All cities", lastActive: "—", status: "Invited" },
];

export const SEED_FAQS = [
  {
    id: "faq-1",
    question: "How long does a standard laundry order take?",
    answer:
      "Standard wash & fold is delivered within 24–48 hours of pickup. Dry cleaning and premium care take 48–72 hours. Express slots deliver the same day if picked up before 10 AM.",
  },
  {
    id: "faq-2",
    question: "Can I reschedule my pickup slot?",
    answer:
      "Yes. Open the order from History and tap Reschedule up to 60 minutes before the slot starts. Rescheduling is free once per order.",
  },
  {
    id: "faq-3",
    question: "What if an item is damaged or missing?",
    answer:
      "Raise a ticket within 48 hours of delivery with a photo. Verified claims are compensated up to 10× the service value of the item.",
  },
  {
    id: "faq-4",
    question: "When is my refund credited?",
    answer:
      "Wallet refunds are instant. Refunds to UPI, cards or netbanking reach your bank in 3–5 working days after approval.",
  },
  {
    id: "faq-5",
    question: "Why did my coupon not apply?",
    answer:
      "Coupons have minimum order values, service restrictions and expiry dates. Check the offer terms on the Offers screen, or contact support with the code.",
  },
  {
    id: "faq-6",
    question: "How do I change my default address?",
    answer:
      "Go to Saved Addresses, open the card you want and tap Set Default. Every new order will then use that address automatically.",
  },
];

export const SEED_HELP_TOPICS = [
  { id: "track", label: "Track My Order", note: "Live pickup & delivery status" },
  { id: "cancel", label: "Cancel Order", note: "Free before pickup" },
  { id: "refund", label: "Refund Policy", note: "Refunds in 3–5 days" },
  { id: "payment", label: "Payment Issues", note: "Failed or double charge" },
  { id: "pickup-delay", label: "Pickup Delay", note: "Rider running late" },
  { id: "delivery-delay", label: "Delivery Delay", note: "Order not delivered" },
  { id: "coupons", label: "Coupons", note: "Codes & offer terms" },
  { id: "account", label: "Account Settings", note: "Profile, phone & privacy" },
];

export const SEED_SUPPORT_CONTACT = {
  phone: "18001234567",
  phoneLabel: "1800 123 4567",
  whatsapp: "919876543210",
  email: "support@quickpress.app",
  appVersion: "2.4.1",
  responseTime: "Under 2 minutes",
};

export const SEED_PAYMENT_METHODS: PaymentMethodEntity[] = [
  { id: "PM-8801", kind: "upi", name: "UPI · Google Pay", masked: "aarav@okhdfcbank", note: "Instant pay · no charges", isDefault: true },
  { id: "PM-8802", kind: "credit-card", name: "HDFC Regalia Credit Card", masked: "•••• •••• •••• 4821", note: "Expires 04/28", isDefault: false },
  { id: "PM-8803", kind: "debit-card", name: "ICICI Coral Debit Card", masked: "•••• •••• •••• 7710", note: "Expires 11/27", isDefault: false },
  { id: "PM-8804", kind: "wallet", name: "QuickPress Wallet", masked: "Balance ₹1,240", note: "Cashback eligible", isDefault: false },
  { id: "PM-8805", kind: "cod", name: "Cash on Delivery", masked: "Pay at doorstep", note: "Available on orders under ₹3,000", isDefault: false },
];

/* ------------------------------------------------------------------------ */
/*  Locations, countries, slots — copied verbatim from the customer app's   */
/*  formerly-local constants so /api/locations, /api/countries and          */
/*  /api/slots render identical content once wired up.                      */
/* ------------------------------------------------------------------------ */

export type SeedPlace = { id: string; area: string; city: string; state: string };

export const SEED_LOCATIONS_RECENT: SeedPlace[] = [
  { id: "r1", area: "Koramangala 5th Block", city: "Bengaluru", state: "Karnataka" },
  { id: "r2", area: "Indiranagar 100ft Road", city: "Bengaluru", state: "Karnataka" },
];

export const SEED_LOCATIONS_SAVED: SeedPlace[] = [
  { id: "s1", area: "Prestige Shantiniketan, Whitefield", city: "Bengaluru", state: "Karnataka" },
];

export const SEED_LOCATIONS_NEARBY: SeedPlace[] = [
  { id: "n1", area: "HSR Layout Sector 2", city: "Bengaluru", state: "Karnataka" },
  { id: "n2", area: "BTM Layout 1st Stage", city: "Bengaluru", state: "Karnataka" },
  { id: "n3", area: "Ejipura Main Road", city: "Bengaluru", state: "Karnataka" },
];

export const SEED_LOCATIONS_POPULAR: SeedPlace[] = [
  { id: "p1", area: "Bandra West", city: "Mumbai", state: "Maharashtra" },
  { id: "p2", area: "Connaught Place", city: "New Delhi", state: "Delhi" },
  { id: "p3", area: "Banjara Hills", city: "Hyderabad", state: "Telangana" },
  { id: "p4", area: "Salt Lake Sector V", city: "Kolkata", state: "West Bengal" },
];

export const SEED_COUNTRIES = [
  { code: "+91", label: "IN", digits: 10 },
  { code: "+1", label: "US", digits: 10 },
  { code: "+44", label: "UK", digits: 10 },
  { code: "+971", label: "AE", digits: 9 },
];

export const SEED_SLOT_DAYS = [
  { id: "today", label: "Today", sub: "Aug 3" },
  { id: "tomorrow", label: "Tomorrow", sub: "Aug 4" },
  { id: "custom", label: "Custom date", sub: "Pick a day" },
] as const;

export const SEED_SLOT_TIMES = [
  { id: "morning", label: "Morning", sub: "8 AM – 12 PM" },
  { id: "afternoon", label: "Afternoon", sub: "12 PM – 4 PM" },
  { id: "evening", label: "Evening", sub: "4 PM – 8 PM" },
] as const;

/* ------------------------------------------------------------------------ */
/*  Cart, offers page, payment providers, membership — copied verbatim from  */
/*  the customer app's formerly-local constants so the migrated screens      */
/*  render identical content through the API layer.                          */
/* ------------------------------------------------------------------------ */

export const SEED_CART_ITEMS: CartItemEntity[] = [
  {
    id: "i1",
    accountId: "cus-1001",
    partnerId: "prt-2002",
    serviceId: "svc-wash-fold",
    name: "Wash & Fold",
    price: 79,
    unit: "per kg",
    qty: 3,
    image: itemWashFold,
  },
  {
    id: "i2",
    accountId: "cus-1001",
    partnerId: "prt-2002",
    serviceId: "svc-dry-clean",
    name: "Dry Cleaning",
    price: 149,
    unit: "per piece",
    qty: 2,
    image: itemDryClean,
  },
  {
    id: "i3",
    accountId: "cus-1001",
    partnerId: "prt-2002",
    serviceId: "svc-steam-iron",
    name: "Steam Iron",
    price: 15,
    unit: "per piece",
    qty: 6,
    image: itemSteamIron,
  },
  {
    id: "i6",
    accountId: "cus-1001",
    partnerId: "prt-2002",
    serviceId: "svc-blanket",
    name: "Blanket Cleaning",
    price: 349,
    unit: "per piece",
    qty: 1,
    image: itemBlanket,
  },
];

export const SEED_CART_ITEM_DESCRIPTIONS: Record<string, string> = {
  i1: "Everyday laundry, washed and neatly folded",
  i2: "Delicate fabrics handled by specialists",
  i3: "Crisp, wrinkle free finish",
  i6: "Bulky care with deep fibre wash",
};

export const SEED_CART_CHARGES = {
  pickup: 29,
  delivery: 39,
  handling: 15,
  gstRate: 0.05,
  discount: 50,
};

export const SEED_CART_FULFILMENT = {
  pickupEta: "Today, 30 min",
  deliveryEta: "Tomorrow, 6 PM",
  reviews: "2.1k",
};

export const SEED_CART_COUPONS = [
  {
    id: "cp1",
    code: "QUICK150",
    title: "Flat ₹150 OFF",
    description: "On orders above ₹499",
    discount: 150,
    best: true,
  },
  {
    id: "cp2",
    code: "FEST25",
    title: "25% Festival Off",
    description: "Up to ₹120 on all services",
    discount: 120,
  },
  {
    id: "cp3",
    code: "CASH50",
    title: "₹50 Cashback",
    description: "Paid via QuickPress wallet",
    discount: 50,
  },
];

export const SEED_CART_INSTRUCTION_CHIPS = [
  "Handle with Care",
  "Use Premium Detergent",
  "Do Not Iron",
];

export const SEED_OFFER_BANNERS = [
  {
    id: "B-1",
    eyebrow: "Festival Offer",
    title: "Flat 40% off",
    subtitle: "On every dry clean order this festive week",
    tone: "festival" as const,
  },
  {
    id: "B-2",
    eyebrow: "Special Discount",
    title: "Buy 2 get 1 free",
    subtitle: "Steam iron bundles for the whole family",
    tone: "discount" as const,
  },
  {
    id: "B-3",
    eyebrow: "Cashback Offer",
    title: "₹150 cashback",
    subtitle: "Pay with wallet on orders above ₹499",
    tone: "cashback" as const,
  },
];

export const SEED_SPECIAL_OFFERS = [
  {
    id: "S-1",
    kind: "first-order" as const,
    title: "First Order Offer",
    description: "Get 50% off up to ₹150 on your very first pickup.",
    highlight: "New users",
  },
  {
    id: "S-2",
    kind: "referral" as const,
    title: "Referral Bonus",
    description: "Invite a friend and both of you earn ₹150 wallet credit.",
    highlight: "₹150 each",
  },
  {
    id: "S-3",
    kind: "membership" as const,
    title: "QuickPress+ Membership",
    description: "Free pickups, priority slots and 10% off every order.",
    highlight: "₹99 / month",
  },
  {
    id: "S-4",
    kind: "festival" as const,
    title: "Festival Sale",
    description: "Extra 20% off on curtains, carpets and blankets.",
    highlight: "Limited time",
  },
];

export const SEED_SCRATCH_CARDS = [
  { id: "SC-1", reward: "₹75 Cashback", caption: "Credited to wallet instantly" },
  { id: "SC-2", reward: "200 Points", caption: "Added to loyalty balance" },
];

export const SEED_PAYMENT_PROVIDERS = [
  { id: "gpay", name: "Google Pay", tagline: "UPI · Instant", initials: "G" },
  { id: "phonepe", name: "PhonePe", tagline: "UPI · Rewards", initials: "P" },
  { id: "paytm", name: "Paytm", tagline: "Wallet & UPI", initials: "PT" },
  { id: "amazonpay", name: "Amazon Pay", tagline: "Wallet · Cashback", initials: "A" },
  { id: "razorpay", name: "Razorpay", tagline: "Cards & Netbanking", initials: "R" },
];

export const SEED_MEMBERSHIP = {
  plan: "QuickPress Premium",
  active: true,
  renewsOn: "12 Sep 2026",
  daysLeft: 41,
  totalDays: 365,
  savedThisYear: 2360,
};

export const SEED_APP_META = {
  appVersion: "2.4.1 (build 318)",
  memberSince: "March 2023",
};
