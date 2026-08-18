import { useNavigate } from "@tanstack/react-router";
import {
  BellRing,
  ChevronRight,
  FileText,
  Languages,
  LogOut,
  Moon,
  ShieldCheck,
  Vibrate,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { SectionHeading, ToggleRow } from "../components/RiderPrimitives";
import { RiderTopBar } from "../components/RiderTopBar";
import { useRiderContext } from "../context/RiderContext";
import { riderRoutes } from "../navigation/rider-routes";

const LANGUAGES = ["English", "हिन्दी", "मराठी", "தமிழ்"];

const LEGAL = [
  { id: "privacy", label: "Privacy Policy", icon: ShieldCheck },
  { id: "terms", label: "Terms & Conditions", icon: FileText },
] as const;

export function RiderSettingsScreen() {
  const navigate = useNavigate();
  const { signOut } = useRiderContext();
  const [language, setLanguage] = useState(LANGUAGES[0]!);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [payoutAlerts, setPayoutAlerts] = useState(true);
  const [vibrate, setVibrate] = useState(false);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md">
        <RiderTopBar title="Settings" subtitle="Preferences and account" />

        <div className="px-5 pb-32 pt-4">
          <section className="card-soft border border-border p-4">
            <div className="flex items-center gap-2">
              <Languages className="size-4 text-brand-dark" />
              <SectionHeading title="Language" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {LANGUAGES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLanguage(item)}
                  className={`rounded-2xl border px-3 py-3 text-xs font-bold tracking-tight transition-all duration-300 active:scale-[0.96] ${
                    language === item
                      ? "border-primary bg-primary/15 text-brand-dark"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <div className="mt-4 space-y-3">
            <ToggleRow
              icon={BellRing}
              label="Order Notifications"
              description="New assignments and reminders"
              checked={orderAlerts}
              onChange={setOrderAlerts}
            />
            <ToggleRow
              icon={ShieldCheck}
              label="Payment Updates"
              description="Payouts, incentives and penalties"
              checked={payoutAlerts}
              onChange={setPayoutAlerts}
              delay={60}
            />
            <ToggleRow
              icon={Vibrate}
              label="Vibrate on Alert"
              description="Haptics for new order pings"
              checked={vibrate}
              onChange={setVibrate}
              delay={120}
            />
          </div>

          <div className="card-soft mt-3 flex items-center gap-3 border border-border p-4 opacity-70">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Moon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold tracking-tight text-foreground">Dark Mode</p>
              <p className="text-[0.7rem] font-medium text-muted-foreground">Coming soon</p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
              Soon
            </span>
          </div>

          <section className="mt-4 space-y-2">
            {LEGAL.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toast(`${item.label} opens here`)}
                className="card-soft ripple flex w-full items-center gap-3 border border-border p-4 text-left transition-all duration-300 active:scale-[0.985]"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <item.icon className="size-4" />
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-bold tracking-tight text-foreground">
                  {item.label}
                </p>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </section>

          <button
            type="button"
            onClick={() => {
              signOut();
              toast("Signed out");
              navigate({ to: riderRoutes.auth });
            }}
            className="ripple mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/10 py-4 text-sm font-black tracking-tight text-destructive transition-all duration-300 active:scale-[0.97]"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
