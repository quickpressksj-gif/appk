import { useNavigate } from "@tanstack/react-router";
import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";

import { Toaster } from "@/shared/ui/sonner";

import { RiderTopBar } from "../../components/RiderTopBar";
import {
  SettingsCard,
  SettingsChoice,
  SettingsSuccess,
} from "../../components/settings/SettingsPrimitives";
import { useRiderSettings } from "../../context/RiderSettingsContext";
import type { ThemeMode } from "../../data/rider-settings-mock";
import { riderRoutes } from "../../navigation/rider-routes";

const THEME_OPTIONS = [
  { id: "light" as ThemeMode, label: "Light", hint: "Bright, daytime rides", icon: Sun },
  { id: "dark" as ThemeMode, label: "Dark", hint: "Easy on night shifts", icon: Moon },
  { id: "system" as ThemeMode, label: "System", hint: "Follow device setting", icon: Monitor },
];

/** Theme — light, dark or system, applied instantly across the rider app. */
export function ThemeSettingsScreen() {
  const navigate = useNavigate();
  const { theme, setTheme } = useRiderSettings();
  const [success, setSuccess] = useState(false);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Theme"
          subtitle="Appearance of the rider app"
          onBack={() => void navigate({ to: riderRoutes.settings })}
        />

        <div className="space-y-4 px-5 pb-32 pt-4">
          <SettingsCard title="Appearance" caption="Applies immediately on this device">
            <SettingsChoice
              options={THEME_OPTIONS}
              value={theme}
              columns={1}
              onChange={(next) => {
                setTheme(next);
                setSuccess(true);
                window.setTimeout(() => setSuccess(false), 800);
              }}
            />
          </SettingsCard>

          <SettingsCard title="Preview" caption="How cards look with the current theme" delay={60}>
            <div className="space-y-2">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-black tracking-tight text-foreground">Delivery #QP-8842</p>
                <p className="text-[0.7rem] font-medium text-muted-foreground">
                  Andheri East · 2.4 km · ₹68 payout
                </p>
              </div>
              <div className="rounded-2xl bg-primary/15 p-4">
                <p className="text-sm font-black tracking-tight text-brand-dark">Accent surface</p>
                <p className="text-[0.7rem] font-medium text-muted-foreground">
                  Highlights, active tabs and selected chips.
                </p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-sm font-black tracking-tight text-foreground">Muted surface</p>
                <p className="text-[0.7rem] font-medium text-muted-foreground">
                  Secondary rows, list items and skeletons.
                </p>
              </div>
            </div>
          </SettingsCard>
        </div>
      </div>

      <SettingsSuccess open={success} message="Theme updated" />
      <Toaster />
    </main>
  );
}