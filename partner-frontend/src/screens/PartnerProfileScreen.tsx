import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bell,
  Bike,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  CreditCard,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Headphones,
  History,
  Hourglass,
  Info,
  Layers,
  Lock,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  MessageSquareQuote,
  Percent,
  Phone,
  PhoneCall,
  QrCode,
  Receipt,
  RotateCcw,
  Search,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Sparkles,
  Star,
  Store,
  Timer,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Utensils,
  Volume2,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";
import { PartnerLayout } from "../components/layout/PartnerLayout";
import { usePartnerContext } from "../context/PartnerContext";
import { usePartnerResource } from "../hooks/use-partner-resource";
import { partnerRoutes } from "../navigation/partner-routes";
import { fetchPartnerProfile, toggleStoreStatus } from "@/api/partner/partner-profile-api";

function normalizeDisplayPhone(p?: string): string {
  if (!p) return "";
  const cleaned = p.replace(/\+91/g, "").replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return p;
}

export function PartnerProfileScreen() {
  const navigate = useNavigate();
  const { signOut } = usePartnerContext();
  const { data: profile } = usePartnerResource(fetchPartnerProfile);

  const [rushHour, setRushHour] = useState(false);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoAccept, setAutoAccept] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const storeName = profile?.businessName || profile?.name || profile?.ownerName || "QuickPress Partner Store";
  const city = profile?.city || "Kasganj";
  const partnerId = profile?.partnerId || (profile as any)?.id || "PRT-390624";
  const phone = normalizeDisplayPhone(profile?.phone || profile?.ownerPhone) || "+91 92587 30561";

  return (
    <PartnerLayout
      activeTab="profile"
      title="Store Management & Settings"
      subtitle={`${storeName} · ID: ${partnerId}`}
    >
      {/* ========================================================================= */}
      {/* MOBILE DETAILED ZOMATO "EXPLORE MORE" VIEW (< md)                          */}
      {/* ========================================================================= */}
      <div className="min-h-screen bg-[#F4F5F7] pb-32 text-zinc-900 md:hidden">
        {/* Sticky Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-white px-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: partnerRoutes.dashboard })}
              className="text-zinc-800 p-1 active:scale-95"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-base font-black tracking-tight text-zinc-900">Explore More & Settings</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={partnerRoutes.notifications}
              className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 active:scale-95"
            >
              <Bell className="size-4" />
            </Link>
          </div>
        </header>

        <div className="space-y-4 p-4">
          {/* 1. Rich Partner Profile Hero Card */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-zinc-950 font-black text-xl shadow-xs">
                  {storeName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="truncate text-base font-black text-zinc-900">{storeName}</h2>
                    <BadgeCheck className="size-4 text-blue-500 fill-current shrink-0" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-500">{phone}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-700">
                      ID: {partnerId}
                    </span>
                    <span className="flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black text-emerald-700">
                      <Star className="size-2.5 fill-current text-amber-500" />
                      {profile?.rating || "4.9"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate({ to: partnerRoutes.shop })}
                className="rounded-full bg-zinc-100 p-2 text-zinc-700 active:scale-95"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Quick 3-Pillar Stats */}
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3 text-center">
              <div className="rounded-2xl bg-zinc-50 p-2.5">
                <p className="text-[10px] font-bold uppercase text-zinc-400">Total Orders</p>
                <p className="text-sm font-black text-zinc-900">{profile?.totalOrders || "4"}</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-2.5">
                <p className="text-[10px] font-bold uppercase text-zinc-400">City Outlet</p>
                <p className="text-sm font-black text-zinc-900 truncate">{city}</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-2.5">
                <p className="text-[10px] font-bold uppercase text-zinc-400">KYC Status</p>
                <p className="text-xs font-black text-emerald-600">VERIFIED ✓</p>
              </div>
            </div>
          </div>

          {/* Primary Feature: Services & Catalog Management */}
          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-white to-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900">Services & Rate Card</h3>
                  <p className="text-[11px] font-medium text-zinc-500">
                    Manage service pricing, turn on/off items & offers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: partnerRoutes.services })}
                className="flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-xs active:scale-95 transition-all"
              >
                <span>Manage</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* 2. Quick Operations Action Toggles */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">
              Live Operations Switches
            </h3>

            {/* Rush Hour Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <Hourglass className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-zinc-900">Rush Hour Mode</p>
                  <p className="text-[10px] font-medium text-zinc-400">Adds +30 mins buffer on bookings</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = !rushHour;
                  setRushHour(next);
                  toast.success(next ? "Rush hour mode enabled" : "Rush hour mode disabled");
                }}
                className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
                  rushHour ? "bg-amber-500" : "bg-zinc-200"
                }`}
              >
                <div
                  className={`size-5 rounded-full bg-white shadow-md transition-transform ${
                    rushHour ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Sound Chimes */}
            <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                  <Volume2 className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-zinc-900">Audio Order Chime</p>
                  <p className="text-[10px] font-medium text-zinc-400">Plays bell sound when orders arrive</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = !soundAlerts;
                  setSoundAlerts(next);
                  toast.success(next ? "Order chime enabled" : "Order chime silenced");
                }}
                className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
                  soundAlerts ? "bg-emerald-500" : "bg-zinc-200"
                }`}
              >
                <div
                  className={`size-5 rounded-full bg-white shadow-md transition-transform ${
                    soundAlerts ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 3. Section: Outlet & Store Settings */}
          <div>
            <h3 className="px-1 text-xs font-black uppercase tracking-wider text-zinc-600">
              Outlet & Operations
            </h3>
            <div className="mt-2 grid grid-cols-4 gap-2.5">
              {[
                { label: "Outlet Info", icon: Store, to: partnerRoutes.shop },
                { label: "Timings & Slots", icon: Clock, to: partnerRoutes.settings },
                { label: "Pickup Radius", icon: MapPin, to: partnerRoutes.settings },
                { label: "Staff Access", icon: Users, to: partnerRoutes.customers },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate({ to: item.to })}
                  className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200/80 bg-white p-3 text-center shadow-xs transition-transform active:scale-95"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-50 text-zinc-800">
                    <item.icon className="size-5" />
                  </div>
                  <p className="mt-1.5 text-[10px] font-black leading-tight text-zinc-800">
                    {item.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Section: Finance, Payouts & Wallet */}
          <div>
            <h3 className="px-1 text-xs font-black uppercase tracking-wider text-zinc-600">
              Finance & Settlements
            </h3>
            <div className="mt-2 grid grid-cols-4 gap-2.5">
              {[
                { label: "Weekly Payouts", icon: Coins, to: partnerRoutes.earnings },
                { label: "Store Wallet", icon: Wallet, to: partnerRoutes.wallet },
                { label: "Bank Account", icon: CreditCard, to: partnerRoutes.wallet },
                { label: "GST & Tax Reports", icon: Receipt, to: partnerRoutes.earnings },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate({ to: item.to })}
                  className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200/80 bg-white p-3 text-center shadow-xs transition-transform active:scale-95"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
                    <item.icon className="size-5" />
                  </div>
                  <p className="mt-1.5 text-[10px] font-black leading-tight text-zinc-800">
                    {item.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Section: Catalog, Reviews & Analytics */}
          <div>
            <h3 className="px-1 text-xs font-black uppercase tracking-wider text-zinc-600">
              Catalog & Growth
            </h3>
            <div className="mt-2 grid grid-cols-4 gap-2.5">
              {[
                { label: "Rate Card", icon: Utensils, to: partnerRoutes.services },
                { label: "Growth Analytics", icon: BarChart3, to: partnerRoutes.analytics },
                { label: "Customer Reviews", icon: MessageSquare, to: partnerRoutes.customers },
                { label: "Special Offers", icon: Percent, to: partnerRoutes.services },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate({ to: item.to })}
                  className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200/80 bg-white p-3 text-center shadow-xs transition-transform active:scale-95"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                    <item.icon className="size-5" />
                  </div>
                  <p className="mt-1.5 text-[10px] font-black leading-tight text-zinc-800">
                    {item.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 6. Section: Store Branding & Standee QR */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                  <QrCode className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-zinc-900">Store Counter QR Standee</p>
                  <p className="text-[10px] font-medium text-zinc-400">Printable QR standee for walk-in customers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toast.success("Store QR Standee downloaded in PDF format")}
                className="flex items-center gap-1 rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-black text-white active:scale-95"
              >
                <Download className="size-3.5" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* 7. Support Helpline Card */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Headphones className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-zinc-900">Partner Help & Support</p>
                  <p className="text-[10px] font-medium text-zinc-400">Available 24/7 for laundry partners</p>
                </div>
              </div>
              <a
                href="tel:18002008899"
                className="flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800 active:scale-95"
              >
                <PhoneCall className="size-3.5" />
                <span>Call</span>
              </a>
            </div>
          </div>

          {/* 8. Log Out Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50/80 py-3.5 text-xs font-black text-red-600 shadow-xs transition-colors active:scale-95"
            >
              <LogOut className="size-4" />
              <span>Log out from QuickPress Partner</span>
            </button>
          </div>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              onClick={() => setShowLogoutModal(false)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs"
            />
            <div className="relative w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-5 text-center shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <LogOut className="size-6" />
              </div>
              <h3 className="mt-3 text-base font-black text-zinc-900">Log out from Partner App?</h3>
              <p className="mt-1 text-xs text-zinc-500">
                You will stop receiving live order sound alerts until you sign back in.
              </p>

              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 rounded-2xl border border-zinc-200 py-2.5 text-xs font-bold text-zinc-700 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutModal(false);
                    signOut();
                    void navigate({ to: partnerRoutes.auth });
                  }}
                  className="flex-1 rounded-2xl bg-red-600 py-2.5 text-xs font-black text-white shadow-sm active:scale-95"
                >
                  Confirm Log Out
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP PROFILE VIEW (>= md)                                              */}
      {/* ========================================================================= */}
      <div className="hidden mx-auto w-full max-w-5xl px-4 py-4 md:block md:px-8 md:py-6">
        <div className="space-y-6">
          <section className="flex items-center gap-4 rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-primary/20 text-brand-dark font-black text-2xl">
              {storeName.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-xl font-black text-foreground">{storeName}</p>
                <BadgeCheck className="size-5 text-blue-500 fill-current" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground">
                {profile?.ownerName || "Partner Admin"} · Store ID: {partnerId} · {phone}
              </p>
            </div>
          </section>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
              <p className="text-xs font-bold text-muted-foreground">Partner Rating</p>
              <p className="text-2xl font-black text-foreground">★ {profile?.rating || "4.9"}</p>
            </div>
            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
              <p className="text-xs font-bold text-muted-foreground">Completed Orders</p>
              <p className="text-2xl font-black text-foreground">{profile?.totalOrders || 4}</p>
            </div>
            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
              <p className="text-xs font-bold text-muted-foreground">Location</p>
              <p className="text-2xl font-black text-foreground">{city}</p>
            </div>
          </div>
        </div>
      </div>

      <Toaster />
    </PartnerLayout>
  );
}
