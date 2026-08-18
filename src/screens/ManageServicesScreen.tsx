import { useNavigate } from "@tanstack/react-router";
import { Sparkles, Tag, WifiOff } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@shared/ui/sonner";

import { PartnerBellAction, PartnerTopBar } from "../components/PartnerTopBar";
import { PartnerBottomNav } from "../components/PartnerBottomNav";
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

export function ManageServicesScreen() {
  const navigate = useNavigate();
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

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ServiceFilterId[]>([]);
  const [sort, setSort] = useState<ServiceSortId>("popularity");
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [offerSheetOpen, setOfferSheetOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const visible = useMemo(() => {
    const filtered = services.filter(
      (service) =>
        matchesServiceQuery(service, query) &&
        filters.every((filter) => matchesServiceFilter(service, filter)),
    );
    return sortServices(filtered, sort);
  }, [services, query, filters, sort]);

  const detailsService = services.find((service) => service.id === detailsId) ?? null;
  const isSearching = query.trim().length > 0 || filters.length > 0;

  const resetSearch = () => {
    setQuery("");
    setFilters([]);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md md:max-w-3xl lg:max-w-6xl">
        <PartnerTopBar
          title="Manage Services"
          subtitle="Rate card, pricing & offers"
          onBack={() => navigate({ to: partnerRoutes.dashboard })}
          action={<PartnerBellAction />}
        />

        <PullToRefresh onRefresh={refresh}>
          <div className="px-5 pt-4">
            <section className="card-soft animate-soft-fade flex items-center gap-3 border border-border p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                <Sparkles className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold tracking-tight text-foreground">
                  {activeCount} of {services.length} services live
                </p>
                <p className="text-[0.7rem] font-medium text-muted-foreground">
                  {offers.length} running {offers.length === 1 ? "offer" : "offers"} · prices sync to
                  the customer app
                </p>
              </div>
              <button
                type="button"
                onClick={toggleOffline}
                aria-pressed={isOffline}
                className={`flex shrink-0 items-center gap-1.5 rounded-2xl border px-3 py-2 text-[0.65rem] font-bold tracking-tight transition-all duration-300 active:scale-[0.96] ${
                  isOffline
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                <WifiOff className="size-3.5" />
                {isOffline ? "Offline" : "Online"}
              </button>
            </section>

            <div className="mt-5">
              <SectionHeading
                title="Your Rate Card"
                action={
                  <span className="flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
                    <Tag className="size-3" />
                    {offers.length} offers
                  </span>
                }
              />
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
                  onAddService={() => navigate({ to: partnerRoutes.serviceNew })}
                  onCreateOffer={() => setOfferSheetOpen(true)}
                />
              </div>
            </div>
          </div>

          <div className="px-5 pb-32 pt-4">
            {isLoading ? (
              <ServiceGridSkeleton />
            ) : isOffline ? (
              <ServiceEmptyState variant="offline" onAction={() => void refresh()} />
            ) : visible.length === 0 ? (
              <ServiceEmptyState
                variant={isSearching && services.length > 0 ? "no-results" : "no-services"}
                onAction={
                  isSearching
                    ? resetSearch
                    : () => navigate({ to: partnerRoutes.serviceNew })
                }
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visible.map((service, index) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    offers={offersFor(service.id)}
                    index={index}
                    onToggle={() => {
                      toggleService(service.id);
                      toast.success(
                        `${service.name} ${service.enabled ? "paused" : "is now live"}`,
                      );
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

        <PartnerBottomNav active="dashboard" />
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
            setSuccess("Offer created");
          }}
        />
      ) : null}

      <ServiceSuccessOverlay message={success} onDone={() => setSuccess(null)} />
      <Toaster />
    </main>
  );
}
