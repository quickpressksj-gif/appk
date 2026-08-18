import { useNavigate } from "@tanstack/react-router";
import { Star, Users } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@shared/ui/sonner";

import { PartnerBellAction, PartnerTopBar } from "../components/PartnerTopBar";
import { PartnerBottomNav } from "../components/PartnerBottomNav";
import { PullToRefresh } from "../components/dashboard/PullToRefresh";
import { SectionHeading } from "../components/PartnerPrimitives";
import { CustomerCard } from "../components/customers/CustomerCard";
import { CustomerEmptyState } from "../components/customers/CustomerEmptyState";
import { CustomerGridSkeleton } from "../components/customers/CustomerSkeletons";
import { CustomerToolbar } from "../components/customers/CustomerToolbar";
import { usePartnerResource } from "../hooks/use-partner-resource";
import { partnerRoutes } from "../navigation/partner-routes";
import {
  fetchPartnerCustomersData,
  matchesCustomerFilter,
  matchesCustomerQuery,
  type CustomerFilterId,
} from "../data/partner-customers-mock";

/**
 * Sprint 3.7 — Customers list (UI only, mock data).
 */
export function CustomersScreen() {
  const navigate = useNavigate();
  const { data, setData } = usePartnerResource(fetchPartnerCustomersData);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<CustomerFilterId[]>([]);

  const handleRefresh = useCallback(async () => {
    const fresh = await fetchPartnerCustomersData();
    setData(fresh);
    toast.success("Customers refreshed");
  }, [setData]);

  const customers = data?.customers ?? [];
  const reviews = data?.reviews ?? [];

  const visible = useMemo(
    () =>
      customers.filter(
        (customer) =>
          matchesCustomerQuery(customer, query) &&
          filters.every((filter) => matchesCustomerFilter(customer, filter)),
      ),
    [customers, query, filters],
  );

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
          title="Customers"
          subtitle="Profiles, segments & lifetime value"
          onBack={() => navigate({ to: partnerRoutes.dashboard })}
          action={<PartnerBellAction />}
        />

        {!data ? (
          <div className="px-5 pb-32 pt-4">
            <CustomerGridSkeleton />
          </div>
        ) : (
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="animate-fade-in px-5 pt-4">
              <section className="card-soft animate-soft-fade flex items-center gap-3 border border-border p-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                  <Users className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold tracking-tight text-foreground">
                    {customers.length} customers served
                  </p>
                  <p className="text-[0.7rem] font-medium text-muted-foreground">
                    {customers.filter((customer) => customer.status === "active").length} active ·{" "}
                    {customers.filter((customer) => customer.segments.includes("premium")).length}{" "}
                    premium members
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate({ to: partnerRoutes.reviews })}
                  className="ripple flex shrink-0 items-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-2 text-[0.68rem] font-bold tracking-tight text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.96]"
                >
                  <Star className="size-3.5" />
                  {reviews.length} reviews
                </button>
              </section>

              <div className="mt-5">
                <SectionHeading title="Customer Directory" />
                <div className="mt-4">
                  <CustomerToolbar
                    query={query}
                    onQueryChange={setQuery}
                    filters={filters}
                    onToggleFilter={(id) =>
                      setFilters((prev) =>
                        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
                      )
                    }
                    onClearFilters={() => setFilters([])}
                    resultCount={visible.length}
                  />
                </div>
              </div>
            </div>

            <div className="px-5 pb-32 pt-4">
              {visible.length === 0 ? (
                <CustomerEmptyState
                  variant={isSearching && customers.length > 0 ? "no-results" : "no-customers"}
                  onAction={resetSearch}
                />
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {visible.map((customer, index) => (
                    <CustomerCard
                      key={customer.id}
                      customer={customer}
                      index={index}
                      onOpenProfile={() =>
                        navigate({
                          to: partnerRoutes.customerProfile,
                          params: { customerId: customer.id },
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </PullToRefresh>
        )}

        <PartnerBottomNav active="dashboard" />
      </div>
      <Toaster />
    </main>
  );
}
