import { ArrowUpDown, Search, SlidersHorizontal, X } from "lucide-react";

import {
  ORDER_FILTERS,
  ORDER_SORTS,
  type OrderFilterId,
  type OrderSortId,
} from "../../context/PartnerOrdersContext";

/** Search + filter chips + sort selector for the orders list. */
export function OrderToolbar({
  query,
  onQueryChange,
  filters,
  onToggleFilter,
  onClearFilters,
  sort,
  onSortChange,
  resultCount,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  filters: OrderFilterId[];
  onToggleFilter: (id: OrderFilterId) => void;
  onClearFilters: () => void;
  sort: OrderSortId;
  onSortChange: (id: OrderSortId) => void;
  resultCount: number;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 md:flex">
        <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft transition-colors focus-within:border-primary md:flex-1">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            aria-label="Search orders by ID, customer name or mobile number"
            placeholder="Search order ID, name or mobile"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onQueryChange("")}
              className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <label className="flex shrink-0 items-center gap-2 rounded-2xl border border-border bg-card px-3 py-3 shadow-soft">
          <ArrowUpDown className="size-4 text-muted-foreground" />
          <span className="sr-only">Sort orders</span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as OrderSortId)}
            className="bg-transparent text-xs font-bold tracking-tight text-foreground outline-none"
          >
            {ORDER_SORTS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
        <span className="flex shrink-0 items-center gap-1 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
          <SlidersHorizontal className="size-3.5" />
          Filters
        </span>
        {ORDER_FILTERS.map((filter) => {
          const isActive = filters.includes(filter.id);
          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onToggleFilter(filter.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[0.7rem] font-bold tracking-tight transition-all duration-300 active:scale-[0.96] ${
                isActive
                  ? "border-brand-green bg-secondary/10 text-brand-green-dark"
                  : "border-border bg-card text-muted-foreground hover:border-primary/60"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
        {filters.length ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="shrink-0 rounded-full px-2 py-1.5 text-[0.7rem] font-bold text-destructive"
          >
            Clear
          </button>
        ) : null}
      </div>

      <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {resultCount} {resultCount === 1 ? "order" : "orders"}
      </p>
    </div>
  );
}
