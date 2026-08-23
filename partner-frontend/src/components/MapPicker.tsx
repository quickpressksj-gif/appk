/**
 * `<MapPicker />` — Google Maps Shop Location Picker for Partner Onboarding.
 *
 * Real-time map picker with:
 *   • Google Map view with movable center marker & click-to-pin
 *   • Real-time Places autocomplete search (area, street, locality, landmark, pincode)
 *   • Browser GPS "Current Location" button
 *   • Real-time reverse geocoding to extract shop address, city, area, and pincode
 *   • Confirm location button returning structured address components
 */

import {
  ArrowLeft,
  Check,
  Compass,
  Crosshair,
  Loader2,
  MapPin,
  Navigation,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { GoogleMapView } from "@/shared/ui/google-map";
import {
  autocompletePlaces,
  fetchPlaceDetails,
  geocodeAddress,
  reverseGeocodeCoords,
  type GeocodeResult,
  type PlaceSuggestion,
} from "@/api/core/maps-api";
import { getCurrentDeviceLocation, GeoError } from "@/api/partner/location";

export type PickedLocation = {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
};

const DEFAULT_COORDS = { latitude: 27.8118, longitude: 78.6477 }; // Kasganj / UP center fallback

export function MapPicker({
  initial,
  title = "Select Shop Location",
  onConfirm,
  onClose,
}: {
  initial?: { latitude: number; longitude: number } | undefined;
  title?: string;
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

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reverseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced reverse geocoding whenever the selected point changes
  useEffect(() => {
    if (!point) return;
    let alive = true;

    if (reverseTimeoutRef.current) clearTimeout(reverseTimeoutRef.current);

    setResolving(true);
    setError(null);

    reverseTimeoutRef.current = setTimeout(() => {
      void reverseGeocodeCoords(point.latitude, point.longitude)
        .then((result) => {
          if (alive) {
            setDetails(result);
          }
        })
        .catch(() => {
          if (alive) {
            setDetails({
              formattedAddress: `Location (${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)})`,
              placeId: `pin_${point.latitude}_${point.longitude}`,
              latitude: point.latitude,
              longitude: point.longitude,
              area: "Selected Shop Pin",
              city: "",
              state: "",
              pincode: "",
              country: "India",
            });
          }
        })
        .finally(() => {
          if (alive) setResolving(false);
        });
    }, 250);

    return () => {
      alive = false;
      if (reverseTimeoutRef.current) clearTimeout(reverseTimeoutRef.current);
    };
  }, [point?.latitude, point?.longitude]);

  // Current GPS device detection
  const useCurrentLocation = useCallback(async () => {
    if (locating) return;
    setLocating(true);
    setError(null);
    try {
      const fix = await getCurrentDeviceLocation({ timeoutMs: 10000, enableHighAccuracy: true });
      setPoint({ latitude: fix.latitude, longitude: fix.longitude });
    } catch (cause) {
      setError(
        cause instanceof GeoError
          ? cause.message
          : "Unable to detect GPS position. You can search or tap on the map.",
      );
      if (!point) {
        setPoint(DEFAULT_COORDS);
      }
    } finally {
      setLocating(false);
    }
  }, [locating, point]);

  // Initial load: GPS detection if no starting coordinates
  useEffect(() => {
    if (!initial) {
      void useCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time debounced places search
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val.trim() || val.trim().length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await autocompletePlaces(val.trim(), point ?? undefined);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  // Select place from suggestions
  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    setSearchQuery("");
    setSuggestions([]);
    setIsSearchFocused(false);
    setResolving(true);

    try {
      if (suggestion.placeId.startsWith("geo:")) {
        const parts = suggestion.placeId.split(":");
        if (parts.length >= 3) {
          const lat = parseFloat(parts[1] || "0");
          const lng = parseFloat(parts[2] || "0");
          if (!isNaN(lat) && !isNaN(lng)) {
            setPoint({ latitude: lat, longitude: lng });
            return;
          }
        }
      }

      // Try place details or geocoding
      try {
        const detailsResult = await fetchPlaceDetails(suggestion.placeId);
        if (detailsResult.latitude && detailsResult.longitude) {
          setPoint({ latitude: detailsResult.latitude, longitude: detailsResult.longitude });
          setDetails({
            ...detailsResult,
            country: "India",
          });
          setResolving(false);
          return;
        }
      } catch {
        /* fallback to geocode address */
      }

      const geo = await geocodeAddress(suggestion.description || suggestion.primaryText);
      if (geo.latitude && geo.longitude) {
        setPoint({ latitude: geo.latitude, longitude: geo.longitude });
        setDetails(geo);
      }
    } catch {
      setError("Couldn't jump to this place. You can drop a pin on the map.");
    } finally {
      setResolving(false);
    }
  };

  const handleConfirm = () => {
    if (!point) return;
    const formatted =
      details?.formattedAddress ||
      [details?.area, details?.city, details?.state, details?.pincode].filter(Boolean).join(", ") ||
      `Shop Location (${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)})`;

    onConfirm({
      latitude: point.latitude,
      longitude: point.longitude,
      formattedAddress: formatted,
      area: details?.area || details?.city || "Selected Area",
      city: details?.city || "",
      state: details?.state || "",
      pincode: details?.pincode || "",
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background animate-fade-in select-none">
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Back"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-2xl bg-muted text-foreground transition-transform active:scale-95 hover:bg-accent cursor-pointer"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h2 className="text-base font-black tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-[11px] font-medium text-muted-foreground">
              Move pin or search address to locate your laundry shop
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex size-9 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-muted cursor-pointer"
        >
          <X className="size-4" />
        </button>
      </header>

      {/* Floating Search Bar */}
      <div className="relative z-20 px-4 pt-3 pb-2 bg-gradient-to-b from-background via-background/90 to-transparent">
        <div className="relative">
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3.5 flex items-center text-muted-foreground">
              {searching ? (
                <Loader2 className="size-4 animate-spin text-primary" />
              ) : (
                <Search className="size-4" />
              )}
            </span>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search shop area, market, street, city..."
              className="h-11 w-full rounded-2xl border border-border/80 bg-card pl-10 pr-10 text-sm font-semibold text-foreground shadow-sm outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            {searchQuery ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchQuery("");
                  setSuggestions([]);
                }}
                className="absolute right-3 flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          {/* Autocomplete suggestions dropdown */}
          {suggestions.length > 0 && isSearchFocused ? (
            <div className="absolute left-0 right-0 top-13 z-30 max-h-64 overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-xl animate-pop">
              {suggestions.map((item) => (
                <button
                  key={item.placeId}
                  type="button"
                  onClick={() => void handleSelectSuggestion(item)}
                  className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-accent active:bg-accent/80 cursor-pointer"
                >
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MapPin className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-foreground">
                      {item.primaryText || item.description}
                    </p>
                    {item.secondaryText ? (
                      <p className="truncate text-[11px] text-muted-foreground">
                        {item.secondaryText}
                      </p>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative flex-1 overflow-hidden">
        <GoogleMapView
          className="size-full h-full"
          center={point ?? DEFAULT_COORDS}
          markers={
            point
              ? [
                  {
                    latitude: point.latitude,
                    longitude: point.longitude,
                    tone: "primary",
                    label: "Your Shop Location",
                  },
                ]
              : []
          }
          zoom={16}
          interactive={true}
          onPick={(next) => setPoint(next)}
          fallback={
            <div className="flex size-full flex-col items-center justify-center gap-3 bg-muted/40 px-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-3xl bg-primary/10 text-primary animate-pulse">
                <Compass className="size-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Shop Map Ready</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                  Tap anywhere on the map or click GPS to accurately pin your shop.
                </p>
              </div>
            </div>
          }
        />

        {/* Center Pin Overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10 -translate-y-4">
          <div className="flex flex-col items-center animate-bounce-subtle">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl border-2 border-white ring-4 ring-primary/20">
              <MapPin className="size-5 text-white fill-white" />
            </div>
            <div className="size-2 rounded-full bg-black/40 blur-[1px] mt-1" />
          </div>
        </div>

        {/* Floating Controls */}
        <div className="absolute bottom-5 right-4 z-20 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => void useCurrentLocation()}
            disabled={locating}
            className="flex size-12 items-center justify-center rounded-2xl bg-card text-foreground shadow-lg border border-border/80 transition-all hover:bg-accent active:scale-90 disabled:opacity-75 cursor-pointer"
            aria-label="Use Current Shop Location"
            title="Use Current Shop Location"
          >
            {locating ? (
              <Loader2 className="size-5 animate-spin text-primary" />
            ) : (
              <Crosshair className="size-5 text-brand-green" />
            )}
          </button>
        </div>
      </div>

      {/* Selected Location Bottom Card */}
      <footer className="relative z-20 border-t border-border bg-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl">
        {error ? (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
            <X className="size-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/15 text-brand-green mt-0.5">
            <Navigation className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Shop Location Details
              </span>
              {resolving ? (
                <span className="flex items-center gap-1 text-[10px] font-medium text-primary">
                  <Loader2 className="size-2.5 animate-spin" /> Fetching address…
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-secondary/10 px-1.5 py-0.5 text-[9px] font-bold text-brand-green">
                  <Check className="size-2.5" /> Pinned
                </span>
              )}
            </div>

            <h3 className="truncate text-sm font-bold text-foreground mt-0.5">
              {resolving
                ? "Locating address details…"
                : details?.area || details?.city || details?.formattedAddress || "Selected shop location"}
            </h3>

            <p className="truncate text-xs text-muted-foreground mt-0.5">
              {details
                ? [details.area, details.city, details.state, details.pincode].filter(Boolean).join(", ") ||
                  details.formattedAddress
                : point
                  ? `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`
                  : "Tap map or search to choose"}
            </p>
          </div>
        </div>

        {/* Confirm Location CTA Button */}
        <button
          type="button"
          disabled={!point || resolving}
          onClick={handleConfirm}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none cursor-pointer"
        >
          {resolving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Set As Shop Address
        </button>
      </footer>
    </div>
  );
}
