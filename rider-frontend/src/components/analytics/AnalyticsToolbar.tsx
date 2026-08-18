import { CalendarRange, Search, SlidersHorizontal, X } from "lucide-react";

import { ANALYTICS_RANGES, type AnalyticsRangeId } from "../../data/rider-analytics-mock";

/** Range chips (Today / Week / Month / Custom) + metric search. */
export function AnalyticsToolbar({
  range,
  onRange,
  customFrom,
  customTo,
  onCustomFrom,
  onCustomTo,
  query,
  onQuery,
  placeholder = "Search metrics, badges, zones",
}: {
  range: AnalyticsRangeId;
  onRange: (next: AnalyticsRangeId) => void;
  customFrom: string;
  customTo: string;
  onCustomFrom: (next: string) => void;
  onCustomTo: (next: string) => void;
  query: string;
  onQuery: (next: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder={placeholder}
          aria-label="Search analytics"
          className="min-h-12 w-full rounded-2xl border border-border bg-card pl-10 pr-10 text-xs font-semibold text-foreground outline-none transition-colors duration-300 focus:border-primary"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onQuery("")}
            className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-muted text-muted-foreground active:scale-[0.94]"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
          <SlidersHorizontal className="size-3.5" />
          Range
        </span>
        {ANALYTICS_RANGES.map((item) => {
          const active = item.id === range;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => onRange(item.id)}
              className={`min-h-9 rounded-full px-3 py-2 text-[0.7rem] font-black tracking-tight transition-all duration-300 active:scale-[0.97] ${
                active
                  ? "bg-secondary/15 text-brand-green ring-1 ring-secondary/40"
                  : "border border-border bg-card text-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {range === "custom" ? (
        <div className="animate-expand grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
              <CalendarRange className="size-3" />
              From
            </span>
            <input
              type="date"
              value={customFrom}
              onChange={(event) => onCustomFrom(event.target.value)}
              className="min-h-11 rounded-2xl border border-border bg-card px-3 text-xs font-semibold text-foreground outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
              <CalendarRange className="size-3" />
              To
            </span>
            <input
              type="date"
              value={customTo}
              onChange={(event) => onCustomTo(event.target.value)}
              className="min-h-11 rounded-2xl border border-border bg-card px-3 text-xs font-semibold text-foreground outline-none focus:border-primary"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

/** Sub-tab strip for the analytics module. */
export function AnalyticsSubTabs({
  items,
  activeId,
  onSelect,
}: {
  items: { id: string; label: string }[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onSelect(item.id)}
            className={`min-h-9 flex-1 rounded-full px-3 text-[0.68rem] font-black tracking-tight transition-all duration-300 active:scale-[0.97] ${
              active ? "bg-primary/15 text-brand-dark" : "text-muted-foreground"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
