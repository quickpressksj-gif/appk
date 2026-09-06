/**
 * Mock data for the Rider Live Navigation & Maps experience.
 * UI only — no Google Maps, no Socket.IO, no backend.
 */

export type NavMapState =
  | "ready"
  | "loading"
  | "gps-disabled"
  | "permission-denied"
  | "route-unavailable"
  | "poor-network";

export type TrafficLevel = "normal" | "moderate" | "heavy";

export type NavigationTrip = {
  riderLocationLabel: string;
  pickupEtaMinutes: number;
  deliveryEtaMinutes: number;
  totalDistanceKm: number;
  remainingDistanceKm: number;
  nextManeuver: string;
  nextManeuverDistance: string;
  traffic: {
    level: TrafficLevel;
    headline: string;
    detail: string;
    alternateRouteAvailable: boolean;
    alternateSaving: string;
  };
};

export const navigationTripMock: NavigationTrip = {
  riderLocationLabel: "",
  pickupEtaMinutes: 0,
  deliveryEtaMinutes: 0,
  totalDistanceKm: 0,
  remainingDistanceKm: 0,
  nextManeuver: "",
  nextManeuverDistance: "",
  traffic: {
    level: "normal",
    headline: "",
    detail: "",
    alternateRouteAvailable: false,
    alternateSaving: "",
  },
};

export const NAV_MAP_STATE_COPY: Record<
  Exclude<NavMapState, "ready">,
  { title: string; body: string; action: string }
> = {
  loading: {
    title: "Preparing your route",
    body: "Fetching the fastest path to the pickup point.",
    action: "Cancel",
  },
  "gps-disabled": {
    title: "GPS is switched off",
    body: "Turn on device location to start live navigation and share your trip.",
    action: "Enable GPS",
  },
  "permission-denied": {
    title: "Location permission denied",
    body: "QuickPress needs location access to guide you to the partner and customer.",
    action: "Open Settings",
  },
  "route-unavailable": {
    title: "Route not available",
    body: "We could not build a route right now. Retry or navigate using the address.",
    action: "Retry route",
  },
  "poor-network": {
    title: "Poor network",
    body: "Navigation is running on cached data. Live traffic may be delayed.",
    action: "Retry",
  },
};

export function loadNavigationTripMock(delay = 700): Promise<NavigationTrip> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(navigationTripMock), delay);
  });
}
