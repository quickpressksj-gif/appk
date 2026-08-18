/**
 * Catalog / commerce / support domain types shared by the mock backend and
 * every QuickPress frontend. These mirror what the real FastAPI backend will
 * eventually return from the corresponding REST endpoints.
 */

export type CategoryEntity = {
  id: string;
  title: string;
  description: string;
  icon: string;
  image: string;
  sortOrder: number;
  status: "active" | "inactive";
};

export type ServiceEntity = {
  id: string;
  name: string;
  categoryId: string;
  unit: string;
  price: number;
  image: string;
  description: string;
  badge: "Trending" | "Best Seller" | null;
  popular: boolean;
};

export type BannerEntity = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  image?: string;
  tone: "primary" | "green" | "dark";
  redirectUrl: string | null;
  priority: number;
};

export type OfferEntity = {
  id: string;
  code: string;
  title: string;
  description: string;
  kind: "cashback" | "festival" | "referral";
  discountLabel: string;
  expiresAt: string | null;
  banner: string | null;
};

export type CouponEntity = {
  id: string;
  code: string;
  discount: string;
  description: string;
  expiry: string;
  minOrder: number;
  status: "Active" | "Scheduled" | "Expired";
};

export type CityEntity = {
  id: string;
  city: string;
  state: string;
  areas: number;
  partners: number;
  riders: number;
  pickupRadius: string;
  status: "Live" | "Pilot" | "Paused";
};

export type AddressEntity = {
  id: string;
  accountId: string;
  type: "home" | "office" | "other";
  label: string;
  houseNumber: string;
  building: string;
  street: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  contactName: string;
  phone: string;
  isDefault: boolean;
};

export type WalletEntity = {
  accountId: string;
  balance: number;
  cashbackBalance: number;
  rewardPoints: number;
  referralCode: string;
  referralEarned: number;
};

export type TransactionEntity = {
  id: string;
  accountId: string;
  kind: "order-cashback" | "referral-bonus" | "refund" | "recharge" | "reward-credit" | "order-payment" | "payout" | "commission";
  title: string;
  date: string;
  amount: number;
  direction: "credit" | "debit";
  status: "success" | "pending" | "failed";
};

export type NotificationKind =
  | "partner-accepted"
  | "pickup-scheduled"
  | "pickup-completed"
  | "processing"
  | "out-for-delivery"
  | "delivered"
  | "wallet"
  | "cashback"
  | "offer"
  | "coupon"
  | "system"
  | "order-new"
  | "order-cancelled"
  | "rider-assigned"
  | "membership"
  | "referral";

/** Sprint 2.7 — high level grouping used by the notification filters. */
export type NotificationCategory =
  | "order"
  | "offer"
  | "wallet"
  | "membership"
  | "referral"
  | "system";

export type NotificationEntity = {
  id: string;
  accountId: string;
  role: "customer" | "partner" | "rider" | "admin";
  kind: NotificationKind;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  /** Sprint 2.7 — derived grouping used by the notification filters. */
  category?: NotificationCategory;
  /** Sprint 2.7 — related order, when the notification is order driven. */
  orderId?: string | null;
  orderCode?: string | null;
};

export type ReviewEntity = {
  id: string;
  orderId: string | null;
  partnerId: string | null;
  riderId: string | null;
  customerId: string;
  customerName: string;
  initials: string;
  rating: number;
  text: string;
  createdAt: string;
};

export type PlatformSettingsEntity = {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  defaultCity: string;
  currency: string;
  gstPercent: string;
  defaultCommission: string;
  riderCommission: string;
};

export type StaffEntity = {
  id: string;
  name: string;
  email: string;
  role: string;
  scope: string;
  lastActive: string;
  status: "Active" | "Invited" | "Disabled";
};

export type SupportTicketEntity = {
  id: string;
  accountId: string;
  subject: string;
  description: string;
  source: "Customer" | "Partner" | "Rider";
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In progress" | "Resolved";
  createdAt: string;
};

export type CartItemEntity = {
  id: string;
  accountId: string;
  partnerId: string;
  serviceId: string;
  name: string;
  price: number;
  unit: string;
  qty: number;
  image: string;
};

export type PaymentMethodEntity = {
  id: string;
  kind: "upi" | "debit-card" | "credit-card" | "wallet" | "cod";
  name: string;
  masked: string;
  note: string;
  isDefault: boolean;
};
