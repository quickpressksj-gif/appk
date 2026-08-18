import { Camera, IndianRupee, MapPin, Quote, Star, Store } from "lucide-react";

import { formatINR } from "../../data/rider-wallet-mock";
import type { DeliveryHistoryEntry } from "../../data/rider-history-mock";

export function HistoryTimelinePanel({ entry }: { entry: DeliveryHistoryEntry }) {
  return (
    <section className="card-soft animate-rise border border-border p-4">
      <h2 className="text-sm font-black tracking-tight text-foreground">Complete Timeline</h2>
      <ol className="mt-3">
        {entry.timeline.map((step, index) => (
          <li key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="mt-1 size-2.5 shrink-0 rounded-full bg-secondary" />
              {index < entry.timeline.length - 1 ? (
                <span className="my-1 w-px flex-1 bg-border" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 pb-4 last:pb-0">
              <p className="text-xs font-bold tracking-tight text-foreground">{step.label}</p>
              <p className="text-[0.68rem] font-medium text-muted-foreground">{step.time}</p>
              {step.note ? (
                <p className="mt-0.5 text-[0.66rem] font-medium text-muted-foreground">{step.note}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function PickupDropPanel({ entry }: { entry: DeliveryHistoryEntry }) {
  return (
    <section className="card-soft animate-rise border border-border p-4">
      <h2 className="text-sm font-black tracking-tight text-foreground">Pickup & Delivery</h2>
      <div className="mt-3 space-y-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
            <Store className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
              Pickup · {entry.partnerName}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-foreground">{entry.pickupAddress}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-brand-green">
            <MapPin className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
              Delivery · {entry.customerName}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-foreground">{entry.deliveryAddress}</p>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
        <div>
          <p className="text-sm font-black tracking-tight text-foreground">{entry.distanceKm} km</p>
          <p className="text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground">
            Distance
          </p>
        </div>
        <div>
          <p className="text-sm font-black tracking-tight text-foreground">
            {entry.durationMinutes} min
          </p>
          <p className="text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground">
            Duration
          </p>
        </div>
        <div>
          <p className="text-sm font-black tracking-tight text-foreground">{entry.paymentType}</p>
          <p className="text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground">
            Payment
          </p>
        </div>
      </div>
    </section>
  );
}

export function EarningsBreakdownPanel({ entry }: { entry: DeliveryHistoryEntry }) {
  const total = entry.breakdown.reduce((sum, row) => sum + row.amount, 0);

  return (
    <section className="card-soft animate-rise border border-border p-4">
      <h2 className="flex items-center gap-2 text-sm font-black tracking-tight text-foreground">
        <IndianRupee className="size-4 text-brand-green" />
        Earnings Breakdown
      </h2>
      <div className="mt-2">
        {entry.breakdown.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between border-b border-border py-2.5 last:border-b-0"
          >
            <p className="min-w-0 flex-1 truncate text-xs font-semibold text-muted-foreground">
              {row.label}
            </p>
            <p className="shrink-0 text-sm font-bold tracking-tight text-foreground">
              {formatINR(row.amount)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-2xl bg-muted px-3 py-2.5">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total</p>
        <p className="text-base font-black tracking-tight text-brand-green">{formatINR(total)}</p>
      </div>
    </section>
  );
}

export function RatingFeedbackPanel({ entry }: { entry: DeliveryHistoryEntry }) {
  return (
    <section className="card-soft animate-rise border border-border p-4">
      <h2 className="text-sm font-black tracking-tight text-foreground">Customer Rating</h2>
      {entry.rating ? (
        <>
          <div className="mt-2 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-4 ${
                  i < (entry.rating ?? 0)
                    ? "fill-current text-brand-green"
                    : "text-muted-foreground"
                }`}
              />
            ))}
            <span className="ml-1 text-sm font-black tracking-tight text-foreground">
              {entry.rating.toFixed(1)}
            </span>
          </div>
          {entry.feedback ? (
            <p className="mt-3 flex gap-2 rounded-2xl bg-muted p-3 text-xs font-medium text-muted-foreground">
              <Quote className="size-3.5 shrink-0" />
              {entry.feedback}
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          {entry.cancellationReason ?? "This trip was not rated."}
        </p>
      )}
    </section>
  );
}

export function DeliveryProofPanel() {
  return (
    <section className="card-soft animate-rise border border-border p-4">
      <h2 className="text-sm font-black tracking-tight text-foreground">Delivery Proof</h2>
      <div className="shimmer mt-3 flex h-36 items-center justify-center rounded-2xl bg-muted">
        <span className="flex flex-col items-center gap-2 text-muted-foreground">
          <Camera className="size-6" />
          <span className="text-[0.68rem] font-semibold">Proof photo placeholder</span>
        </span>
      </div>
      <p className="mt-2 text-[0.66rem] font-medium text-muted-foreground">
        Signed OTP and proof photo will be attached here once storage is connected.
      </p>
    </section>
  );
}