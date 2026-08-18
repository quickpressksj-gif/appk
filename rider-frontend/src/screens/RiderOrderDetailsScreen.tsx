import { useNavigate, useParams } from "@tanstack/react-router";
import {
  CheckCircle2,
  Map,
  MessageCircle,
  Navigation,
  PackageCheck,
  Phone,
  Store,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { RiderMapCanvas } from "../components/RiderMapCanvas";
import {
  InfoRow,
  RiderBottomSheet,
  RiderPrimaryButton,
  SectionHeading,
} from "../components/RiderPrimitives";
import { RiderDetailSkeleton } from "../components/RiderSkeletons";
import { RiderTopBar } from "../components/RiderTopBar";
import { STATUS_LABEL, STATUS_TONE } from "../components/RiderOrderCard";
import { useRiderResource } from "../hooks/use-rider-resource";
import { riderRoutes } from "../navigation/rider-routes";
import { confirmDelivery, confirmPickup, fetchRiderOrder } from "@/api/rider/rider-orders-api";

export function RiderOrderDetailsScreen() {
  const navigate = useNavigate();
  const { orderId } = useParams({ from: "/orders/$orderId" });
  const { data, isLoading } = useRiderResource(() => fetchRiderOrder(orderId), [orderId]);
  const [sheet, setSheet] = useState<null | "pickup" | "delivery">(null);
  const [otp, setOtp] = useState("");

  const handleConfirm = async () => {
    if (otp.length !== 4) {
      toast("Enter the 4-digit OTP shared by the customer");
      return;
    }
    if (sheet === "pickup") {
      // TODO: replace with POST /api/rider/orders/:id/pickup
      await confirmPickup(orderId, otp);
      toast.success("Pickup completed · Navigate to partner");
    } else {
      // TODO: replace with POST /api/rider/orders/:id/deliver
      await confirmDelivery(orderId, otp);
      toast.success("Delivery completed");
    }
    setOtp("");
    setSheet(null);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md">
        <RiderTopBar
          title={data ? data.code : "Order Details"}
          subtitle={data ? `${data.taskType} · ${data.slot}` : ""}
          onBack={() => navigate({ to: riderRoutes.orders })}
        />

        {isLoading || !data ? (
          <RiderDetailSkeleton />
        ) : (
          <div className="px-5 pb-40 pt-4">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-3 py-1 text-[0.62rem] font-bold uppercase tracking-wider ${STATUS_TONE[data.status]}`}
              >
                {STATUS_LABEL[data.status]}
              </span>
              <span className="text-[0.7rem] font-bold text-muted-foreground">
                {data.distanceKm} km · {data.etaMinutes} min · ₹{data.estimatedEarning}
              </span>
            </div>

            <div className="mt-4">
              <RiderMapCanvas className="h-44" pickupLabel="Pickup" dropLabel="Drop" />
              <button
                type="button"
                onClick={() => navigate({ to: riderRoutes.navigate, params: { orderId } })}
                className="ripple mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97]"
              >
                <Map className="size-4" />
                Open Google Maps Navigation
              </button>
            </div>

            <section className="card-soft mt-5 border border-border p-4">
              <SectionHeading title="Customer" />
              <div className="mt-2">
                <InfoRow icon={UserRound} label="Name" value={data.customerName} />
                <InfoRow icon={Phone} label="Phone" value={data.customerPhone} />
                <InfoRow icon={Navigation} label="Pickup Address" value={data.pickupAddress} />
              </div>
              <div className="mt-3 flex gap-2">
                <a
                  href={`tel:${data.customerPhone.replace(/\s/g, "")}`}
                  className="ripple flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary/15 py-3 text-xs font-black tracking-tight text-brand-dark transition-all duration-300 active:scale-[0.97]"
                >
                  <Phone className="size-3.5" />
                  Call Customer
                </a>
                <button
                  type="button"
                  onClick={() => toast("Chat opens with the customer thread")}
                  className="ripple flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-3 text-xs font-black tracking-tight text-foreground transition-all duration-300 active:scale-[0.97]"
                >
                  <MessageCircle className="size-3.5" />
                  Chat
                </button>
              </div>
            </section>

            <section className="card-soft mt-4 border border-border p-4">
              <SectionHeading title="Partner" />
              <div className="mt-2">
                <InfoRow icon={Store} label="Store" value={data.partnerName} />
                <InfoRow icon={Phone} label="Phone" value={data.partnerPhone} />
                <InfoRow icon={Navigation} label="Delivery Address" value={data.deliveryAddress} />
              </div>
              <a
                href={`tel:${data.partnerPhone.replace(/\s/g, "")}`}
                className="ripple mt-3 flex items-center justify-center gap-1.5 rounded-2xl bg-secondary/10 py-3 text-xs font-black tracking-tight text-brand-green transition-all duration-300 active:scale-[0.97]"
              >
                <Phone className="size-3.5" />
                Call Partner
              </a>
            </section>

            <section className="card-soft mt-4 border border-border p-4">
              <SectionHeading title="Delivery Flow" />
              <ol className="mt-3 space-y-3">
                {data.timeline.map((step) => (
                  <li key={step.id} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                        step.done
                          ? "bg-secondary/15 text-brand-green"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <CheckCircle2 className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold tracking-tight text-foreground">
                        {step.label}
                      </p>
                      <p className="text-[0.66rem] font-medium text-muted-foreground">
                        {step.time}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <div className="mt-5 flex gap-2">
              <RiderPrimaryButton tone="outline" onClick={() => setSheet("pickup")}>
                <PackageCheck className="size-4" />
                Pickup
              </RiderPrimaryButton>
              <RiderPrimaryButton onClick={() => setSheet("delivery")}>
                <CheckCircle2 className="size-4" />
                Deliver
              </RiderPrimaryButton>
            </div>
          </div>
        )}

        <RiderBottomSheet
          open={sheet !== null}
          onClose={() => setSheet(null)}
          title={sheet === "pickup" ? "Pickup OTP Verification" : "Delivery OTP Verification"}
        >
          <p className="text-xs font-medium text-muted-foreground">
            Ask the {sheet === "pickup" ? "customer" : "customer"} for the 4-digit code to confirm.
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
                    otp.length === i ? "border-primary" : "border-border"
                  }`}
                >
                  {otp[i] ?? ""}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <RiderPrimaryButton onClick={() => void handleConfirm()}>
              Confirm {sheet === "pickup" ? "Pickup" : "Delivery"}
            </RiderPrimaryButton>
          </div>
        </RiderBottomSheet>
      </div>
      <Toaster />
    </main>
  );
}
