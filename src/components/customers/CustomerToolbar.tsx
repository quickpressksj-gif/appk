import { Search, SlidersHorizontal, Users, X } from "lucide-react";

import { CUSTOMER_FILTERS, type CustomerFilterId } from "../../data/partner-customers-mock";

/** Search + segment filter chips for the customers list. */
export function CustomerToolbar({
  query,
  onQueryChange,
  filters,
  onToggleFilter,
  onClearFilters,
  resultCount,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  filters: CustomerFilterId[];
  onToggleFilter: (id: CustomerFilterId) => void;
  onClearFilters: () => void;
  resultCount: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft transition-colors focus-within:border-primary">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          aria-label="Search customers by name, mobile number or customer ID"
          placeholder="Search name, mobile or customer ID"
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

      <div className="no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
        <span className="flex shrink-0 items-center gap-1 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
          <SlidersHorizontal className="size-3.5" />
          Filters
        </span>
        {CUSTOMER_FILTERS.map((filter) => {
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

      <p className="flex items-center gap-1 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
        <Users className="size-3.5" />
        {resultCount} {resultCount === 1 ? "customer" : "customers"}
      </p>
    </div>
  );
}
