import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { RiderBellAction, RiderTopBar } from "../../components/RiderTopBar";
import { HistoryCard } from "../../components/history/HistoryCard";
import { HistoryListSkeleton } from "../../components/history/HistorySkeletons";
import { HistoryStateView } from "../../components/history/HistoryStates";
import { HistoryToolbar } from "../../components/history/HistoryToolbar";
import { PullToRefreshShell } from "../../components/wallet/PullToRefreshShell";
import { useRiderResource } from "../../hooks/use-rider-resource";
import { riderRoutes } from "../../navigation/rider-routes";
import {
  loadDeliveryHistory,
  selectHistory,
  type HistoryFilterId,
  type HistorySortId,
} from "../../data/rider-history-mock";

/** Delivery History — searchable, filterable and sortable list of past trips. */
export function DeliveryHistoryScreen() {
  const navigate = useNavigate();
  const { data, isLoading } = useRiderResource(loadDeliveryHistory);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<HistoryFilterId[]>([]);
  const [sort, setSort] = useState<HistorySortId>("latest");
  const [nonce, setNonce] = useState(0);

  const rows = useMemo(
    () => selectHistory(data ?? [], query, filters, sort),
    [data, query, filters, sort],
  );

  const toggleFilter = (id: HistoryFilterId) =>
    setFilters((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  const clearFilters = () => {
    setFilters([]);
    setQuery("");
  };

  const refresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    setNonce((value) => value + 1);
    toast.success("History refreshed");
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Delivery History"
          subtitle="Every completed and cancelled trip"
          action={<RiderBellAction count={1} />}
        />

        {isLoading || !data ? (
          <HistoryListSkeleton />
        ) : (
          <PullToRefreshShell onRefresh={refresh}>
            <div key={nonce} className="px-5 pb-32 pt-4">
              <button
                type="button"
                onClick={() => navigate({ to: riderRoutes.performance })}
                className="card-soft animate-rise flex w-full items-center justify-between border border-border p-4 text-left transition-transform active:scale-[0.98]"
              >
                <span>
                  <span className="block text-sm font-black tracking-tight text-foreground">
                    Performance dashboard
                  </span>
                  <span className="block text-[0.68rem] font-medium text-muted-foreground">
                    Ratings, on-time %, streaks and achievements
                  </span>
                </span>
                <TrendingUp className="size-5 text-brand-green" strokeWidth={2.2} />
              </button>

              <div className="mt-4">
                <HistoryToolbar
                  query={query}
                  onQuery={setQuery}
                  filters={filters}
                  onToggleFilter={toggleFilter}
                  sort={sort}
                  onSort={setSort}
                  resultCount={rows.length}
                />
              </div>

              <div className="mt-4 space-y-3">
                {data.length === 0 ? (
                  <HistoryStateView state="no-history" />
                ) : rows.length === 0 ? (
                  <HistoryStateView state="no-results" onAction={clearFilters} />
                ) : (
                  rows.map((entry, index) => (
                    <HistoryCard
                      key={entry.id}
                      entry={entry}
                      delay={index * 50}
                      onOpen={() =>
                        navigate({
                          to: riderRoutes.historyDetails,
                          params: { deliveryId: entry.id },
                        })
                      }
                    />
                  ))
                )}
              </div>
            </div>
          </PullToRefreshShell>
        )}
      </div>
      <Toaster />
    </main>
  );
}