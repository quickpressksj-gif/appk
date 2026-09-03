import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Compass,
  Crosshair,
  Layers,
  Navigation2,
  PackageCheck,
  PhoneCall,
  Store,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { RiderMapCanvas } from "../components/RiderMapCanvas";
import { RiderBottomSheet, RiderPrimaryButton } from "../components/RiderPrimitives";
import { RiderMapSkeleton } from "../components/RiderSkeletons";
import { useRiderResource } from "../hooks/use-rider-resource";
import { riderRoutes } from "../navigation/rider-routes";
import { pushRiderLocation } from "@/api/rider/rider-dashboard-api";
import {
  confirmDelivery,
  confirmDropAtPartner,
  confirmPickup,
  fetchRiderOrder,
} from "@/api/rider/rider-orders-api";
import {
  computeRoute,
  decodePolyline,
  geocodeAddress,
  pushLiveRiderLocation,
  type LatLng,
  type RouteResult,
} from "@/api/core/maps-api";

const DEFAULT_MAP_CENTER: LatLng = { latitude: 28.6139, longitude: 77.2090 };

function calculateRoadDistanceKm(p1: LatLng, p2: LatLng): number {
  const R = 6371;
  const dLat = (p2.latitude - p1.latitude) * (Math.PI / 180);
  const dLon = (p2.longitude - p1.longitude) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.latitude * (Math.PI / 180)) *
      Math.cos(p2.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(0.5, Math.round(R * c * 1.25 * 10) / 10);
}

export function RiderNavigationScreen() {
  const navigate = useNavigate();
  const { orderId } = useParams({ from: "/navigate/$orderId" });
  const { data, isLoading, setData } = useRiderResource(
    () => fetchRiderOrder(orderId),
    [orderId],
    `rider_order_${orderId}`
  );

  const [phase, setPhase] = useState<"to_customer_pickup" | "to_partner_store" | "to_customer_delivery">(
    "to_customer_pickup"
  );
  const [sheet, setSheet] = useState<null | "pickup" | "delivery">(null);
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [riderPoint, setRiderPoint] = useState<LatLng>(DEFAULT_MAP_CENTER);
  const [dropPoint, setDropPoint] = useState<LatLng>({ latitude: 27.8118, longitude: 78.6477 });
  const [pickupPoint, setPickupPoint] = useState<LatLng>({ latitude: 27.8165, longitude: 78.6530 });
  const [route, setRoute] = useState<RouteResult | null>(null);

  // Sync phase from loaded order data
  useEffect(() => {
    if (!data) return;
    const isDelivery =
      data.taskType === "delivery" ||
      data.status === "ready-for-delivery" ||
      data.status === "delivered" ||
      (data as any).canonicalStatus === "out_for_delivery";

    if (isDelivery) {
      setPhase("to_customer_delivery");
    } else if (data.status === "picked" || (data as any).canonicalStatus === "picked_up") {
      setPhase("to_partner_store");
    } else {
      setPhase("to_customer_pickup");
    }
  }, [data]);

  // Initialize coordinates from order data or geocode address
  useEffect(() => {
    if (!data) return;
    let active = true;

    // Use embedded coordinates if present
    const pLoc = (data as any).pickupLocation || (data as any).partnerLocation;
    const dLoc = (data as any).deliveryLocation;
    if (pLoc?.latitude && pLoc?.longitude) {
      setPickupPoint({ latitude: pLoc.latitude, longitude: pLoc.longitude });
    }
    if (dLoc?.latitude && dLoc?.longitude) {
      setDropPoint({ latitude: dLoc.latitude, longitude: dLoc.longitude });
    }

    void (async () => {
      try {
        const [pickup, drop] = await Promise.all([
          geocodeAddress(data.pickupAddress),
          geocodeAddress(data.deliveryAddress),
        ]);
        if (!active) return;
        if (pickup?.latitude) setPickupPoint({ latitude: pickup.latitude, longitude: pickup.longitude });
        if (drop?.latitude) setDropPoint({ latitude: drop.latitude, longitude: drop.longitude });
      } catch {
        /* fallback to pre-set coordinates */
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
      () => {
        /* Keep fallback coordinates */
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [orderId]);

  // Active target destination based on current trip phase
  const targetDestination = useMemo(() => {
    if (phase === "to_customer_pickup") {
      return pickupPoint;
    }
    // to_partner_store or to_customer_delivery
    return dropPoint;
  }, [phase, pickupPoint, dropPoint]);

  // Recompute the route whenever the rider moves or phase changes
  useEffect(() => {
    if (!riderPoint || !targetDestination) return;
    let active = true;
    void computeRoute(riderPoint, targetDestination)
      .then((result) => {
        if (active) setRoute(result);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [riderPoint, targetDestination]);

  const calculatedDistance = useMemo(() => {
    if (route?.distanceKm) return route.distanceKm;
    if (data?.distanceKm && data.distanceKm > 0) return data.distanceKm;
    return calculateRoadDistanceKm(riderPoint, targetDestination);
  }, [route?.distanceKm, data?.distanceKm, riderPoint, targetDestination]);

  const calculatedEta = useMemo(() => {
    if (route?.etaMinutes) return route.etaMinutes;
    if (data?.etaMinutes && data.etaMinutes > 0) return data.etaMinutes;
    return Math.max(5, Math.round(calculatedDistance * 4));
  }, [route?.etaMinutes, data?.etaMinutes, calculatedDistance]);

  const routePath = useMemo(
    () => (route?.polyline ? decodePolyline(route.polyline) : undefined),
    [route],
  );

  const etaMinutes = calculatedEta;
  const distanceKm = calculatedDistance;

  // Handle OTP verification right inside the navigation screen
  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      toast.error("Enter the 4-digit OTP");
      return;
    }
    setSubmitting(true);
    try {
      if (sheet === "pickup") {
        await confirmPickup(orderId, otp);
        setData((prev) => (prev ? { ...prev, status: "picked" as const } : prev));
        toast.success("Customer Pickup Verified! Now routing to partner store.");
        setPhase("to_partner_store");
      } else {
        await confirmDelivery(orderId, otp);
        setData((prev) => (prev ? { ...prev, status: "delivered" as const } : prev));
        toast.success("Delivery Completed Successfully! 🎉");
        navigate({ to: riderRoutes.dashboard });
      }
      setSheet(null);
      setOtp("");
    } catch (err: any) {
      toast.error(err?.message || "OTP verification failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDropAtStore = async () => {
    setSubmitting(true);
    try {
      await confirmDropAtPartner(orderId);
      setData((prev) => (prev ? { ...prev, status: "at-partner" as const } : prev));
      toast.success("Laundry handed over to partner store!");
      navigate({ to: riderRoutes.dashboard });
    } catch (err: any) {
      toast.error(err?.message || "Failed to confirm drop at store.");
    } finally {
      setSubmitting(false);
    }
  };

  const phaseTitle =
    phase === "to_customer_pickup"
      ? "Heading to Customer Pickup"
      : phase === "to_partner_store"
        ? "Heading to Partner Store"
        : "Heading to Customer Doorstep";

  const phaseAddress =
    phase === "to_customer_pickup"
      ? data?.pickupAddress || "Customer Address"
      : phase === "to_partner_store"
        ? data?.deliveryAddress || "Partner Store"
        : data?.deliveryAddress || "Customer Doorstep";

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col">
        {/* Fullscreen Map Canvas */}
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

        {/* Top Floating Guidance Bar */}
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
                {phaseTitle}
              </p>
              <p className="truncate text-[0.68rem] font-medium text-muted-foreground">
                {route?.steps?.[0]?.instruction ?? phaseAddress}
              </p>
            </div>
            <button
              type="button"
              aria-label="Voice guidance"
              onClick={() => toast("Voice guidance active")}
              className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-[0.94]"
            >
              <Volume2 className="size-5" />
            </button>
          </div>
        </header>

        {/* Bottom Navigation & Action Controls */}
        <div className="relative z-20 mt-auto flex flex-col gap-3 px-4 pb-5">
          <div className="flex justify-end gap-2">
            {[Layers, Compass, Crosshair].map((Icon, i) => (
              <button
                key={i}
                type="button"
                aria-label="Map control"
                onClick={() => toast("Map recentered")}
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
                href={`tel:${((phase === "to_partner_store" ? data?.partnerPhone : data?.customerPhone) ?? "").replace(/\s/g, "")}`}
                aria-label="Call"
                className="flex size-11 items-center justify-center rounded-2xl bg-secondary/10 text-brand-green active:scale-[0.94]"
              >
                <PhoneCall className="size-5" />
              </a>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!targetDestination) {
                    toast.error("Destination coordinates not available");
                    return;
                  }
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${targetDestination.latitude},${targetDestination.longitude}&travelmode=driving`;
                  window.open(url, "_blank");
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 text-xs font-black text-white shadow-md hover:bg-blue-700 active:scale-[0.97] transition-all cursor-pointer"
              >
                <Compass className="size-4 animate-spin" />
                <span>Google Maps</span>
              </button>

              <div className="flex-[1.4]">
                {phase === "to_customer_pickup" ? (
                  <RiderPrimaryButton onClick={() => setSheet("pickup")}>
                    <PackageCheck className="size-4" />
                    Enter Pickup OTP 🧺
                  </RiderPrimaryButton>
                ) : phase === "to_partner_store" ? (
                  <RiderPrimaryButton onClick={() => void handleDropAtStore()}>
                    <Store className="size-4" />
                    Drop at Store 🏪
                  </RiderPrimaryButton>
                ) : (
                  <RiderPrimaryButton onClick={() => setSheet("delivery")}>
                    <CheckCircle2 className="size-4" />
                    Enter Delivery OTP ✓
                  </RiderPrimaryButton>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* In-Navigation OTP Bottom Sheet */}
        <RiderBottomSheet
          open={sheet !== null}
          onClose={() => setSheet(null)}
          title={sheet === "pickup" ? "Customer Pickup OTP" : "Customer Delivery OTP"}
        >
          <p className="text-xs font-medium text-muted-foreground">
            {sheet === "pickup"
              ? "Ask the customer for their 4-digit pickup code to collect laundry."
              : "Ask the customer for their 4-digit delivery code upon handing over clean garments."}
          </p>
          <div className="relative mt-4">
            <input
              aria-label="Verification OTP"
              inputMode="numeric"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="absolute inset-0 z-10 size-full cursor-pointer bg-transparent text-transparent caret-transparent outline-none"
            />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex h-14 flex-1 items-center justify-center rounded-2xl border bg-card text-lg font-black text-foreground shadow-soft transition-all duration-300 ${
                    otp.length === i ? "border-primary ring-2 ring-primary/20" : "border-border"
                  }`}
                >
                  {otp[i] ?? ""}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <RiderPrimaryButton onClick={() => void handleVerifyOtp()}>
              {submitting ? "Verifying..." : "Verify OTP & Continue"}
            </RiderPrimaryButton>
          </div>
        </RiderBottomSheet>
      </div>
      <Toaster />
    </main>
  );
}
