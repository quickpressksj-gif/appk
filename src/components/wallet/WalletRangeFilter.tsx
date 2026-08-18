import { CalendarClock } from "lucide-react";

import { WALLET_RANGES, type WalletRangeId } from "../../data/partner-wallet-mock";

/** Sprint 3.6 — Today / Week / Month / Custom date range filter (UI only). */
export function WalletRangeFilter({
  range,
  onRangeChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: {
  range: WalletRangeId;
  onRangeChange: (next: WalletRangeId) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {WALLET_RANGES.map((item) => {
          const isActive = item.id === range;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onRangeChange(item.id)}
              className={`focus-key shrink-0 rounded-full border px-4 py-2 text-xs font-bold tracking-tight transition-all duration-300 active:scale-[0.96] ${
                isActive
                  ? "border-primary bg-primary/15 text-brand-dark"
                  : "border-border bg-card text-muted-foreground hover:border-primary/60"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {range === "custom" ? (
        <div className="animate-slide-up card-soft mt-3 border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="size-4" />
            <p className="text-[0.68rem] font-bold uppercase tracking-widest">Custom Date Range</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
                From
              </span>
              <input
                type="date"
                value={customFrom}
                onChange={(event) => onCustomFromChange(event.target.value)}
                className="field-focus mt-1.5 w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none"
              />
            </label>
            <label className="block">
              <span className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
                To
              </span>
              <input
                type="date"
                value={customTo}
                onChange={(event) => onCustomToChange(event.target.value)}
                className="field-focus mt-1.5 w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none"
              />
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}
