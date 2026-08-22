import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  BedDouble,
  Blinds,
  CalendarCheck,
  ChevronDown,
  Clock,
  Crown,
  Flame,
  Footprints,
  Gift,
  LayoutGrid,
  Loader2,
  MapPin,
  Percent,
  RefreshCw,
  Search,
  WifiOff,
  Shirt,
  Sparkles,
  Star,
  WashingMachine,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { onNotificationsChanged } from "@/api/customer/notifications-api";

import { FloatingCartBar } from "@/components/cart/FloatingCartBar";
import { BottomNav } from "@/components/home/BottomNav";
import { HomeSkeleton } from "@/components/home/HomeSkeleton";
import { useHomeData } from "@/hooks/useHomeData";
import {
  readRecentSearches,
  SEARCH_SCOPES as SEARCH_SCOPE_OPTIONS,
} from "@/api/customer/services/search-service";

import store1 from "@/shared/assets/store-1.jpg";
import store2 from "@/shared/assets/store-2.jpg";
import store3 from "@/shared/assets/store-3.jpg";

function resolvePartnerImage(img?: string | null): string {
  if (!img) return store1;
  if (img === "store-1" || img.includes("store-1")) return store1;
  if (img === "store-2" || img.includes("store-2")) return store2;
  if (img === "store-3" || img.includes("store-3")) return store3;
  if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("/") || img.startsWith("data:")) return img;
  return store1;
}
import { useAuthGuard } from "@/hooks/useAuthGuard";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "QuickPress Home — Book Laundry Pickup Near You" },
      {
        name: "description",
        content:
          "Book laundry pickup, dry cleaning and express delivery from premium partners near you. Track orders, claim offers and repeat past orders on QuickPress.",
      },
      { property: "og:title", content: "QuickPress Home — Book Laundry Pickup Near You" },
      {
        property: "og:description",
        content:
          "Book laundry pickup, dry cleaning and express delivery from premium partners near you.",
      },
    ],
  }),
  component: HomeScreen,
});

const ICONS: Record<string, LucideIcon> = {
  "washing-machine": WashingMachine,
  shirt: Shirt,
  flame: Flame,
  sparkles: Sparkles,
  footprints: Footprints,
  blinds: Blinds,
  "bed-double": BedDouble,
  "layout-grid": LayoutGrid,
  zap: Zap,
  "calendar-check": CalendarCheck,
};



function HomeScreen() {
  useAuthGuard();
  const navigate = useNavigate();
  const {
    sections,
    initialLoading,
    refreshing,
    online,
    failed,
    refresh,
    retry,
  } = useHomeData();
  const [pull, setPull] = useState(0);
  const pullStart = useRef<number | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecentSearches(readRecentSearches());
  }, []);

  const profile = sections.profile.data;
  const location = sections.location.data;
  const categories = sections.categories.data ?? [];
  const partners = sections.partners.data ?? [];
  const popular = sections.popular.data ?? [];
  const offers = sections.offers.data ?? [];
  const recentOrders = sections.recentOrders.data ?? [];
  
  // Header badge stays live: the notifications screen broadcasts every
  // read/delete so the count updates without a home refetch.
  const [unreadOverride, setUnreadOverride] = useState<number | null>(null);
  useEffect(() => onNotificationsChanged(setUnreadOverride), []);
  const unreadNotifications = unreadOverride ?? sections.notifications.data ?? 0;

  const handleRefresh = useCallback(async () => {
    await refresh();
    setPull(0);
  }, [refresh]);


  const onTouchStart = (event: React.TouchEvent) => {
    if (window.scrollY > 0) return;
    const touch = event.touches[0];
    if (!touch) return;
    pullStart.current = touch.clientY;
  };

  const onTouchMove = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (pullStart.current === null || !touch) return;
    const delta = touch.clientY - pullStart.current;
    if (delta > 0) setPull(Math.min(delta * 0.4, 80));
  };

  const onTouchEnd = () => {
    if (pull > 55) void handleRefresh();
    else setPull(0);
    pullStart.current = null;
  };

  return (
    <main
      className="relative min-h-screen overflow-x-hidden bg-background"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center transition-all duration-300"
        style={{ height: pull || (refreshing ? 56 : 0), opacity: pull || refreshing ? 1 : 0 }}
      >
        <span className="mt-3 flex size-9 items-center justify-center rounded-full bg-card text-brand-green shadow-soft">
          {refreshing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" style={{ transform: `rotate(${pull * 4}deg)` }} />
          )}
        </span>
      </div>

      <div
        className="relative mx-auto w-full max-w-md transition-transform duration-300"
        style={{ transform: `translateY(${pull}px)` }}
      >
        {initialLoading ? (
          <>
            <HomeSkeleton />
          </>
        ) : failed ? (
          <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <RefreshCw className="size-5" />
            </span>
            <p className="text-sm font-bold text-foreground">
              {online ? "We couldn't load your home screen" : "You're offline"}
            </p>
            <p className="text-xs text-muted-foreground">
              {online
                ? "Something went wrong on our side. Please try again."
                : "Check your internet connection and try again."}
            </p>
            <button
              type="button"
              onClick={() => void retry()}
              className="flex h-11 items-center justify-center rounded-3xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97]"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="px-5 pb-32 pt-8">
            {!online ? (
              <div className="mb-4 flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                <WifiOff className="size-3.5" />
                You're offline — showing your last saved home screen.
              </div>
            ) : null}

            {/* Header — GET /api/profile, GET /api/location */}
            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/location-search" })}
                  className="flex max-w-full items-center gap-2 rounded-full bg-transparent py-1.5 pl-2 pr-3 text-left transition-all duration-300 active:scale-[0.97] active:opacity-80"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-green/15 text-brand-green">
                    <MapPin className="size-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Current Location
                    </span>
                    <span className="block truncate text-xs font-bold text-foreground">
                      {location
                        ? `${location.area}${location.city ? `, ${location.city}` : ""}`
                        : "Select your location"}
                    </span>
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  aria-label="Notifications"
                  onClick={() => navigate({ to: "/notifications" })}
                  className="relative flex size-10 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94]"
                >
                  <Bell className="size-5" />
                  {unreadNotifications > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-secondary-foreground">
                      {unreadNotifications}
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  aria-label="Profile"
                  onClick={() => navigate({ to: "/profile" })}
                  className="flex size-10 items-center justify-center overflow-hidden rounded-2xl bg-primary/20 text-sm font-bold text-brand-dark transition-all duration-300 active:scale-[0.94]"
                >
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      width={80}
                      height={80}
                      className="size-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    (profile?.initials ?? "QP")
                  )}
                </button>
              </div>
            </header>

            {/* Search */}
            <section className="mt-6">
              <button
                type="button"
                onClick={() => void navigate({ to: "/search", search: { q: "", scope: "all" } })}
                className="card-soft flex w-full items-center gap-3 border border-border p-1.5 text-left transition-all duration-300 hover:border-primary/60 active:scale-[0.99]"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Search className="size-4" />
                </span>
                <span className="truncate pr-3 text-sm text-muted-foreground/80">
                  What would you like to clean today?
                </span>
              </button>

              <div className="stagger-children no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                {SEARCH_SCOPE_OPTIONS.map((scope) => (
                  <button
                    key={scope.id}
                    type="button"
                    onClick={() =>
                      void navigate({ to: "/search", search: { q: "", scope: scope.id } })
                    }
                    className="shrink-0 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.95]"
                  >
                    {scope.label}
                  </button>
                ))}
              </div>

              <div
                className="no-scrollbar mt-2 flex items-center gap-2 overflow-x-auto"
                hidden={recentSearches.length === 0}
              >
                <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <Clock className="size-3" /> Recent
                </span>
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() =>
                      void navigate({ to: "/search", search: { q: term, scope: "all" } })
                    }
                    className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>





            {/* Categories — GET /api/categories */}
            <section id="services" className="mt-8 scroll-mt-24">
              <SectionHeading title="Services" action="View all" />
              <SectionStatus
                error={sections.categories.error}
                empty={!sections.categories.loading && (sections.categories.data?.length ?? 0) === 0}
                emptyLabel="No services available in your area yet."
                onRetry={() => void retry()}
              />
              <div className="stagger-children mt-4 grid grid-cols-3 gap-3">
                {categories.map((category, index) => {
                  const Icon = ICONS[category.icon] ?? Sparkles;
                  return (
                    <button
                      key={`${category.id}-${index}`}
                      type="button"
                      onClick={() =>
                        navigate({ to: "/services/$serviceId", params: { serviceId: category.id } })
                      }
                      className="group card-soft flex flex-col items-center gap-2 border border-border/80 bg-card p-3 text-center transition-all duration-300 hover:border-primary hover:shadow-soft active:scale-[0.94]"
                    >
                      <div className="relative flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-border/40 bg-muted/40 shadow-sm transition-transform duration-300 group-hover:scale-105">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.title}
                            loading="lazy"
                            width={512}
                            height={512}
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                            decoding="async"
                          />
                        ) : (
                          <Icon className="size-7 text-brand-green" />
                        )}
                      </div>
                      <span className="text-[12px] font-black leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors">
                        {category.title}
                      </span>
                      <span className="text-[10px] font-medium leading-tight text-muted-foreground">
                        {category.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Popular services — GET /api/services (popular) */}
            <section className="mt-8">
              <SectionHeading title="Popular services" action="View all" />
              <SectionStatus
                error={sections.popular.error}
                empty={!sections.popular.loading && (sections.popular.data?.length ?? 0) === 0}
                emptyLabel="No services available right now."
                onRetry={() => void retry()}
              />
              <div className="stagger-children no-scrollbar -mx-5 mt-4 flex gap-3 overflow-x-auto px-5 pb-1">
                {popular.map((service, index) => {
                  const Icon = ICONS[service.icon] ?? Sparkles;
                  return (
                    <button
                      key={`${service.id}-${index}`}
                      type="button"
                      onClick={() =>
                        navigate({
                          to: "/services/$serviceId",
                          params: { serviceId: service.categoryId ?? service.id },
                        })
                      }
                      className="group card-soft w-64 shrink-0 border border-border/80 bg-card p-4 text-left transition-all duration-300 hover:border-primary hover:shadow-soft active:scale-[0.97]"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/40 bg-muted/40 shadow-sm transition-transform duration-300 group-hover:scale-105">
                          {service.image ? (
                            <img
                              src={service.image}
                              alt={service.title}
                              width={256}
                              height={256}
                              loading="lazy"
                              decoding="async"
                              className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <Icon className="size-6 text-brand-green" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-foreground group-hover:text-primary transition-colors">
                            {service.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                            {service.description ?? service.unit}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          ₹{service.finalPrice ?? service.basePrice ?? service.price}
                        </span>
                        {service.discountLabel ? (
                          <>
                            <span className="text-[11px] text-muted-foreground line-through">
                              ₹{service.basePrice ?? service.price}
                            </span>
                            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-brand-dark">
                              {service.discountLabel}
                            </span>
                          </>
                        ) : null}
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" /> {service.processingTime ?? "24 hrs"}
                        </span>
                        <span className="size-1 rounded-full bg-border" />
                        <span>{service.partnerCount ?? 0} partners</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Nearby partners — GET /api/partners/nearby */}
            <section className="mt-8">
              <SectionHeading title="Laundry partners near you" action="See all" />
              <SectionStatus
                error={sections.partners.error}
                empty={!sections.partners.loading && (sections.partners.data?.length ?? 0) === 0}
                emptyLabel="No laundry partners near this location yet."
                onRetry={() => void retry()}
              />
              <div className="stagger-children mt-4 space-y-4">
                {partners.map((partner, index) => (
                  <button
                    key={`${partner.id}-${index}`}
                    type="button"
                    onClick={() =>
                      navigate({ to: "/partner/$partnerId", params: { partnerId: partner.id } })
                    }
                    className="card-soft w-full overflow-hidden border border-border text-left transition-all duration-300 hover:border-primary/60 active:scale-[0.985]"
                  >
                    <div className="relative">
                      <img
                        src={resolvePartnerImage(partner.logo ?? partner.image)}
                        alt={`${partner.name} storefront`}
                        width={800}
                        height={600}
                        loading="lazy"
                        className="h-36 w-full object-cover"
                        decoding="async"
                      />
                      <span
                        className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          partner.open
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-brand-dark text-secondary-foreground"
                        }`}
                      >
                        {partner.open ? "Open now" : "Closed"}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-foreground">{partner.name}</p>
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-1 text-[11px] font-bold text-brand-dark">
                          <Star className="size-3 fill-current" />
                          {partner.rating}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {partner.reviews} reviews · {partner.distanceKm} km away
                      </p>
                      {partner.services && partner.services.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {partner.services.slice(0, 3).map((service, sIdx) => (
                            <span
                              key={`${partner.id}-${service}-${sIdx}`}
                              className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" /> {partner.pickupTime ?? partner.eta}
                        </span>
                        <span className="size-1 rounded-full bg-border" />
                        <span className="font-semibold text-foreground">
                          From ₹{partner.minPrice}
                        </span>
                        <ArrowRight className="ml-auto size-4" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Membership */}
            <section className="mt-8">
              <div className="overflow-hidden rounded-3xl bg-brand-dark p-5 shadow-soft">
                <div className="flex items-center gap-2">
                  <Crown className="size-4 text-primary" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                    QuickPress Premium
                  </p>
                </div>
                <p className="mt-3 text-lg font-bold text-secondary-foreground">
                  Unlimited pickups, priority everything
                </p>
                <ul className="mt-3 space-y-1.5 text-xs text-secondary-foreground/70">
                  <li>• Unlimited free pickup & delivery</li>
                  <li>• Priority support, always first in queue</li>
                  <li>• Exclusive member-only discounts</li>
                </ul>
                <button
                  type="button"
                  className="mt-5 flex h-12 w-full items-center justify-center rounded-3xl bg-primary text-sm font-bold text-primary-foreground shadow-cta transition-all duration-300 hover:brightness-[1.03] active:scale-[0.985]"
                >
                  Join Membership
                </button>
              </div>
            </section>

            {/* Offers — GET /api/offers */}
            <section className="mt-8">
              <SectionHeading title="Offers for you" action="All coupons" />
              <SectionStatus
                error={sections.offers.error}
                empty={!sections.offers.loading && (sections.offers.data?.length ?? 0) === 0}
                emptyLabel="No offers running right now."
                onRetry={() => void retry()}
              />
              <div className="stagger-children no-scrollbar -mx-5 mt-4 flex gap-3 overflow-x-auto px-5 pb-1">
                {offers.map((offer, index) => {
                  const Icon =
                    offer.kind === "cashback" ? Wallet : offer.kind === "festival" ? Percent : Gift;
                  return (
                    <button
                      key={`${offer.id}-${index}`}
                      type="button"
                      className="card-soft w-64 shrink-0 border border-dashed border-primary/50 p-4 text-left transition-all duration-300 active:scale-[0.97]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground">{offer.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {offer.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-dashed border-border pt-3">
                        <span className="rounded-lg bg-muted px-2 py-1 text-[11px] font-bold tracking-wider text-foreground">
                          {offer.code}
                        </span>
                        <span className="text-xs font-semibold text-brand-green">Apply</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Recent orders — GET /api/orders/recent */}
            <section className="mt-8">
              <SectionHeading title="Recent orders" action="View all" />
              <SectionStatus
                error={sections.recentOrders.error}
                empty={!sections.recentOrders.loading && (sections.recentOrders.data?.length ?? 0) === 0}
                emptyLabel="You have no orders yet."
                onRetry={() => void retry()}
              />
              <div className="stagger-children mt-4 space-y-3">
                {recentOrders.map((order, index) => (
                  <div key={`${order.id}-${index}`} className="card-soft border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-foreground">{order.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {order.reference} · {order.items}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{order.placed}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          order.status === "Delivered"
                            ? "bg-secondary/12 text-brand-green"
                            : "bg-primary/20 text-brand-dark"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="mr-auto text-sm font-bold text-foreground">
                        ₹{order.total}
                      </span>
                      <button
                        type="button"
                        className="rounded-2xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.95]"
                      >
                        Repeat order
                      </button>
                      <button
                        type="button"
                        className="rounded-2xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-cta transition-all duration-300 hover:brightness-[1.03] active:scale-[0.95]"
                      >
                        Track order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Brand watermark footer */}
            <section className="mt-12 -mx-4 select-none bg-muted/60 px-5 pb-10 pt-12">
              <h2 className="text-[2.6rem] font-black leading-[0.95] tracking-tight text-muted-foreground/35">
                India&rsquo;s freshest
                <br />
                laundry app <span className="text-primary/35">🧺</span>
              </h2>
              <div className="mt-8 h-px w-full bg-border/70" />
              <p className="mt-6 text-3xl font-black tracking-tight text-muted-foreground/25">
                QuickPress
              </p>
              <p className="mt-6 text-[11px] font-medium tracking-wide text-muted-foreground/70">
                Made In India · Crafted by Utter Pradesh 🚩
              </p>
            </section>

          </div>
        )}
      </div>

      <FloatingCartBar />
      <BottomNav active="home" />
    </main>
  );
}

/**
 * Inline status line for a single Home section: renders the section's error
 * with a retry affordance, or an empty-state message. Never blanks the screen.
 */
function SectionStatus({
  error,
  empty,
  emptyLabel,
  onRetry,
}: {
  error?: string | null;
  empty?: boolean;
  emptyLabel?: string;
  onRetry?: () => void;
}) {
  if (error) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-muted px-3 py-2.5 text-[11px] text-muted-foreground">
        <span className="truncate">{error}</span>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="ml-auto shrink-0 font-bold text-brand-green active:opacity-70"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  }
  if (empty) {
    return (
      <p className="mt-3 rounded-2xl bg-muted px-3 py-2.5 text-[11px] text-muted-foreground">
        {emptyLabel ?? "Nothing here yet."}
      </p>
    );
  }
  return null;
}

function SectionHeading({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
      {action ? (
        <button
          type="button"
          className="text-xs font-semibold text-brand-green transition-opacity hover:underline active:opacity-70"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}

