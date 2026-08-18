import { useNavigate } from "@tanstack/react-router";
import { Bike, Clock3, Gauge, Power, Timer, Zap } from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerTopBar } from "../components/PartnerTopBar";
import { PartnerBottomNav } from "../components/PartnerBottomNav";
import { PartnerListSkeleton } from "../components/PartnerSkeletons";
import { SectionHeading, ToggleRow } from "../components/PartnerPrimitives";
import { usePartnerResource } from "../hooks/use-partner-resource";
import { partnerRoutes } from "../navigation/partner-routes";
import { fetchBusinessSettings, updateBusinessSettings } from "@/api/partner/partner-profile-api";
import type { BusinessSettings } from "@/shared/types/partner";

export function BusinessSettingsScreen() {
  const navigate = useNavigate();
  const { data: settings, setData } = usePartnerResource(fetchBusinessSettings);

  const patch = async (next: Partial<BusinessSettings>, message: string) => {
    if (!settings) return;
    setData({ ...settings, ...next });
    // TODO: replace with PATCH /api/partner/settings
    await updateBusinessSettings(next);
    toast.success(message);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <PartnerTopBar
          title="Business Settings"
          subtitle="Availability & operations"
          onBack={() => navigate({ to: partnerRoutes.profile })}
        />

        {!settings ? (
          <PartnerListSkeleton />
        ) : (
          <div className="px-5 pb-32 pt-4">
            <SectionHeading title="Availability" />
            <div className="mt-4 space-y-3">
              <ToggleRow
                icon={Power}
                label="Store Open"
                description="Customers can place orders now"
                checked={settings.isStoreOpen}
                onChange={(next) =>
                  void patch({ isStoreOpen: next }, next ? "Store opened" : "Store closed")
                }
              />
              <ToggleRow
                icon={Bike}
                label="Accepting New Orders"
                description="Pause when your capacity is full"
                checked={settings.acceptingNewOrders}
                onChange={(next) =>
                  void patch(
                    { acceptingNewOrders: next },
                    next ? "Accepting new orders" : "New orders paused",
                  )
                }
                delay={45}
              />
              <ToggleRow
                icon={Zap}
                label="Auto Accept Orders"
                description="Skip manual confirmation"
                checked={settings.autoAcceptOrders}
                onChange={(next) =>
                  void patch({ autoAcceptOrders: next }, "Auto accept updated")
                }
                delay={90}
              />
              <ToggleRow
                icon={Timer}
                label="Express Delivery"
                description="12-hour turnaround at premium rates"
                checked={settings.expressDelivery}
                onChange={(next) => void patch({ expressDelivery: next }, "Express delivery updated")}
                delay={135}
              />
            </div>

            <div className="mt-7">
              <SectionHeading title="Operations" />
              <div className="card-soft mt-4 divide-y divide-border border border-border">
                {[
                  {
                    icon: Clock3,
                    label: "Working Hours",
                    value: `${settings.openingTime} – ${settings.closingTime}`,
                  },
                  { icon: Gauge, label: "Pickup Radius", value: `${settings.pickupRadiusKm} km` },
                  { icon: Gauge, label: "Daily Order Cap", value: `${settings.dailyOrderCap} orders` },
                  { icon: Clock3, label: "Weekly Off", value: settings.weeklyOff },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3 px-4 py-3.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                      <row.icon className="size-4" />
                    </span>
                    <p className="min-w-0 flex-1 truncate text-sm font-bold tracking-tight text-foreground">
                      {row.label}
                    </p>
                    <span className="shrink-0 text-[0.72rem] font-bold text-muted-foreground">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <PartnerBottomNav active="profile" />
      </div>
      <Toaster />
    </main>
  );
}
