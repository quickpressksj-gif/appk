import { ArrowUpDown, MessageSquarePlus, Search, X } from "lucide-react";

import { REVIEW_SORTS, type ReviewSortId } from "../../data/partner-customers-mock";

/** Search + sort controls for the reviews feed. */
export function ReviewToolbar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  resultCount,
  activeRating,
  onClearRating,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  sort: ReviewSortId;
  onSortChange: (id: ReviewSortId) => void;
  resultCount: number;
  activeRating: number | null;
  onClearRating: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft transition-colors focus-within:border-primary">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            aria-label="Search reviews by customer, service or order ID"
            placeholder="Search customer, service or order"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear review search"
              onClick={() => onQueryChange("")}
              className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <label className="flex shrink-0 items-center gap-2 rounded-2xl border border-border bg-card px-3 py-3 shadow-soft">
          <ArrowUpDown className="size-4 text-muted-foreground" />
          <span className="sr-only">Sort reviews</span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as ReviewSortId)}
            className="bg-transparent text-xs font-bold tracking-tight text-foreground outline-none"
          >
            {REVIEW_SORTS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
          <MessageSquarePlus className="size-3.5" />
          {resultCount} {resultCount === 1 ? "review" : "reviews"}
        </p>
        {activeRating ? (
          <button
            type="button"
            onClick={onClearRating}
            className="flex items-center gap-1 rounded-full border border-brand-green bg-secondary/10 px-3 py-1 text-[0.68rem] font-bold text-brand-green-dark"
          >
            {activeRating}★ only
            <X className="size-3" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
