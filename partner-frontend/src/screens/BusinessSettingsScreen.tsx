import { useNavigate } from "@tanstack/react-router";
import { Bike, Clock3, Gauge, Power, Timer, Zap, ShieldCheck, ChevronRight, FileText, Trash2, Mail, ExternalLink } from "lucide-react";
import { useState } from "react";
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
  const [closeAccountOpen, setCloseAccountOpen] = useState(false);
  const [closing, setClosing] = useState(false);

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

            {/* Section 13: Legal & Privacy */}
            <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
                <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-foreground">Legal & Privacy</h3>
                  <p className="text-[10px] text-muted-foreground">Compliance, Settlement Policies & Partner Data Rights</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <a
                  href="https://quickpress.in/#privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🛡️</span>
                    <div>
                      <p className="text-xs font-bold text-foreground">Privacy Policy</p>
                      <p className="text-[10px] text-muted-foreground">Partner data & KYC safety</p>
                    </div>
                  </div>
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                </a>

                <a
                  href="https://quickpress.in/#terms"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📜</span>
                    <div>
                      <p className="text-xs font-bold text-foreground">Partner Terms & Conditions</p>
                      <p className="text-[10px] text-muted-foreground">Merchant SLA & Quality Codes</p>
                    </div>
                  </div>
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                </a>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">💳</span>
                    <div>
                      <p className="text-xs font-bold text-foreground">Payment & Settlement Policy</p>
                      <p className="text-[10px] text-muted-foreground">Weekly automated bank credits</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#0c831f] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Active</span>
                </div>

                <a
                  href="mailto:official.quickpress@gmail.com?subject=Partner%20Grievance%20Redressal"
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⚖️</span>
                    <div>
                      <p className="text-xs font-bold text-foreground">Grievance Redressal</p>
                      <p className="text-[10px] text-muted-foreground">Escalations & dispute desk</p>
                    </div>
                  </div>
                  <Mail className="size-3.5 text-muted-foreground" />
                </a>

                <a
                  href="mailto:official.quickpress@gmail.com?subject=Partner%20Privacy%20and%20Data%20Support"
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">✉️</span>
                    <div>
                      <p className="text-xs font-bold text-foreground">Privacy / Data Support</p>
                      <p className="text-[10px] text-muted-foreground">Data correction & records</p>
                    </div>
                  </div>
                  <Mail className="size-3.5 text-muted-foreground" />
                </a>

                <button
                  type="button"
                  onClick={() => setCloseAccountOpen(true)}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="size-4 text-destructive" />
                    <div>
                      <p className="text-xs font-bold text-destructive">Account Closure</p>
                      <p className="text-[10px] text-destructive/80">Permanent partner store de-listing</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-destructive/70" />
                </button>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Account Closure Confirmation Dialog — Section 19 */}
      {closeAccountOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl border border-destructive/30 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <span className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-destructive/15 text-destructive ring-8 ring-destructive/10">
              <Trash2 className="size-6" />
            </span>
            <div className="space-y-1">
              <h3 className="text-base font-black text-foreground">Request Store Account Closure?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Closing your store account will disable incoming laundry orders and permanently terminate your partner merchant agreement.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-muted/60 border border-border text-[11px] text-muted-foreground text-left leading-relaxed">
              ⚖️ <strong>Statutory Notice:</strong> Deleting your account may not immediately remove information that QuickPress is required or permitted to retain for legal, security, transaction, fraud-prevention or dispute-resolution purposes.
            </div>

            <a
              href="https://quickpress.in/#privacy"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-primary underline block"
            >
              Read Privacy Policy →
            </a>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCloseAccountOpen(false)}
                className="flex-1 h-11 rounded-xl border border-border bg-card text-xs font-bold text-foreground hover:bg-muted active:scale-[0.97] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setClosing(true);
                  setTimeout(() => {
                    setClosing(false);
                    setCloseAccountOpen(false);
                    toast.success("Account closure request submitted to partner operations.");
                  }, 1200);
                }}
                disabled={closing}
                className="flex-1 h-11 rounded-xl bg-destructive text-xs font-black text-destructive-foreground hover:brightness-105 active:scale-[0.97] transition-all cursor-pointer disabled:opacity-50"
              >
                {closing ? "Submitting..." : "Continue"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Toaster />
    </PartnerLayout>
  );
}
