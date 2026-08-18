/**
 * `<MapPicker />` — the customer map picker.
 *
 * It reuses the ONE existing map system (`@shared/ui/google-map` +
 * `VITE_GOOGLE_MAPS_API_KEY`) and the ONE existing geocoding path
 * (`/api/maps/reverse-geocode` through `@backend/core/maps-api`). No second map
 * library, no invented tile or geocoding URL, no hardcoded coordinates.
 */

import { Crosshair, Loader2, MapPin, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { GoogleMapView } from "@/shared/ui/google-map";
import { reverseGeocodeCoords, type GeocodeResult } from "@/api/core/maps-api";
import { getCurrentDeviceLocation, GeoError } from "@/api/customer/location";

export type PickedLocation = {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
};

export function MapPicker({
  initial,
  onConfirm,
  onClose,
}: {
  initial?: { latitude: number; longitude: number } | undefined;
  onConfirm: (picked: PickedLocation) => void;
  onClose: () => void;
}) {
  const [point, setPoint] = useState<{ latitude: number; longitude: number } | null>(
    initial ?? null,
  );
  const [details, setDetails] = useState<GeocodeResult | null>(null);
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reverse geocode every new pin position for the address preview.
  useEffect(() => {
    if (!point) return;
    let alive = true;
    setResolving(true);
    void reverseGeocodeCoords(point.latitude, point.longitude)
      .then((result) => {
        if (alive) setDetails(result);
      })
      .catch(() => {
        if (alive) setDetails(null);
      })
      .finally(() => {
        if (alive) setResolving(false);
      });
    return () => {
      alive = false;
    };
  }, [point]);

  const useCurrentLocation = useCallback(async () => {
    if (locating) return;
    setLocating(true);
    setError(null);
    try {
      const fix = await getCurrentDeviceLocation();
      setPoint({ latitude: fix.latitude, longitude: fix.longitude });
    } catch (cause) {
      setError(cause instanceof GeoError ? cause.message : "Unable to detect your location.");
    } finally {
      setLocating(false);
    }
  }, [locating]);

  // Open on the customer's real position when no starting point was given.
  useEffect(() => {
    if (!initial) void useCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirm = () => {
    if (!point) return;
    onConfirm({
      latitude: point.latitude,
      longitude: point.longitude,
      formattedAddress: details?.formattedAddress ?? "",
      area: details?.area ?? "",
      city: details?.city ?? "",
      state: details?.state ?? "",
      pincode: details?.pincode ?? "",
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          type="button"
          aria-label="Close map picker"
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-95"
        >
          <X className="size-5" />
        </button>
        <h2 className="text-[17px] font-black tracking-tight text-foreground">Pick your location</h2>
      </header>

      <div className="relative flex-1">
        <GoogleMapView
          className="size-full h-full"
          center={point ?? undefined}
          markers={point ? [{ ...point, tone: "primary", label: "Selected location" }] : []}
          zoom={17}
          onPick={(next) => setPoint(next)}
          fallback={
            <div className="flex size-full flex-col items-center justify-center gap-2 bg-muted px-6 text-center">
              <MapPin className="size-7 text-muted-foreground" aria-hidden />
              <p className="text-sm font-semibold text-foreground">Map preview unavailable</p>
              <p className="text-xs text-muted-foreground">
                Set VITE_GOOGLE_MAPS_API_KEY to render the interactive map. You can still use your
                current location below.
              </p>
            </div>
          }
        />

        <button
          type="button"
          onClick={() => void useCurrentLocation()}
          className="absolute bottom-4 right-4 flex size-12 items-center justify-center rounded-full bg-card shadow-lg ring-1 ring-border active:scale-95"
          aria-label="Use my current location"
        >
          {locating ? (
            <Loader2 className="size-5 animate-spin text-foreground" />
          ) : (
            <Crosshair className="size-5 text-foreground" />
          )}
        </button>
      </div>

      <footer className="border-t border-border px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        {error ? (
          <p className="mb-3 text-xs font-semibold text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 size-[18px] shrink-0 text-brand-green" aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              {resolving
                ? "Resolving address…"
                : (details?.area || details?.formattedAddress || "Tap the map to drop a pin")}
            </p>
            <p className="truncate text-xs font-medium text-muted-foreground">
              {details
                ? [details.city, details.state, details.pincode].filter(Boolean).join(", ")
                : point
                  ? `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`
                  : "Or use the current-location button"}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={!point}
          onClick={confirm}
          className="mt-4 flex h-13 min-h-12 w-full items-center justify-center rounded-2xl bg-primary text-[15px] font-black text-primary-foreground shadow-cta transition-all active:scale-[0.985] disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
        >
          Confirm location
        </button>
      </footer>
    </div>
  );
}
