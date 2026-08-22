import { useNavigate } from "@tanstack/react-router";
import { Plus, Sparkles, Tag, WifiOff } from "lucide-react";
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
    <PartnerLayout
      activeTab="services"
      title="Services & Rate Card"
      subtitle={`${activeCount} of ${services.length} services live in customer catalog`}
      searchQuery={query}
      onSearchChange={setQuery}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-8 md:py-6">
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
