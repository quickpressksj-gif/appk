/**
 * Rider route map.
 *
 * Renders the live Google map (browser key) with the rider position, pickup /
 * drop markers and the decoded route polyline. When no browser key is
 * configured it falls back to the original SVG route canvas, so the designed
 * UI is preserved everywhere.
 */
import { GoogleMapView, type MapPoint } from "@/shared/ui/google-map";

export function RiderMapCanvas({
  className = "h-64",
  pickupLabel = "Pickup",
  dropLabel = "Drop",
  showLabels = true,
  rider,
  pickup,
  drop,
  path,
}: {
  className?: string;
  pickupLabel?: string;
  dropLabel?: string;
  showLabels?: boolean;
  rider?: { latitude: number; longitude: number } | undefined;
  pickup?: { latitude: number; longitude: number } | undefined;
  drop?: { latitude: number; longitude: number } | undefined;
  path?: { latitude: number; longitude: number }[] | undefined;
}) {
  const markers: MapPoint[] = [];
  if (pickup) markers.push({ ...pickup, label: pickupLabel, tone: "primary" });
  if (drop) markers.push({ ...drop, label: dropLabel, tone: "secondary" });
  if (rider) markers.push({ ...rider, label: "You", tone: "muted" });

  return (
    <GoogleMapView
      className={className}
      markers={markers}
      center={rider ?? pickup}
      path={path}
      fallback={
        <LegacyRouteCanvas
          className={className}
          pickupLabel={pickupLabel}
          dropLabel={dropLabel}
          showLabels={showLabels}
        />
      }
    />
  );
}

/** Original SVG placeholder — used when the Maps browser key is absent. */
function LegacyRouteCanvas({
  className,
  pickupLabel,
  dropLabel,
  showLabels,
}: {
  className: string;
  pickupLabel: string;
  dropLabel: string;
  showLabels: boolean;
}) {
  return (
    <div className={`relative w-full overflow-hidden rounded-3xl bg-muted ${className}`}>
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] [background-size:32px_32px]" />

      <svg viewBox="0 0 320 200" className="absolute inset-0 size-full" aria-hidden="true">
        <path
          d="M30 168 C 90 168, 96 96, 158 96 S 236 44, 292 40"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M30 168 C 90 168, 96 96, 158 96 S 236 44, 292 40"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="10 12"
          className="qp-road"
        />
        <circle cx="30" cy="168" r="8" fill="var(--color-primary)" />
        <circle cx="292" cy="40" r="8" fill="var(--color-secondary)" />
        <circle cx="158" cy="96" r="12" fill="var(--color-background)" />
        <circle cx="158" cy="96" r="6" fill="var(--color-foreground)" className="qp-bob" />
      </svg>

      {showLabels ? (
        <>
          <span className="absolute bottom-3 left-3 rounded-full bg-background/90 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-brand-dark shadow-soft">
            {pickupLabel}
          </span>
          <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-brand-green shadow-soft">
            {dropLabel}
          </span>
        </>
      ) : null}
    </div>
  );
}
