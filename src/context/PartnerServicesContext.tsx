import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  MOST_ORDERED_THRESHOLD,
  categoryLabel,
  managedOffers,
  managedServices,
  type ManagedService,
  type ServiceOffer,
} from "../data/partner-services-mock";

/* ------------------------------------------------------------------ */
/* Filter / sort vocabulary                                            */
/* ------------------------------------------------------------------ */

export type ServiceFilterId = "active" | "inactive" | "most_ordered" | "high_price" | "low_price";

export const SERVICE_FILTERS: { id: ServiceFilterId; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "most_ordered", label: "Most Ordered" },
  { id: "high_price", label: "Highest Price" },
  { id: "low_price", label: "Lowest Price" },
];

export type ServiceSortId = "name" | "price" | "popularity" | "recent";

export const SERVICE_SORTS: { id: ServiceSortId; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "price", label: "Price" },
  { id: "popularity", label: "Popularity" },
  { id: "recent", label: "Recently Updated" },
];

const HIGH_PRICE_THRESHOLD = 200;
const LOW_PRICE_THRESHOLD = 100;

export function matchesServiceFilter(service: ManagedService, filter: ServiceFilterId) {
  switch (filter) {
    case "active":
      return service.enabled;
    case "inactive":
      return !service.enabled;
    case "most_ordered":
      return service.ordersThisMonth >= MOST_ORDERED_THRESHOLD;
    case "high_price":
      return service.price >= HIGH_PRICE_THRESHOLD;
    case "low_price":
      return service.price <= LOW_PRICE_THRESHOLD;
    default:
      return true;
  }
}

export function matchesServiceQuery(service: ManagedService, rawQuery: string) {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  return (
    service.name.toLowerCase().includes(q) ||
    categoryLabel(service.category).toLowerCase().includes(q) ||
    service.category.toLowerCase().includes(q)
  );
}

export function sortServices(list: ManagedService[], sort: ServiceSortId) {
  const copy = [...list];
  switch (sort) {
    case "price":
      return copy.sort((a, b) => b.price - a.price);
    case "popularity":
      return copy.sort((a, b) => b.ordersThisMonth - a.ordersThisMonth);
    case "recent":
      return copy.sort((a, b) => a.updatedMinutesAgo - b.updatedMinutesAgo);
    case "name":
    default:
      return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
}

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

export type ServiceDraft = Omit<ManagedService, "id" | "ordersThisMonth" | "updatedMinutesAgo">;

type ServicesContextValue = {
  services: ManagedService[];
  offers: ServiceOffer[];
  isLoading: boolean;
  isOffline: boolean;
  activeCount: number;
  refresh: () => Promise<void>;
  toggleOffline: () => void;
  getService: (id: string) => ManagedService | undefined;
  offersFor: (id: string) => ServiceOffer[];
  toggleService: (id: string) => void;
  addService: (draft: ServiceDraft) => ManagedService;
  updateService: (id: string, patch: Partial<ServiceDraft>) => void;
  addOffer: (offer: Omit<ServiceOffer, "id">) => void;
  removeOffer: (id: string) => void;
};

const ServicesContext = createContext<ServicesContextValue | null>(null);

export function PartnerServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<ManagedService[]>(managedServices);
  const [offers, setOffers] = useState<ServiceOffer[]>(managedOffers);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Skeleton-then-content behaviour shared with the rest of the partner app.
  useState(() => {
    if (typeof window !== "undefined") {
      window.setTimeout(() => setIsLoading(false), 650);
    }
    return null;
  });

  const refresh = useCallback(async () => {
    setIsLoading(true);
    // TODO: replace with GET /api/partner/services
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setIsLoading(false);
  }, []);

  const value = useMemo<ServicesContextValue>(
    () => ({
      services,
      offers,
      isLoading,
      isOffline,
      activeCount: services.filter((service) => service.enabled).length,
      refresh,
      toggleOffline: () => setIsOffline((prev) => !prev),
      getService: (id) => services.find((service) => service.id === id),
      offersFor: (id) => offers.filter((offer) => offer.serviceId === id),
      toggleService: (id) =>
        // TODO: replace with PATCH /api/partner/services/:serviceId/availability
        setServices((prev) =>
          prev.map((service) =>
            service.id === id
              ? { ...service, enabled: !service.enabled, updatedMinutesAgo: 0 }
              : service,
          ),
        ),
      addService: (draft) => {
        // TODO: replace with POST /api/partner/services
        const created: ManagedService = {
          ...draft,
          id: `svc-${Date.now()}`,
          ordersThisMonth: 0,
          updatedMinutesAgo: 0,
        };
        setServices((prev) => [created, ...prev]);
        return created;
      },
      updateService: (id, patch) =>
        // TODO: replace with PATCH /api/partner/services/:serviceId
        setServices((prev) =>
          prev.map((service) =>
            service.id === id ? { ...service, ...patch, updatedMinutesAgo: 0 } : service,
          ),
        ),
      addOffer: (offer) =>
        // TODO: replace with POST /api/partner/services/:serviceId/offers
        setOffers((prev) => [{ ...offer, id: `ofr-${Date.now()}` }, ...prev]),
      removeOffer: (id) => setOffers((prev) => prev.filter((offer) => offer.id !== id)),
    }),
    [services, offers, isLoading, isOffline, refresh],
  );

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function usePartnerServices() {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error("usePartnerServices must be used inside PartnerServicesProvider");
  return ctx;
}
