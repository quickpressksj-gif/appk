import { CalendarDays, ChevronRight, IndianRupee, MapPin, Route, Star, Store } from "lucide-react";

import { formatINR } from "../../data/rider-wallet-mock";
import type { DeliveryHistoryEntry } from "../../data/rider-history-mock";

export function HistoryCard({
  entry,
  onOpen,
  delay = 0,
}: {
  entry: DeliveryHistoryEntry;
  onOpen: () => void;
  delay?: number;
}) {
  const cancelled = entry.outcome === "cancelled";

  return (
    <article
      className="card-soft animate-slide-in border border-border p-4 transition-all duration-300 hover:border-primary/60"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black tracking-tight text-foreground">
            {entry.customerName}
          </p>
          <p className="truncate text-[0.7rem] font-semibold text-muted-foreground">
            {entry.orderId}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider ${
            cancelled ? "bg-muted text-muted-foreground" : "bg-secondary/10 text-brand-green"
          }`}
        >
          {entry.outcome}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        <p className="flex items-start gap-2 text-[0.7rem] font-medium text-muted-foreground">
          <Store className="mt-0.5 size-3.5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="font-bold text-foreground">{entry.partnerName}</span> ·{" "}
            {entry.pickupAddress}
          </span>
        </p>
        <p className="flex items-start gap-2 text-[0.7rem] font-medium text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          <span className="min-w-0 flex-1">{entry.deliveryAddress}</span>
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-[0.68rem] font-semibold text-muted-foreground sm:grid-cols-4">
        <span className="flex items-center gap-1">
          <CalendarDays className="size-3.5" />
          {entry.date} · {entry.time}
        </span>
        <span className="flex items-center gap-1">
          <Route className="size-3.5" />
          {entry.distanceKm} km
        </span>
        <span className="flex items-center gap-1 text-foreground">
          <IndianRupee className="size-3.5" />
          {entry.earnings}
          {entry.tips > 0 ? (
            <span className="text-brand-green"> + {formatINR(entry.tips)} tip</span>
          ) : null}
        </span>
        <span className="flex items-center gap-1">
          <span className="rounded-full bg-muted px-2 py-0.5 uppercase tracking-wider">
            {entry.paymentType}
          </span>
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1 text-[0.7rem] font-bold text-foreground">
          {entry.rating ? (
            <>
              <Star className="size-3.5 fill-current text-brand-green" />
              {entry.rating.toFixed(1)}
            </>
          ) : (
            <span className="text-muted-foreground">No rating</span>
          )}
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="ripple flex min-h-11 items-center gap-1 rounded-2xl bg-primary px-4 text-[0.7rem] font-black tracking-tight text-primary-foreground shadow-cta active:scale-[0.97]"
        >
          View details
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </article>
  );
}