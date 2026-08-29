import {
  Award,
  BarChart3,
  Bell,
  ClipboardList,
  History,
  LayoutDashboard,
  Navigation,
  MessageSquare,
  Megaphone,
  Settings2,
  Sparkles,
  Trophy,
  TrendingUp,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";

/**
 * Central route map for the Rider app. Route files under
 * `rider-frontend/src/routes/*.tsx` are thin wrappers around these screens so the
 * customer and partner frontends stay untouched.
 */
export const riderRoutes = {
  auth: "/auth",
  otp: "/otp",
  registration: "/registration",
  registrationSubmitted: "/registration-submitted",
  suspended: "/suspended",
  dashboard: "/dashboard",
  orders: "/orders",
  orderDetails: "/orders/$orderId",
  deliveries: "/deliveries",
  deliveryDetails: "/deliveries/$deliveryId",
  liveNavigation: "/live-navigation/$deliveryId",
  navigate: "/navigate/$orderId",
  wallet: "/wallet",
  walletEarnings: "/wallet/earnings",
  walletTransactions: "/wallet/transactions",
  walletIncentives: "/wallet/incentives",
  walletBank: "/wallet/bank",
  walletWithdraw: "/wallet/withdraw",
  notifications: "/notifications",
  notificationSettings: "/notifications/settings",
  announcements: "/notifications/announcements",
  messages: "/messages",
  chat: "/messages/$threadId",
  history: "/history",
  historyDetails: "/history/$deliveryId",
  performance: "/performance",
  analytics: "/analytics",
  achievements: "/analytics/achievements",
  leaderboard: "/analytics/leaderboard",
  insights: "/analytics/insights",
  profile: "/profile",
  settings: "/settings",
  // Settings & Account module (Sprint 4.9)
  settingsAccount: "/settings/account",
  settingsAccountEdit: "/settings/account/edit",
  settingsDocuments: "/settings/documents",
  settingsWork: "/settings/work",
  settingsNotifications: "/settings/notifications",
  settingsTheme: "/settings/theme",
  settingsSecurity: "/settings/security",
  settingsLegal: "/settings/legal",
  settingsAbout: "/settings/about",
} as const;

export const riderTabs = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard, to: riderRoutes.dashboard },
  { id: "orders", label: "Orders", icon: ClipboardList, to: riderRoutes.orders },
  { id: "wallet", label: "Wallet", icon: Wallet, to: riderRoutes.wallet },
  { id: "profile", label: "Profile", icon: UserRound, to: riderRoutes.profile },
] as const;

export const riderMenuLinks = [
  { id: "deliveries", label: "Delivery Management", icon: Truck, to: riderRoutes.deliveries },
  { id: "history", label: "Delivery History", icon: History, to: riderRoutes.history },
  { id: "performance", label: "Performance", icon: TrendingUp, to: riderRoutes.performance },
  { id: "analytics", label: "Analytics", icon: BarChart3, to: riderRoutes.analytics },
  { id: "achievements", label: "Achievements", icon: Award, to: riderRoutes.achievements },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy, to: riderRoutes.leaderboard },
  { id: "insights", label: "Performance Insights", icon: Sparkles, to: riderRoutes.insights },
  { id: "notifications", label: "Notifications", icon: Bell, to: riderRoutes.notifications },
  { id: "messages", label: "Messages", icon: MessageSquare, to: riderRoutes.messages },
  { id: "announcements", label: "Announcements", icon: Megaphone, to: riderRoutes.announcements },
  { id: "settings", label: "Settings", icon: Settings2, to: riderRoutes.settings },
  { id: "registration", label: "Onboarding Details", icon: Navigation, to: riderRoutes.registration },
] as const;

export type RiderTabId = (typeof riderTabs)[number]["id"];
