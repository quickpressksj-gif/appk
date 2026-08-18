import { CloudOff, Loader2, LocateFixed, MapPinOff, Navigation, PackageX } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { NAV_MAP_STATE_COPY, type NavMapState } from "../../data/rider-navigation-mock";

const ICONS: Record<Exclude<NavMapState, "ready">, LucideIcon> = {
  loading: Loader2,
  "gps-disabled": MapPinOff,
  "permission-denied": LocateFixed,
  "route-unavailable": Navigation,
  "poor-network": CloudOff,
};

/** Overlay shown on top of the map placeholder for each map state. */
export function NavMapStateOverlay({
  state,
  onAction,
}: {
  state: Exclude<NavMapState, "ready">;
  onAction: () => void;
}) {
  const copy = NAV_MAP_STATE_COPY[state];
  const Icon = ICONS[state];

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-soft-fade absolute inset-0 z-10 flex items-center justify-center px-6"
    >
      <div className="card-soft w-full max-w-sm border border-border p-6 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
          <Icon className={`size-6 ${state === "loading" ? "animate-spin" : ""}`} />
        </span>
        <p className="mt-4 text-base font-black tracking-tight text-foreground">{copy.title}</p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">{copy.body}</p>
        <button
          type="button"
          onClick={onAction}
          className="ripple mt-5 min-h-11 w-full rounded-2xl bg-primary px-6 text-xs font-black tracking-tight text-primary-foreground shadow-cta active:scale-[0.97]"
        >
          {copy.action}
        </button>
      </div>
    </div>
  );
}

/** Full screen empty states for the navigation experience. */
export function NavEmptyState({
  kind,
  onAction,
}: {
  kind: "no-active-delivery" | "offline" | "no-gps" | "network-error";
  onAction?: () => void;
}) {
  const map = {
    "no-active-delivery": {
      icon: PackageX,
      title: "No active delivery",
      body: "Accept a delivery to start live navigation.",
      action: "Open deliveries",
    },
    offline: {
      icon: LocateFixed,
      title: "You are offline",
      body: "Go online to receive assignments and start navigating.",
      action: "Go online",
    },
    "no-gps": {
      icon: MapPinOff,
      title: "GPS unavailable",
      body: "Enable device location to see your live position on the map.",
      action: "Enable GPS",
    },
    "network-error": {
      icon: CloudOff,
      title: "Network error",
      body: "We could not load the route. Check your connection and retry.",
      action: "Retry",
    },
  }[kind];

  const Icon = map.icon;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
        <Icon className="size-7" />
      </span>
      <p className="mt-4 text-lg font-black tracking-tight text-foreground">{map.title}</p>
      <p className="mt-1 max-w-sm text-xs font-medium text-muted-foreground">{map.body}</p>
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="ripple mt-6 min-h-11 rounded-2xl bg-primary px-6 text-xs font-black tracking-tight text-primary-foreground shadow-cta active:scale-[0.97]"
        >
          {map.action}
        </button>
      ) : null}
    </div>
  );
}
