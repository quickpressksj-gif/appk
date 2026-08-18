import {
  Eye,
  Laptop,
  LogOut,
  MapPinned,
  Megaphone,
  ShieldCheck,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useState } from "react";

import type { SecuritySettings } from "../../data/partner-settings-mock";
import { ConfirmSheet, SettingsSheet } from "./SettingsSheet";
import {
  PrimaryButton,
  SettingsCard,
  SettingsNavRow,
  SettingsSection,
  SettingsToggleRow,
} from "./SettingsPrimitives";

/** Sprint 3.10 — Security: devices, sessions, 2FA and privacy. */
export function SecuritySection({
  security,
  onChange,
  onNotify,
  delay = 0,
}: {
  security: SecuritySettings;
  onChange: (patch: Partial<SecuritySettings>, message: string) => void;
  onNotify: (message: string) => void;
  delay?: number;
}) {
  const [sheet, setSheet] = useState<"devices" | "sessions" | "2fa" | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  return (
    <SettingsSection
      id="security"
      icon={ShieldCheck}
      title="Security & Privacy"
      description="Devices, sessions and account protection"
      delay={delay}
    >
      <SettingsCard>
        <SettingsNavRow
          icon={Smartphone}
          label="Device Management"
          value={`${security.devices.length} devices signed in`}
          onClick={() => setSheet("devices")}
        />
        <SettingsNavRow
          icon={MapPinned}
          label="Login Sessions"
          value={`${security.sessions.length} active sessions`}
          onClick={() => setSheet("sessions")}
        />
        <SettingsToggleRow
          icon={ShieldCheck}
          label="Two Factor Authentication"
          description={security.twoFactorEnabled ? "OTP required at every login" : "Add an extra OTP step"}
          checked={security.twoFactorEnabled}
          onChange={(twoFactorEnabled) => {
            if (twoFactorEnabled) {
              setSheet("2fa");
              return;
            }
            onChange({ twoFactorEnabled: false }, "Two factor authentication off");
          }}
        />
      </SettingsCard>

      <div className="mt-3">
        <SettingsCard>
          <SettingsToggleRow
            icon={Eye}
            label="Show Profile to Customers"
            description="Display owner name on the storefront"
            checked={security.privacy.showProfileToCustomers}
            onChange={(next) =>
              onChange(
                { privacy: { ...security.privacy, showProfileToCustomers: next } },
                "Privacy updated",
              )
            }
          />
          <SettingsToggleRow
            icon={Laptop}
            label="Share Usage Analytics"
            description="Helps improve the partner app"
            checked={security.privacy.shareUsageAnalytics}
            onChange={(next) =>
              onChange(
                { privacy: { ...security.privacy, shareUsageAnalytics: next } },
                "Privacy updated",
              )
            }
          />
          <SettingsToggleRow
            icon={Megaphone}
            label="Personalised Marketing"
            description="Offers tailored to your shop performance"
            checked={security.privacy.personalisedMarketing}
            onChange={(next) =>
              onChange(
                { privacy: { ...security.privacy, personalisedMarketing: next } },
                "Privacy updated",
              )
            }
          />
        </SettingsCard>
      </div>

      <SettingsSheet
        open={sheet === "devices"}
        title="Device management"
        subtitle="Devices currently signed in to this partner account"
        onClose={() => setSheet(null)}
      >
        <ul className="space-y-3">
          {security.devices.map((device) => (
            <li
              key={device.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                {device.platform.includes("Web") ? (
                  <Laptop className="size-4" aria-hidden="true" />
                ) : device.name.toLowerCase().includes("tablet") ? (
                  <Tablet className="size-4" aria-hidden="true" />
                ) : (
                  <Smartphone className="size-4" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold tracking-tight text-foreground">
                  {device.name}
                  {device.current ? (
                    <span className="ml-2 rounded-full bg-secondary/10 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-brand-green">
                      This device
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-[0.68rem] font-medium text-muted-foreground">
                  {device.platform} · {device.lastActive}
                </p>
              </div>
              {!device.current ? (
                <button
                  type="button"
                  aria-label={`Sign out ${device.name}`}
                  onClick={() => setRevokeId(device.id)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive transition-all duration-300 active:scale-[0.94]"
                >
                  <LogOut className="size-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </SettingsSheet>

      <SettingsSheet
        open={sheet === "sessions"}
        title="Login sessions"
        subtitle="Recent sign-ins on your account"
        onClose={() => setSheet(null)}
      >
        <ul className="space-y-3">
          {security.sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <MapPinned className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold tracking-tight text-foreground">
                  {session.location}
                  {session.current ? (
                    <span className="ml-2 rounded-full bg-secondary/10 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-brand-green">
                      Current
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-[0.68rem] font-medium text-muted-foreground">
                  IP {session.ip} · {session.startedAt}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </SettingsSheet>

      <SettingsSheet
        open={sheet === "2fa"}
        title="Enable two factor authentication"
        subtitle="An OTP will be sent to your registered mobile"
        onClose={() => setSheet(null)}
      >
        <p className="text-sm font-medium leading-relaxed text-muted-foreground">
          Every new login will require a 6-digit code in addition to your password. Keep your
          registered mobile number up to date so you never get locked out.
        </p>
        <div className="mt-5">
          <PrimaryButton
            onClick={() => {
              setSheet(null);
              onChange({ twoFactorEnabled: true }, "Two factor authentication on");
            }}
          >
            Turn on 2FA
          </PrimaryButton>
        </div>
      </SettingsSheet>

      <ConfirmSheet
        open={revokeId !== null}
        title="Sign out this device?"
        body="The device will need to log in again with your partner credentials."
        confirmLabel="Sign out device"
        tone="danger"
        onCancel={() => setRevokeId(null)}
        onConfirm={() => {
          const id = revokeId;
          setRevokeId(null);
          if (!id) return;
          onChange(
            { devices: security.devices.filter((device) => device.id !== id) },
            "Device signed out",
          );
          onNotify("Device signed out");
        }}
      />
    </SettingsSection>
  );
}
