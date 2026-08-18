import { AlertTriangle, Signal, TrafficCone } from "lucide-react";

import type { NavigationTrip } from "../../data/rider-navigation-mock";

const TONE: Record<NavigationTrip["traffic"]["level"], string> = {
  normal: "bg-secondary/12 text-brand-green",
  moderate: "bg-primary/15 text-brand-dark",
  heavy: "bg-destructive/10 text-destructive",
};

const LABEL: Record<NavigationTrip["traffic"]["level"], string> = {
  normal: "Normal traffic",
  moderate: "Moderate traffic",
  heavy: "Heavy traffic",
};

export function NavTrafficCard({
  traffic,
  onAlternate,
}: {
  traffic: NavigationTrip["traffic"];
  onAlternate: () => void;
}) {
  return (
    <section className="card-soft animate-rise border border-border p-3">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${TONE[traffic.level]}`}
        >
          {traffic.level === "heavy" ? (
            <AlertTriangle className="size-5" />
          ) : traffic.level === "moderate" ? (
            <TrafficCone className="size-5" />
          ) : (
            <Signal className="size-5" />
          )}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-black tracking-tight text-foreground">
              {traffic.headline}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider ${TONE[traffic.level]}`}
            >
              {LABEL[traffic.level]}
            </span>
          </div>
          <p className="mt-0.5 text-[0.7rem] font-medium text-muted-foreground">{traffic.detail}</p>
          {traffic.alternateRouteAvailable ? (
            <button
              type="button"
              onClick={onAlternate}
              className="mt-2 min-h-11 rounded-2xl border border-border bg-card px-3 text-[0.7rem] font-black tracking-tight text-brand-dark active:scale-[0.97]"
            >
              Alternate route available · {traffic.alternateSaving}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
