import {
  BarChart3,
  Bell,
  Building2,
  Store,
  LayoutDashboard,
  ListOrdered,
  Megaphone,
  MessagesSquare,
  PieChart,
  Settings2,
  Sparkles,
  Star,
  Users,
  UserRound,
  Wallet,
} from "lucide-react";

/**
 * Central route map for the Partner app. Route files under
 * `partner-frontend/src/routes/*.tsx` are thin wrappers around these screens so the
 * customer frontend routes stay untouched.
 */
export const partnerRoutes = {
  auth: "/auth",
  otp: "/otp",
  registration: "/registration",
  registrationSubmitted: "/registration-submitted",
  dashboard: "/dashboard",
  orders: "/orders",
  orderDetails: "/orders/$orderId",
  shop: "/shop",
  services: "/services",
  serviceNew: "/services/new",
  serviceEdit: "/services/$serviceId/edit",
  earnings: "/earnings",
  wallet: "/wallet",
  walletWithdraw: "/wallet/withdraw",
  profile: "/profile",
  settings: "/settings",
  customers: "/customers",
  customerProfile: "/customers/$customerId",
  reviews: "/reviews",
  notifications: "/notifications",
  messages: "/messages",
  chat: "/messages/$threadId",
  announcements: "/announcements",
  analytics: "/analytics",
} as const;

export const partnerTabs = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard, to: partnerRoutes.dashboard },
  { id: "orders", label: "Orders", icon: ListOrdered, to: partnerRoutes.orders },
  { id: "earnings", label: "Earnings", icon: BarChart3, to: partnerRoutes.earnings },
  { id: "wallet", label: "Wallet", icon: Wallet, to: partnerRoutes.wallet },
  { id: "profile", label: "Profile", icon: UserRound, to: partnerRoutes.profile },
] as const;

export const partnerMenuLinks = [
  { id: "customers", label: "Customers", icon: Users, to: partnerRoutes.customers },
  { id: "reviews", label: "Reviews & Ratings", icon: Star, to: partnerRoutes.reviews },
  { id: "shop", label: "Shop Management", icon: Store, to: partnerRoutes.shop },
  { id: "services", label: "Manage Services", icon: Sparkles, to: partnerRoutes.services },
  { id: "settings", label: "Business Settings", icon: Settings2, to: partnerRoutes.settings },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    to: partnerRoutes.notifications,
  },
  { id: "messages", label: "Messages", icon: MessagesSquare, to: partnerRoutes.messages },
  { id: "announcements", label: "Announcements", icon: Megaphone, to: partnerRoutes.announcements },
  { id: "analytics", label: "Analytics & Reports", icon: PieChart, to: partnerRoutes.analytics },
  { id: "registration", label: "Business Profile", icon: Building2, to: partnerRoutes.registration },
] as const;

export type PartnerTabId = (typeof partnerTabs)[number]["id"];
