/**
 * Google Maps JavaScript API loader (browser rendering only).
 *
 * Uses the referrer-restricted browser key `VITE_GOOGLE_MAPS_API_KEY`.
 * Server-side Maps work (geocoding, routes, matrix) goes through the FastAPI
 * proxy with the separate server key — never from here.
 */

type MapsGlobal = { maps?: { Map?: unknown } };

let loadPromise: Promise<boolean> | null = null;

export function googleMapsBrowserKey(): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  return (env["VITE_GOOGLE_MAPS_API_KEY"] ?? "").trim();
}

export function isGoogleMapsConfigured(): boolean {
  return googleMapsBrowserKey().length > 0;
}

/**
 * Loads the Maps JS API once and resolves `true` when `google.maps.Map` is
 * available. Resolves `false` when no browser key is configured or the script
 * fails, so callers can keep their existing fallback UI.
 */
export function loadGoogleMaps(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (loadPromise) return loadPromise;

  const key = googleMapsBrowserKey();
  if (!key) return Promise.resolve(false);

  loadPromise = new Promise<boolean>((resolve) => {
    const existing = (window as unknown as { google?: MapsGlobal }).google;
    if (existing?.maps?.Map) {
      resolve(true);
      return;
    }

    const callbackName = "__quickpressMapsReady";
    (window as unknown as Record<string, unknown>)[callbackName] = () => resolve(true);

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}` +
      `&loading=async&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return loadPromise;
}
