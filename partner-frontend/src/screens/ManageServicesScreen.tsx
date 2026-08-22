import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock,
  Edit2,
  Layers,
  Menu,
  Percent,
  Plus,
  QrCode,
  Search,
  Sparkles,
  Tag,
  ToggleLeft,
  ToggleRight,
  UtensilsCrossed,
  WifiOff,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerLayout } from "../components/layout/PartnerLayout";
import { PullToRefresh } from "../components/dashboard/PullToRefresh";
import { SectionHeading } from "../components/PartnerPrimitives";
import { ServiceCard } from "../components/services/ServiceCard";
import { ServiceDetailsSheet } from "../components/services/ServiceDetailsSheet";
import { ServiceEmptyState } from "../components/services/ServiceEmptyState";
import { ServiceGridSkeleton } from "../components/services/ServiceSkeletons";
import { ServiceSuccessOverlay } from "../components/services/ServiceSuccessOverlay";
import { ServiceToolbar } from "../components/services/ServiceToolbar";
import { OfferSheet } from "../components/services/OfferSheet";
import {
  matchesServiceFilter,
  matchesServiceQuery,
  sortServices,
  usePartnerServices,
  type ServiceFilterId,
  type ServiceSortId,
} from "../context/PartnerServicesContext";
import { partnerRoutes } from "../navigation/partner-routes";
import { fetchPartnerProfile, toggleStoreStatus } from "@/api/partner/partner-profile-api";
import { usePartnerResource } from "../hooks/use-partner-resource";

export function ManageServicesScreen() {
  const navigate = useNavigate();
  const { data: profile } = usePartnerResource(fetchPartnerProfile);
  const {
    services,
    offers,
    isLoading,
    isOffline,
    activeCount,
    refresh,
    toggleOffline,
    toggleService,
    offersFor,
    addOffer,
  } = usePartnerServices();

  const [categoryFilter, setCategoryFilter] = useState<"all" | "active" | "paused" | "offers">("all");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ServiceFilterId[]>([]);
  const [sort, setSort] = useState<ServiceSortId>("popularity");
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [offerSheetOpen, setOfferSheetOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [isStoreOnline, setIsStoreOnline] = useState(true);

  const handleToggleStore = async () => {
    try {
      const next = !isStoreOnline;
      setIsStoreOnline(next);
      await toggleStoreStatus(next);
      toast.success(next ? "Store is now Online" : "Store is now Closed");
    } catch {
      setIsStoreOnline(!isStoreOnline);
      toast.error("Failed to update store status");
    }
  };

  const visible = useMemo(() => {
    let list = services;
    if (categoryFilter === "active") list = list.filter((s) => s.enabled);
    else if (categoryFilter === "paused") list = list.filter((s) => !s.enabled);
    else if (categoryFilter === "offers") list = list.filter((s) => offersFor(s.id).length > 0);

    const filtered = list.filter(
      (service) =>
        matchesServiceQuery(service, query) &&
        filters.every((filter) => matchesServiceFilter(service, filter)),
    );
    return sortServices(filtered, sort);
  }, [services, categoryFilter, query, filters, sort, offersFor]);

  const detailsService = services.find((service) => service.id === detailsId) ?? null;
  const isSearching = query.trim().length > 0 || filters.length > 0;

  const resetSearch = () => {
    setQuery("");
    setFilters([]);
    setCategoryFilter("all");
  };

  return (
    <PartnerLayout
      activeTab="services"
      title="Services & Rate Card"
      subtitle={`${activeCount} of ${services.length} services live in customer catalog`}
      searchQuery={query}
      onSearchChange={setQuery}
    >
      {/* ========================================================================= */}
      {/* MOBILE ZOMATO MENU & SERVICES VIEW (< md)                                 */}
      {/* ========================================================================= */}
      <div className="min-h-screen bg-[#F4F5F7] pb-28 text-zinc-900 md:hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white px-4 pt-3.5 pb-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-black tracking-tight text-zinc-900">
                {profile?.businessName || "Grand Leaf Cafe & Laundry"}
              </h1>
              <p className="mt-0.5 truncate text-[11px] font-medium text-zinc-500">
                {profile?.city ? `${profile.city} Locality` : "Kasganj Locality"}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleToggleStore}
                className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-black text-zinc-700 active:scale-95"
              >
                <span className={`size-2 rounded-full ${isStoreOnline ? "bg-emerald-500 animate-ping" : "bg-zinc-400"}`} />
                <span>{isStoreOnline ? "Online" : "Offline"}</span>
                <span className="text-[10px] text-zinc-400">›</span>
              </button>

              <Link
                to={partnerRoutes.profile}
                className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-800"
              >
                <Menu className="size-5" />
              </Link>
            </div>
          </div>

          {/* Action Row: Add Service & Create Offer */}
          <div className="mt-3.5 flex gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: partnerRoutes.serviceNew })}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-amber-400 py-2.5 text-xs font-black text-zinc-950 shadow-sm transition-transform active:scale-95"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              <span>Add Custom Service</span>
            </button>

            <button
              type="button"
              onClick={() => setOfferSheetOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-black text-zinc-800 shadow-xs transition-transform active:scale-95"
            >
              <Percent className="size-3.5 text-amber-600" />
              <span>Add Offer</span>
            </button>
          </div>

          {/* Category Horizontal Filter Carousel */}
          <div className="no-scrollbar -mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4 pb-1">
            {[
              { id: "all", label: `All (${services.length})` },
              { id: "active", label: `Active (${activeCount})` },
              { id: "paused", label: `Paused (${services.length - activeCount})` },
              { id: "offers", label: `Offers (${offers.length})` },
            ].map((cat) => {
              const isActive = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id as any)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-black transition-all active:scale-95 ${
                    isActive
                      ? "bg-zinc-950 text-white shadow-sm"
                      : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Input Bar */}
          <div className="relative mt-3">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search service name, type, or price..."
              className="h-10 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-xs font-bold text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none"
            />
          </div>
        </header>

        {/* Mobile Services Card List */}
        <div className="space-y-3 p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-200/70" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
              <Layers className="mx-auto size-10 text-zinc-400" />
              <h3 className="mt-3 text-sm font-black text-zinc-900">No services found</h3>
              <p className="mt-1 text-xs text-zinc-500">
                {isSearching ? "Try adjusting your search query." : "Add your first laundry service rate."}
              </p>
              <button
                type="button"
                onClick={isSearching ? resetSearch : () => navigate({ to: partnerRoutes.serviceNew })}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-zinc-950 px-4 py-2 text-xs font-black text-white active:scale-95"
              >
                {isSearching ? "Reset filters" : "+ Add Service"}
              </button>
            </div>
          ) : (
            visible.map((svc) => {
              const svcOffers = offersFor(svc.id);
              return (
                <div
                  key={svc.id}
                  className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 text-xs font-black">
                          🧺
                        </span>
                        <h3 className="truncate text-sm font-black text-zinc-900">{svc.name}</h3>
                      </div>

                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-base font-black text-zinc-900">
                          ₹{svc.price} <span className="text-[10px] text-zinc-500 font-semibold">/{svc.unit}</span>
                        </span>
                        <span className="flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600">
                          <Clock className="size-3" /> {svc.turnaroundHours}h turnaround
                        </span>
                      </div>

                      {svc.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-500 font-medium">
                          {svc.description}
                        </p>
                      ) : null}

                      {svcOffers.length > 0 ? (
                        <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-flex">
                          <Percent className="size-3" /> {svcOffers[0].title}
                        </div>
                      ) : null}
                    </div>

                    {/* Live Toggle Switch */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const wasEnabled = svc.enabled;
                          void toggleService(svc.id)
                            .then(() => {
                              toast.success(`${svc.name} ${wasEnabled ? "paused" : "is now live"}`);
                            })
                            .catch(() => toast.error("Failed to update status"));
                        }}
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black transition-all ${
                          svc.enabled
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "bg-zinc-200 text-zinc-600"
                        }`}
                      >
                        <span className="size-2 rounded-full bg-white" />
                        <span>{svc.enabled ? "LIVE" : "PAUSED"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate({
                            to: partnerRoutes.serviceEdit,
                            params: { serviceId: svc.id },
                          })
                        }
                        className="flex items-center gap-1 text-xs font-black text-zinc-700 hover:text-zinc-950 p-1"
                      >
                        <Edit2 className="size-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP MENU & SERVICES VIEW (>= md)                                      */}
      {/* ========================================================================= */}
      <div className="hidden mx-auto w-full max-w-7xl px-4 py-4 md:block md:px-8 md:py-6">
        <PullToRefresh onRefresh={refresh}>
          {/* Header Action Banner */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3.5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-brand-dark">
                <Sparkles className="size-6" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-foreground">
                  {activeCount} of {services.length} services active
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  Changes made here sync live to the customer app in real-time.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOfferSheetOpen(true)}
                className="flex items-center gap-1.5 rounded-2xl border border-border bg-muted/40 px-4 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-muted active:scale-95"
              >
                <Tag className="size-4" />
                <span>Create Offer</span>
              </button>

              <button
                type="button"
                onClick={() => navigate({ to: partnerRoutes.serviceNew })}
                className="flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-brand-dark shadow-sm transition-all hover:brightness-105 active:scale-95"
              >
                <Plus className="size-4" />
                <span>Add Service</span>
              </button>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="mt-4">
            <ServiceToolbar
              query={query}
              onQueryChange={setQuery}
              filters={filters}
              onToggleFilter={(id) =>
                setFilters((prev) =>
                  prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
                )
              }
              onClearFilters={() => setFilters([])}
              sort={sort}
              onSortChange={setSort}
              resultCount={visible.length}
            />
          </div>

          {/* Services Grid */}
          <div className="mt-6 pb-12">
            {isLoading ? (
              <ServiceGridSkeleton />
            ) : visible.length === 0 ? (
              <ServiceEmptyState
                isSearching={isSearching}
                onAction={
                  isSearching
                    ? resetSearch
                    : () => navigate({ to: partnerRoutes.serviceNew })
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visible.map((service, index) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    offers={offersFor(service.id)}
                    index={index}
                    onToggle={() => {
                      const wasEnabled = service.enabled;
                      void toggleService(service.id)
                        .then(() => {
                          toast.success(
                            `${service.name} ${wasEnabled ? "paused" : "is now live"}`,
                          );
                        })
                        .catch((err) => {
                          toast.error(
                            err instanceof Error ? err.message : "Failed to update service",
                          );
                        });
                    }}
                    onEdit={() =>
                      navigate({
                        to: partnerRoutes.serviceEdit,
                        params: { serviceId: service.id },
                      })
                    }
                    onViewDetails={() => setDetailsId(service.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>

      {detailsService ? (
        <ServiceDetailsSheet
          service={detailsService}
          offers={offersFor(detailsService.id)}
          onClose={() => setDetailsId(null)}
          onEdit={() => {
            const id = detailsService.id;
            setDetailsId(null);
            void navigate({ to: partnerRoutes.serviceEdit, params: { serviceId: id } });
          }}
        />
      ) : null}

      {offerSheetOpen ? (
        <OfferSheet
          services={services}
          onClose={() => setOfferSheetOpen(false)}
          onCreate={(offer) => {
            addOffer(offer);
            setOfferSheetOpen(false);
            setSuccess("Offer created for this session");
          }}
        />
      ) : null}

      <ServiceSuccessOverlay message={success} onDone={() => setSuccess(null)} />
      <Toaster />
    </PartnerLayout>
  );
}
