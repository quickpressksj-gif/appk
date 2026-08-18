import { useNavigate } from "@tanstack/react-router";
import { Fingerprint, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { RiderTopBar } from "../../components/RiderTopBar";
import {
  SettingsCard,
  SettingsSuccess,
  SettingsToggle,
} from "../../components/settings/SettingsPrimitives";
import { useRiderSettings } from "../../context/RiderSettingsContext";
import { riderRoutes } from "../../navigation/rider-routes";

/**
 * Security & privacy preferences.
 *
 * Removed as production mock/fake functionality:
 *  - "Device sessions": the listed devices, cities and last-active times were
 *    fabricated, and signing one out only filtered a local array. The backend
 *    exposes no session-management endpoint.
 *  - "Change password": rider sign-in is OTP based and there is no password
 *    endpoint; the form only ran a timer and claimed success.
 *
 * The remaining toggles are genuine local device preferences and are stored on
 * the device, which is what the UI states.
 */
export function SecuritySettingsScreen() {
  const navigate = useNavigate();
  const { security, updateSecurity } = useRiderSettings();
  const [success, setSuccess] = useState<string | null>(null);

  const flash = (message: string) => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(null), 1100);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Security"
          subtitle="Sign-in and privacy"
          onBack={() => void navigate({ to: riderRoutes.settings })}
        />

        <div className="space-y-4 px-5 pb-32 pt-4">
          <SettingsCard title="Sign-in" caption="How you access QuickPress Rider">
            <p className="text-[0.72rem] font-semibold text-muted-foreground">
              You sign in with your registered mobile number and a one-time code. There is no
              password to change. To sign out of another device, contact rider support on
              1800 200 4411.
            </p>
          </SettingsCard>

          <SettingsCard title="App lock" caption="Stored on this device" delay={60}>
            <div className="divide-y divide-border">
              <SettingsToggle
                icon={ShieldCheck}
                label="Ask for OTP on every sign-in"
                hint="Keep one-time code verification enabled for every new sign-in on this device."
                checked={security.twoFactor}
                onChange={(next) => {
                  updateSecurity("twoFactor", next);
                  flash(next ? "OTP verification on" : "OTP verification off");
                }}
              />
              <SettingsToggle
                icon={Fingerprint}
                label="Biometric unlock"
                hint="Use fingerprint or face unlock to open the rider app."
                checked={security.biometricUnlock}
                onChange={(next) => {
                  updateSecurity("biometricUnlock", next);
                  flash(next ? "Biometric unlock on" : "Biometric unlock off");
                }}
              />
            </div>
          </SettingsCard>

          <SettingsCard title="Privacy" caption="What you share with QuickPress" delay={120}>
            <div className="divide-y divide-border">
              <SettingsToggle
                icon={MapPin}
                label="Share live location"
                hint="Required for assignments — location is tracked only while you are online."
                checked={security.shareLiveLocation}
                onChange={(next) => {
                  updateSecurity("shareLiveLocation", next);
                  if (!next) toast.warning("Assignments pause while location sharing is off");
                }}
              />
              <SettingsToggle
                icon={Sparkles}
                label="Usage analytics"
                hint="Share anonymous app usage to help improve rider tools."
                checked={security.shareAnalytics}
                onChange={(next) => updateSecurity("shareAnalytics", next)}
              />
              <SettingsToggle
                icon={Sparkles}
                label="Personalised offers"
                hint="Use my activity to tailor incentives and bonus campaigns."
                checked={security.personalisedOffers}
                onChange={(next) => updateSecurity("personalisedOffers", next)}
              />
            </div>
          </SettingsCard>
        </div>
      </div>

      <SettingsSuccess open={success !== null} message={success ?? ""} />
      <Toaster />
    </main>
  );
}
