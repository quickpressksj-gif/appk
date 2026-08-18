import { useNavigate } from "@tanstack/react-router";
import {
  BellRing,
  BikeIcon,
  Info,
  LogOut,
  Moon,
  Scale,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { RiderTopBar } from "../../components/RiderTopBar";
import {
  SettingsBadge,
  SettingsCard,
  SettingsConfirmDialog,
  SettingsNavRow,
} from "../../components/settings/SettingsPrimitives";
import { useRiderContext } from "../../context/RiderContext";
import { useRiderSettings } from "../../context/RiderSettingsContext";
import { APP_INFO } from "../../data/rider-settings-mock";
import { riderRoutes } from "../../navigation/rider-routes";

const THEME_LABEL = { light: "Light", dark: "Dark", system: "System" } as const;

/** Settings hub — entry point to every account, work and app preference screen. */
export function SettingsHomeScreen() {
  const navigate = useNavigate();
  const { signOut } = useRiderContext();
  const { profile, work, theme, notifications, security } = useRiderSettings();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [busy, setBusy] = useState(false);

  const activeAlerts = Object.values(notifications).filter(Boolean).length;

  const handleLogout = () => {
    setBusy(true);
    window.setTimeout(() => {
      signOut();
      setBusy(false);
      setConfirmLogout(false);
      toast.success("Signed out of QuickPress Rider");
      void navigate({ to: riderRoutes.auth });
    }, 650);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar title="Settings" subtitle="Account, work and app preferences" />

        <div className="space-y-4 px-5 pb-32 pt-4">
          <button
            type="button"
            onClick={() => void navigate({ to: riderRoutes.settingsAccount })}
            className="card-soft animate-rise ripple flex w-full items-center gap-4 border border-border p-5 text-left transition-all duration-300 active:scale-[0.99]"
          >
            <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/15 text-brand-dark">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="" className="size-full object-cover" />
              ) : (
                <UserRound className="size-6" strokeWidth={2.2} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black tracking-tight text-foreground">
                {profile.fullName}
              </span>
              <span className="block truncate text-[0.7rem] font-semibold text-muted-foreground">
                {profile.riderId} · {profile.phone}
              </span>
            </span>
            <SettingsBadge
              label={`KYC ${profile.kycStatus}`}
              tone={profile.kycStatus === "verified" ? "success" : "warning"}
            />
          </button>

          <SettingsCard title="Account" caption="Profile, vehicle and documents" delay={60}>
            <div className="divide-y divide-border">
              <SettingsNavRow
                icon={UserRound}
                label="Profile"
                hint="Rider information and photo"
                onClick={() => void navigate({ to: riderRoutes.settingsAccount })}
              />
              <SettingsNavRow
                icon={Sparkles}
                label="Edit profile"
                hint="Name, email, address, emergency contact"
                onClick={() => void navigate({ to: riderRoutes.settingsAccountEdit })}
              />
              <SettingsNavRow
                icon={BikeIcon}
                label="Vehicle & documents"
                hint="Registration, insurance and KYC files"
                onClick={() => void navigate({ to: riderRoutes.settingsDocuments })}
              />
            </div>
          </SettingsCard>

          <SettingsCard title="Preferences" caption="How you work and get notified" delay={120}>
            <div className="divide-y divide-border">
              <SettingsNavRow
                icon={BikeIcon}
                label="Work settings"
                hint="Availability, auto accept, area and shift"
                value={work.online ? "Online" : "Offline"}
                onClick={() => void navigate({ to: riderRoutes.settingsWork })}
              />
              <SettingsNavRow
                icon={BellRing}
                label="Notifications"
                hint="Alerts, messages, sound and vibration"
                value={`${activeAlerts}/8 on`}
                onClick={() => void navigate({ to: riderRoutes.settingsNotifications })}
              />
              <SettingsNavRow
                icon={Moon}
                label="Theme"
                hint="Light, dark or follow the system"
                value={THEME_LABEL[theme]}
                onClick={() => void navigate({ to: riderRoutes.settingsTheme })}
              />
            </div>
          </SettingsCard>

          <SettingsCard title="Security & legal" caption="Sessions, privacy and policies" delay={180}>
            <div className="divide-y divide-border">
              <SettingsNavRow
                icon={ShieldCheck}
                label="Security"
                hint="Devices, password, 2FA and privacy"
                value={security.twoFactor ? "2FA on" : "2FA off"}
                onClick={() => void navigate({ to: riderRoutes.settingsSecurity })}
              />
              <SettingsNavRow
                icon={Scale}
                label="Legal"
                hint="Privacy policy, terms, agreement, help"
                onClick={() => void navigate({ to: riderRoutes.settingsLegal })}
              />
              <SettingsNavRow
                icon={Info}
                label="About this app"
                hint="Version, build and updates"
                value={`v${APP_INFO.version}`}
                onClick={() => void navigate({ to: riderRoutes.settingsAbout })}
              />
            </div>
          </SettingsCard>

          <SettingsCard delay={240}>
            <SettingsNavRow
              icon={LogOut}
              label="Log out"
              hint="End this session on this device"
              tone="danger"
              onClick={() => setConfirmLogout(true)}
            />
          </SettingsCard>

          <p className="pt-1 text-center text-[0.66rem] font-semibold text-muted-foreground">
            QuickPress Rider · v{APP_INFO.version} ({APP_INFO.build})
          </p>
        </div>
      </div>

      <SettingsConfirmDialog
        open={confirmLogout}
        icon={LogOut}
        title="Log out of QuickPress Rider?"
        body="Your active shift will end and you will stop receiving delivery assignments on this device until you sign in again."
        confirmLabel="Yes, log me out"
        cancelLabel="Stay signed in"
        busy={busy}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
      <Toaster />
    </main>
  );
}