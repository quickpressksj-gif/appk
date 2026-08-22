import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerLayout } from "../components/layout/PartnerLayout";
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
    <PartnerLayout
      activeTab="orders"
      title="Orders Management"
      subtitle={`${orders.length} orders total in your active queue`}
      searchQuery={query}
      onSearchChange={setQuery}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-8 md:py-6">
        <PullToRefresh onRefresh={refresh}>
          {/* Stage Tabs */}
          <div className="overflow-x-auto pb-1 scrollbar-none">
            <OrderTabs active={stage} counts={counts} onChange={setStage} />
          </div>

          {/* Filters & Sorting Toolbar */}
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

          {/* Orders Content View */}
          <div className="mt-6 pb-12">
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
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
      </div>

      {sheetNode}
      {overlay}
      <Toaster />
    </PartnerLayout>
  );
}
