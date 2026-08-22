import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bell,
  Bike,
  Clock,
  Coins,
  FileText,
  Headphones,
  History,
  Hourglass,
  Info,
  LogOut,
  MapPin,
  MessageSquare,
  Phone,
  QrCode,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Timer,
  User,
  Users,
  Utensils,
  Volume2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";
import { PartnerLayout } from "../components/layout/PartnerLayout";
import { usePartnerContext } from "../context/PartnerContext";
import { usePartnerResource } from "../hooks/use-partner-resource";
import { partnerRoutes } from "../navigation/partner-routes";
import { fetchPartnerProfile } from "@/api/partner/partner-profile-api";

export function PartnerProfileScreen() {
  const navigate = useNavigate();
  const { signOut } = usePartnerContext();
  const { data: profile } = usePartnerResource(fetchPartnerProfile);
  const [rushHour, setRushHour] = useState(false);

  return (
    <PartnerLayout activeTab="profile" title="Explore More" subtitle="Store management & settings">
      {/* Mobile Zomato "Explore More" View (< md) */}
      <div className="min-h-screen bg-[#F4F5F7] pb-28 text-zinc-900 md:hidden">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-white px-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: partnerRoutes.dashboard })}
              className="text-zinc-800"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-base font-black tracking-tight text-zinc-900">Explore more</h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button type="button" className="text-zinc-700">
              <Search className="size-5" />
            </button>
            <div className="flex size-7 items-center justify-center rounded-full bg-zinc-200 text-zinc-600">
              <User className="size-4" />
            </div>
          </div>
        </header>

        <div className="space-y-4 p-4">
          {/* Store Card Link */}
          <div
            onClick={() => navigate({ to: partnerRoutes.shop })}
            className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold">
                <Store className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-zinc-900">
                  {profile?.businessName || "Grand Leaf Cafe & Restaurant"}
                </p>
                <p className="text-[11px] font-medium text-zinc-500">
                  {profile?.city ? `${profile.city} Locality` : "Kasganj Locality"}
                </p>
              </div>
            </div>
            <span className="text-zinc-400">›</span>
          </div>

          {/* Section 1: Manage Outlet */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-700">
              Manage outlet
            </h2>
            <div className="mt-2.5 grid grid-cols-4 gap-2.5">
              {[
                { label: "Outlet info", icon: Info, to: partnerRoutes.shop },
                { label: "Outlet timings", icon: Clock, to: partnerRoutes.settings },
                { label: "Phone numbers", icon: Phone, to: partnerRoutes.profile },
                { label: "Manage staff", icon: Users, to: partnerRoutes.customers },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate({ to: item.to })}
                  className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200/70 bg-white p-3 text-center shadow-xs transition-all active:scale-95"
                >
                  <div className="flex size-9 items-center justify-center rounded-xl text-zinc-800">
                    <item.icon className="size-5" strokeWidth={1.8} />
                  </div>
                  <p className="mt-1.5 text-[10px] font-extrabold leading-tight text-zinc-800 line-clamp-2">
                    {item.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Settings */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-700">Settings</h2>
            <div className="mt-2.5 grid grid-cols-4 gap-2.5">
              {[
                { label: "Settings", icon: Settings, to: partnerRoutes.settings },
                { label: "Manage communication", icon: Bell, to: partnerRoutes.notifications },
                { label: "Delivery settings", icon: Store, to: partnerRoutes.settings },
                {
                  label: "Rush hour",
                  icon: Hourglass,
                  badge: rushHour ? "ON" : "OFF",
                  onClick: () => {
                    setRushHour(!rushHour);
                    toast.success(rushHour ? "Rush hour turned OFF" : "Rush hour turned ON");
                  },
                },
                { label: "Schedule off", icon: Clock, to: partnerRoutes.settings },
                { label: "Rate Card", icon: Utensils, to: partnerRoutes.services },
                { label: "Payouts Ledger", icon: Coins, to: partnerRoutes.earnings },
                { label: "KYC Documents", icon: Shield, to: partnerRoutes.shop },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    else if (item.to) navigate({ to: item.to });
                  }}
                  className="relative flex flex-col items-center justify-center rounded-2xl border border-zinc-200/70 bg-white p-3 text-center shadow-xs transition-all active:scale-95"
                >
                  <div className="flex size-9 items-center justify-center rounded-xl text-zinc-800">
                    <item.icon className="size-5" strokeWidth={1.8} />
                  </div>
                  <p className="mt-1.5 text-[10px] font-extrabold leading-tight text-zinc-800 line-clamp-2">
                    {item.label}
                  </p>
                  {item.badge ? (
                    <span
                      className={`mt-0.5 rounded px-1 text-[8px] font-black ${
                        item.badge === "ON"
                          ? "bg-emerald-500 text-white"
                          : "bg-red-500/15 text-red-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Orders */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-700">Orders</h2>
            <div className="mt-2.5 grid grid-cols-4 gap-2.5">
              {[
                { label: "Order history", icon: FileText, to: partnerRoutes.orders },
                { label: "Complaints", icon: Star, to: partnerRoutes.help },
                { label: "Reviews", icon: MessageSquare, to: partnerRoutes.customers },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate({ to: item.to })}
                  className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200/70 bg-white p-3 text-center shadow-xs transition-all active:scale-95"
                >
                  <div className="flex size-9 items-center justify-center rounded-xl text-zinc-800">
                    <item.icon className="size-5" strokeWidth={1.8} />
                  </div>
                  <p className="mt-1.5 text-[10px] font-extrabold leading-tight text-zinc-800 line-clamp-2">
                    {item.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                signOut();
                void navigate({ to: partnerRoutes.auth });
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3 text-xs font-black text-red-700 transition-colors active:scale-95"
            >
              <LogOut className="size-4" />
              <span>Log out from Partner App</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Profile View (>= md) */}
      <div className="hidden mx-auto w-full max-w-5xl px-4 py-4 md:block md:px-8 md:py-6">
        <div className="space-y-6">
          <section className="flex items-center gap-4 rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-primary/20 text-brand-dark font-black text-2xl">
              {profile?.businessName?.slice(0, 2).toUpperCase() || "QP"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-black text-foreground">
                {profile?.businessName || "QuickPress Partner"}
              </p>
              <p className="text-xs font-semibold text-muted-foreground">
                {profile?.ownerName} · Store ID: {profile?.partnerId}
              </p>
            </div>
          </section>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
              <p className="text-xs font-bold text-muted-foreground">Rating</p>
              <p className="text-2xl font-black text-foreground">★ {profile?.rating || "4.9"}</p>
            </div>
            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
              <p className="text-xs font-bold text-muted-foreground">Completed Orders</p>
              <p className="text-2xl font-black text-foreground">{profile?.totalOrders || 0}</p>
            </div>
            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
              <p className="text-xs font-bold text-muted-foreground">City</p>
              <p className="text-2xl font-black text-foreground">{profile?.city || "Bengaluru"}</p>
            </div>
          </div>
        </div>
      </div>

      <Toaster />
    </PartnerLayout>
  );
}
