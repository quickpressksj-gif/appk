import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Layers,
  Menu,
  Phone,
  Play,
  QrCode,
  Search,
  Sparkles,
  Store,
  Volume2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
import { partnerRoutes } from "../navigation/partner-routes";
import { fetchPartnerProfile, toggleStoreStatus } from "@/api/partner/partner-profile-api";
import { usePartnerResource } from "../hooks/use-partner-resource";

const STAGE_CONFIG: { id: OrderStage; label: string }[] = [
  { id: "new", label: "New" },
  { id: "accepted", label: "Accepted" },
  { id: "picked", label: "Picked Up" },
  { id: "processing", label: "Processing" },
  { id: "ready", label: "Ready" },
  { id: "completed", label: "Completed" },
];

export function OrdersScreen() {
  const navigate = useNavigate();
  const { data: profile } = usePartnerResource(fetchPartnerProfile);
  const { orders, counts, isLoading, isOffline, refresh } = usePartnerOrders();
  const { handleAction, sheetNode, overlay, busy } = useOrderActionHandler();

  const [stage, setStage] = useState<OrderStage>("new");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<OrderFilterId[]>([]);
  const [sort, setSort] = useState<OrderSortId>("latest");
  const [isStoreOnline, setIsStoreOnline] = useState(true);
  const [showAlertBar, setShowAlertBar] = useState(true);

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
    const filtered = orders.filter(
      (order) =>
        order.stage === stage &&
        matchesQuery(order, query) &&
        filters.every((filter) => matchesFilter(order, filter)),
    );
    return sortOrders(filtered, sort);
  }, [orders, stage, query, filters, sort]);

  const stageTotal = counts[stage] || 0;
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
      {/* ========================================================================= */}
      {/* MOBILE ZOMATO ORDERS VIEW (< md) Matching Screenshot 2                     */}
      {/* ========================================================================= */}
      <div className="min-h-screen bg-[#F4F5F7] pb-28 text-zinc-900 md:hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-start justify-between px-4 pt-3.5 pb-2">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-black tracking-tight text-zinc-900">
                {profile?.businessName || profile?.ownerName || "QuickPress Partner"}
              </h1>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-zinc-500">
                <span className="size-1.5 rounded-full bg-zinc-400" />
                <span>{profile?.city ? `${profile.city}` : "Store Queue"}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleToggleStore}
                className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-black text-zinc-700 active:scale-95"
              >
                <span>{isStoreOnline ? "Online" : "Offline"}</span>
                <span className="text-[10px] text-zinc-400">›</span>
              </button>

              <Link
                to={partnerRoutes.profile}
                className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-800"
              >
                <Menu className="size-4" />
              </Link>
            </div>
          </div>

          {/* Yellow Notification Troubleshoot Banner */}
          {showAlertBar ? (
            <div className="flex items-center justify-between bg-[#FFF4D4] px-4 py-2 text-xs font-medium text-[#7A5B00] border-y border-[#FFE39A]">
              <div className="flex items-center gap-1.5 min-w-0">
                <Volume2 className="size-3.5 shrink-0" />
                <span className="truncate">Auto sound chime enabled for new orders.</span>
                <span className="font-bold underline cursor-pointer shrink-0">Active</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAlertBar(false)}
                className="text-[#7A5B00] p-1"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : null}

          {/* Banner Carousel */}
          <div className="p-3 pb-1">
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 p-3 border border-amber-200/60 shadow-xs">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase text-zinc-900 leading-snug">
                  WHY TOP BRANDS SWITCHED THEIR PACKAGING
                </p>
                <p className="text-[9px] text-zinc-600">Watch Experts' Table ft. QuickPress</p>
                <button
                  type="button"
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-zinc-950 px-3 py-0.5 text-[10px] font-black text-white active:scale-95"
                >
                  <Play className="size-2.5 fill-current" />
                  <span>Watch now</span>
                </button>
              </div>
              <div className="text-3xl shrink-0">📦</div>
            </div>
          </div>

          {/* Horizontal Stage Pills */}
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-3 py-2">
            {STAGE_CONFIG.map((tab) => {
              const isActive = stage === tab.id;
              const count = counts[tab.id] || 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStage(tab.id)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black transition-all active:scale-95 ${
                    isActive
                      ? "bg-zinc-950 text-white shadow-sm"
                      : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  <span>{tab.label}</span>
                  {count > 0 ? (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[9px] font-black ${
                        isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-800"
                      }`}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </header>

        {/* Orders Content View */}
        <div className="p-4 space-y-3">
          {isLoading ? (
            <OrderListSkeleton />
          ) : !isStoreOnline ? (
            /* Zomato-style Store Closed Illustration */
            <div className="my-6 rounded-3xl bg-white p-8 text-center border border-zinc-200/80 shadow-sm">
              <div className="mx-auto flex size-28 items-center justify-center rounded-full bg-zinc-100 text-4xl shadow-inner">
                🏬
              </div>
              <h3 className="mt-4 text-base font-black text-zinc-900">Temporarily closed</h3>
              <p className="mt-1 text-xs text-zinc-500">
                You are currently offline. Turn store online to start receiving customer orders.
              </p>
              <button
                type="button"
                onClick={handleToggleStore}
                className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-zinc-950 px-6 py-2.5 text-xs font-black text-white shadow-sm active:scale-95"
              >
                <span>Turn Store Online</span>
              </button>
            </div>
          ) : visible.length === 0 ? (
            /* No Orders in this stage */
            <div className="my-6 rounded-3xl bg-white p-8 text-center border border-zinc-200/80 shadow-sm">
              <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-zinc-100 text-3xl">
                🛒
              </div>
              <h3 className="mt-4 text-sm font-black text-zinc-900">
                No orders in "{STAGE_CONFIG.find((s) => s.id === stage)?.label}"
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Incoming orders will appear here automatically with instant chime ringing.
              </p>
              <button
                type="button"
                onClick={() => void refresh()}
                className="mt-4 inline-flex rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-xs font-bold text-zinc-800 active:scale-95"
              >
                Refresh Queue
              </button>
            </div>
          ) : (
            <div className="space-y-3">
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
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP ORDERS VIEW (>= md)                                               */}
      {/* ========================================================================= */}
      <div className="hidden mx-auto w-full max-w-7xl px-4 py-4 md:block md:px-8 md:py-6">
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
