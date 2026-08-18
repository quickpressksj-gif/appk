import { CalendarRange, Download, FileSpreadsheet, FileText, SlidersHorizontal } from "lucide-react";

import {
  TRANSACTION_TYPES,
  WALLET_RANGES,
  type TransactionType,
  type WalletRangeId,
} from "../../data/rider-wallet-mock";

/** Range chips + custom range inputs + export actions (UI only). */
export function WalletFilters({
  range,
  onRange,
  customFrom,
  customTo,
  onCustomFrom,
  onCustomTo,
  type,
  onType,
  onExport,
  showTypes = false,
}: {
  range: WalletRangeId;
  onRange: (next: WalletRangeId) => void;
  customFrom: string;
  customTo: string;
  onCustomFrom: (next: string) => void;
  onCustomTo: (next: string) => void;
  type?: TransactionType | "all";
  onType?: (next: TransactionType | "all") => void;
  onExport?: (format: "pdf" | "excel") => void;
  showTypes?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
          <SlidersHorizontal className="size-3.5" />
          Range
        </span>
        {WALLET_RANGES.map((item) => {
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

      {showTypes && type && onType ? (
        <div className="flex flex-wrap items-center gap-2">
          {TRANSACTION_TYPES.map((item) => {
            const active = item.id === type;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => onType(item.id)}
                className={`min-h-9 rounded-full px-3 py-2 text-[0.68rem] font-bold tracking-tight transition-all duration-300 active:scale-[0.97] ${
                  active
                    ? "bg-primary/15 text-brand-dark ring-1 ring-primary/40"
                    : "border border-border bg-card text-muted-foreground"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {onExport ? (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
            <Download className="size-3.5" />
            Export
          </span>
          <button
            type="button"
            onClick={() => onExport("pdf")}
            className="flex min-h-9 items-center gap-1.5 rounded-2xl border border-border bg-card px-3 text-[0.7rem] font-black tracking-tight text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.97]"
          >
            <FileText className="size-3.5" />
            PDF
          </button>
          <button
            type="button"
            onClick={() => onExport("excel")}
            className="flex min-h-9 items-center gap-1.5 rounded-2xl border border-border bg-card px-3 text-[0.7rem] font-black tracking-tight text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.97]"
          >
            <FileSpreadsheet className="size-3.5" />
            Excel
          </button>
        </div>
      ) : null}
    </div>
  );
}