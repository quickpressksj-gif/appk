import { ArrowDownWideNarrow, Search, SlidersHorizontal, X } from "lucide-react";

import {
  DELIVERY_FILTERS,
  DELIVERY_SORTS,
  type DeliveryFilterId,
  type DeliverySortId,
} from "../../data/rider-delivery-mock";

export function DeliveryToolbar({
  query,
  onQuery,
  filters,
  onToggleFilter,
  sort,
  onSort,
  resultCount,
}: {
  query: string;
  onQuery: (next: string) => void;
  filters: DeliveryFilterId[];
  onToggleFilter: (id: DeliveryFilterId) => void;
  sort: DeliverySortId;
  onSort: (next: DeliverySortId) => void;
  resultCount: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-1 focus-within:border-primary/70">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          aria-label="Search deliveries by order ID, customer or partner"
          placeholder="Search order ID, customer or partner"
          className="min-h-11 min-w-0 flex-1 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onQuery("")}
            className="flex size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
          <SlidersHorizontal className="size-3.5" />
          Filters
        </span>
        {DELIVERY_FILTERS.map((filter) => {
          const active = filters.includes(filter.id);
          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={active}
              onClick={() => onToggleFilter(filter.id)}
              className={`rounded-full px-3 py-2 text-[0.7rem] font-black tracking-tight transition-all duration-300 active:scale-[0.97] ${
                active
                  ? "bg-secondary/15 text-brand-green ring-1 ring-secondary/40"
                  : "border border-border bg-card text-muted-foreground"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <p className="truncate text-[0.7rem] font-semibold text-muted-foreground">
          {resultCount} {resultCount === 1 ? "delivery" : "deliveries"} in this tab
        </p>
        <label className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-border bg-card px-2.5 py-2">
          <ArrowDownWideNarrow className="size-3.5 text-muted-foreground" />
          <span className="sr-only">Sort deliveries</span>
          <select
            value={sort}
            onChange={(event) => onSort(event.target.value as DeliverySortId)}
            className="min-h-7 bg-transparent text-[0.72rem] font-black tracking-tight text-foreground outline-none"
          >
            {DELIVERY_SORTS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
