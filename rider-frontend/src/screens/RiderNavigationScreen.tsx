import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Clock3,
  Compass,
  Crosshair,
  Layers,
  Navigation2,
  PhoneCall,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { RiderMapCanvas } from "../components/RiderMapCanvas";
import { RiderPrimaryButton } from "../components/RiderPrimitives";
import { RiderMapSkeleton } from "../components/RiderSkeletons";
import { useRiderResource } from "../hooks/use-rider-resource";
import { riderRoutes } from "../navigation/rider-routes";
import { pushRiderLocation } from "@/api/rider/rider-dashboard-api";
import { fetchRiderOrder } from "@/api/rider/rider-orders-api";
import {
  computeRoute,
  decodePolyline,
  geocodeAddress,
  pushLiveRiderLocation,
  type LatLng,
  type RouteResult,
} from "@/api/core/maps-api";

const FLOW = [
  "Accept order",
  "Navigate to customer",
  "Pickup completed",
  "Navigate to partner",
  "Laundry delivered to partner",
  "Ready for delivery",
  "Navigate to customer",
  "OTP verification",
  "Delivery completed",
];

export function RiderNavigationScreen() {
  const navigate = useNavigate();
  const { orderId } = useParams({ from: "/navigate/$orderId" });
  const { data, isLoading } = useRiderResource(() => fetchRiderOrder(orderId), [orderId]);
  const [step, setStep] = useState(1);
  const [riderPoint, setRiderPoint] = useState<LatLng | null>(null);
  const [dropPoint, setDropPoint] = useState<LatLng | null>(null);
  const [pickupPoint, setPickupPoint] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);

  // Geocode the trip endpoints once the order lands (GOOGLE server key).
  useEffect(() => {
    if (!data) return;
    let active = true;
    void (async () => {
      try {
        const [pickup, drop] = await Promise.all([
          geocodeAddress(data.pickupAddress),
          geocodeAddress(data.deliveryAddress),
        ]);
        if (!active) return;
        setPickupPoint({ latitude: pickup.latitude, longitude: pickup.longitude });
        setDropPoint({ latitude: drop.latitude, longitude: drop.longitude });
      } catch {
        /* keep the ETA from the order payload */
      }
    })();
    return () => {
      active = false;
    };
  }, [data]);

  // Live GPS watch: keeps the map centred and streams the fix to the backend.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    let lastPush = 0;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const point = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setRiderPoint(point);
        const now = Date.now();
        if (now - lastPush < 15000) return;
        lastPush = now;
        void pushLiveRiderLocation({
          ...point,
          orderId,
          heading: position.coords.heading ?? undefined,
          speedKmph: position.coords.speed ? position.coords.speed * 3.6 : undefined,
        }).catch(() => undefined);
        void pushRiderLocation(point.latitude, point.longitude).catch(() => undefined);
      },
      () => toast.error("Enable location to get live navigation"),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [orderId]);

  // Recompute the route whenever the rider moves meaningfully.
  useEffect(() => {
    const destination = step >= 4 ? dropPoint : (pickupPoint ?? dropPoint);
    if (!riderPoint || !destination) return;
    let active = true;
    void computeRoute(riderPoint, destination)
      .then((result) => {
        if (active) setRoute(result);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [riderPoint, pickupPoint, dropPoint, step]);

  const routePath = useMemo(
    () => (route?.polyline ? decodePolyline(route.polyline) : undefined),
    [route],
  );

  const etaMinutes = route?.etaMinutes ?? data?.etaMinutes ?? null;
  const distanceKm = route?.distanceKm ?? data?.distanceKm ?? null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col">
        <div className="absolute inset-0">
          {isLoading ? (
            <RiderMapSkeleton className="h-full rounded-none" />
          ) : (
            <RiderMapCanvas
              className="h-full rounded-none"
              showLabels={false}
              rider={riderPoint ?? undefined}
              pickup={pickupPoint ?? undefined}
              drop={dropPoint ?? undefined}
              path={routePath}
            />
          )}
        </div>


        <header className="relative z-20 px-4 pt-4">
          <div className="glass-panel flex items-center gap-2 rounded-3xl px-3 py-2.5 shadow-soft">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => navigate({ to: riderRoutes.orderDetails, params: { orderId } })}
              className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-[0.94]"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black tracking-tight text-foreground">
                {data ? FLOW[Math.min(step, FLOW.length - 1)] : "Loading route"}
              </p>
              <p className="truncate text-[0.68rem] font-medium text-muted-foreground">
                {route?.steps?.[0]?.instruction ?? (data ? data.deliveryAddress : "Fetching live route")}
              </p>
            </div>
            <button
              type="button"
              aria-label="Voice guidance"
              onClick={() => toast("Voice guidance on")}
              className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-[0.94]"
            >
              <Volume2 className="size-5" />
            </button>
          </div>
        </header>

        <div className="relative z-20 mt-auto flex flex-col gap-3 px-4 pb-5">
          <div className="flex justify-end gap-2">
            {[Layers, Compass, Crosshair].map((Icon, i) => (
              <button
                key={i}
                type="button"
                aria-label="Map control"
                onClick={() => toast("Map control")}
                className="glass-panel flex size-11 items-center justify-center rounded-2xl text-foreground shadow-soft active:scale-[0.94]"
              >
                <Icon className="size-5" />
              </button>
            ))}
          </div>

          <section className="animate-sheet-up card-soft border border-border p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                <Navigation2 className="size-5" strokeWidth={2.3} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-black tracking-tight text-foreground">
                  {etaMinutes !== null ? `${etaMinutes} min` : "-- min"}
                </p>
                <p className="flex items-center gap-1 text-[0.7rem] font-semibold text-muted-foreground">
                  <Clock3 className="size-3.5" />
                  {distanceKm !== null ? `${distanceKm} km remaining` : "Calculating"}
                </p>
              </div>
              <a
                href={`tel:${(data?.customerPhone ?? "").replace(/\s/g, "")}`}
                aria-label="Call"
                className="flex size-11 items-center justify-center rounded-2xl bg-secondary/10 text-brand-green active:scale-[0.94]"
              >
                <PhoneCall className="size-5" />
              </a>
            </div>

            <div className="mt-4 flex items-center gap-1">
              {FLOW.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    i <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
              Step {Math.min(step + 1, FLOW.length)} of {FLOW.length}
            </p>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const destination = step >= 4 ? dropPoint : (pickupPoint ?? dropPoint);
                  if (!destination) {
                    toast.error("Destination coordinates not available yet");
                    return;
                  }
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
                  window.open(url, "_blank");
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 text-xs font-black text-white shadow-md hover:bg-blue-700 active:scale-[0.97] transition-all cursor-pointer"
              >
                <Compass className="size-4 animate-spin" />
                <span>Open in Google Maps</span>
              </button>

              <div className="flex-1">
                <RiderPrimaryButton
                  onClick={() => {
                    if (step >= FLOW.length - 1) {
                      toast.success("Delivery completed");
                      navigate({ to: riderRoutes.dashboard });
                      return;
                    }
                    setStep(step + 1);
                  }}
                >
                  {step >= FLOW.length - 1 ? "Finish Trip" : `Next: ${FLOW[step + 1]}`}
                </RiderPrimaryButton>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
