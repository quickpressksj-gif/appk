import { useNavigate } from "@tanstack/react-router";
import { Bike, Clock3, Gauge, Power, Timer, Zap } from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerLayout } from "../components/layout/PartnerLayout";
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
    await updateBusinessSettings(next);
    toast.success(message);
  };

  return (
    <PartnerLayout
      activeTab="profile"
      title="Business Settings"
      subtitle="Store operational configuration, delivery radius and auto-accept rules"
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-6">
        {!settings ? (
          <PartnerListSkeleton />
        ) : (
          <div className="animate-soft-fade space-y-6 pb-12">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Availability Toggles */}
              <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
                <SectionHeading title="Store Availability & Automation" />
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
                    description="Pause when capacity is reached"
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
                    description="Directly queue orders without manual approval"
                    checked={settings.autoAcceptOrders}
                    onChange={(next) =>
                      void patch({ autoAcceptOrders: next }, "Auto accept updated")
                    }
                    delay={90}
                  />
                  <ToggleRow
                    icon={Timer}
                    label="Express Delivery"
                    description="Offer 12-hour turnaround for express bookings"
                    checked={settings.expressDelivery}
                    onChange={(next) => void patch({ expressDelivery: next }, "Express delivery updated")}
                    delay={135}
                  />
                </div>
              </section>

              {/* Operational Rules */}
              <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
                <SectionHeading title="Operational Limits" />
                <div className="mt-4 divide-y divide-border/60">
                  {[
                    {
                      icon: Clock3,
                      label: "Working Hours",
                      value: `${settings.openingTime} – ${settings.closingTime}`,
                    },
                    { icon: Gauge, label: "Pickup Radius", value: `${settings.pickupRadiusKm} km` },
                    { icon: Gauge, label: "Daily Order Cap", value: `${settings.dailyOrderCap} orders` },
                    { icon: Clock3, label: "Weekly Off Day", value: settings.weeklyOff },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <row.icon className="size-4 text-muted-foreground" />
                        <p className="text-xs font-bold text-foreground">{row.label}</p>
                      </div>
                      <span className="text-xs font-extrabold text-brand-dark">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      <Toaster />
    </PartnerLayout>
  );
}
