import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerBellAction, PartnerTopBar } from "../components/PartnerTopBar";
import { PartnerBottomNav } from "../components/PartnerBottomNav";
import { PullToRefresh } from "../components/dashboard/PullToRefresh";
import { OrderCard } from "../components/orders/OrderCard";
import { OrderEmptyState } from "../components/orders/OrderEmptyState";
import { OrderListSkeleton } from "../components/orders/OrderSkeletons";
import { OrderTabs } from "../components/orders/OrderTabs";
import { OrderToolbar } from "../components/orders/OrderToolbar";
import {
  matchesFilter,
  matchesQuery,
  sortOrders,
  usePartnerOrders,
  type OrderFilterId,
  type OrderSortId,
} from "../context/PartnerOrdersContext";
import { useOrderActionHandler } from "../hooks/use-order-action-handler";
import { partnerRoutes } from "../navigation/partner-routes";
import type { OrderStage } from "../data/partner-orders-mock";

export function OrdersScreen() {
  const navigate = useNavigate();
  const { orders, counts, isLoading, isOffline, refresh } = usePartnerOrders();
  const { handleAction, sheetNode, overlay, busy } = useOrderActionHandler();

  const [stage, setStage] = useState<OrderStage>("new");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<OrderFilterId[]>([]);
  const [sort, setSort] = useState<OrderSortId>("latest");

  const visible = useMemo(() => {
    const filtered = orders.filter(
      (order) =>
        order.stage === stage &&
        matchesQuery(order, query) &&
        filters.every((filter) => matchesFilter(order, filter)),
    );
    return sortOrders(filtered, sort);
  }, [orders, stage, query, filters, sort]);

  const stageTotal = counts[stage];
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
          title="Orders"
          subtitle={`${orders.length} orders in your queue`}
          onBack={() => navigate({ to: partnerRoutes.dashboard })}
          action={<PartnerBellAction count={counts.new} />}
        />

        <PullToRefresh onRefresh={refresh}>
          <div className="px-5 pt-4">
            <OrderTabs active={stage} counts={counts} onChange={setStage} />
            <div className="mt-4">
              <OrderToolbar
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
          </div>

          <div className="px-5 pb-32 pt-4">
            {isLoading ? (
              <OrderListSkeleton />
            ) : isOffline ? (
              <OrderEmptyState variant="offline" onAction={() => void refresh()} />
            ) : visible.length === 0 ? (
              <OrderEmptyState
                variant={isSearching && stageTotal > 0 ? "no-results" : "no-orders"}
                onAction={isSearching ? resetSearch : () => void refresh()}
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visible.map((order, index) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    index={index}
                    onAction={handleAction}
                    busyAction={busy?.orderId === order.id ? busy.actionId : null}
                  />
                ))}
              </div>
            )}
          </div>
        </PullToRefresh>

        <PartnerBottomNav active="orders" />
      </div>

      {sheetNode}
      {overlay}
      <Toaster />
    </main>
  );
}
