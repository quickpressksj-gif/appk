import { AtSign, Camera, KeyRound, LogOut, MonitorSmartphone, Phone, Store, UserRound } from "lucide-react";
import { useState } from "react";

import type { PartnerAccount } from "../../data/partner-settings-mock";
import { SettingsSheet, ConfirmSheet } from "./SettingsSheet";
import {
  PrimaryButton,
  SettingsCard,
  SettingsInfoRow,
  SettingsNavRow,
  SettingsSection,
} from "./SettingsPrimitives";

/** Sprint 3.10 — Account settings (profile, contact, password, sessions). */
export function AccountSection({
  account,
  onChange,
  onNotify,
  onLogout,
  onLogoutAll,
  delay = 0,
}: {
  account: PartnerAccount;
  onChange: (patch: Partial<PartnerAccount>) => void;
  onNotify: (message: string) => void;
  onLogout: () => void;
  onLogoutAll: () => void;
  delay?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState(false);
  const [confirm, setConfirm] = useState<"logout" | "logout-all" | null>(null);
  const [draft, setDraft] = useState(account);

  const openEdit = () => {
    setDraft(account);
    setEditing(true);
  };

  return (
    <SettingsSection
      id="account"
      icon={UserRound}
      title="Account"
      description="Profile, contact details and sign-in"
      delay={delay}
    >
      <div className="card-soft flex items-center gap-4 border border-border p-4">
        <button
          type="button"
          onClick={openEdit}
          aria-label="Change profile photo"
          className="relative flex size-16 shrink-0 items-center justify-center rounded-3xl bg-primary/15 text-lg font-black tracking-tight text-brand-dark transition-transform duration-300 active:scale-[0.95]"
        >
          {account.photoUrl ? (
            <img
              src={account.photoUrl}
              alt={`${account.partnerName} profile`}
              className="size-16 rounded-3xl object-cover"
            />
          ) : (
            account.photoInitials
          )}
          <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
            <Camera className="size-3" aria-hidden="true" />
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-black tracking-tight text-foreground">
            {account.partnerName}
          </p>
          <p className="truncate text-[0.72rem] font-semibold text-muted-foreground">
            {account.shopName}
          </p>
          <button
            type="button"
            onClick={openEdit}
            className="mt-2 rounded-full bg-secondary/10 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-brand-green"
          >
            Edit profile
          </button>
        </div>
      </div>

      <div className="mt-3">
        <SettingsCard>
          <SettingsInfoRow icon={Store} label="Shop Name" value={account.shopName} />
          <SettingsInfoRow icon={Phone} label="Mobile Number" value={account.mobile} />
          <SettingsInfoRow icon={AtSign} label="Email" value={account.email} />
          <SettingsNavRow
            icon={KeyRound}
            label="Change Password"
            value="Last updated 3 months ago"
            onClick={() => setPassword(true)}
          />
          <SettingsNavRow
            icon={LogOut}
            label="Logout"
            value="Sign out on this device"
            tone="danger"
            onClick={() => setConfirm("logout")}
          />
          <SettingsNavRow
            icon={MonitorSmartphone}
            label="Logout from All Devices"
            value="Ends every active partner session"
            tone="danger"
            onClick={() => setConfirm("logout-all")}
          />
        </SettingsCard>
      </div>

      <SettingsSheet
        open={editing}
        title="Edit account"
        subtitle="Changes are saved to your partner profile"
        onClose={() => setEditing(false)}
      >
        <div className="space-y-4">
          <SheetField
            id="partner-name"
            label="Partner Name"
            value={draft.partnerName}
            onChange={(partnerName) => setDraft({ ...draft, partnerName })}
          />
          <SheetField
            id="shop-name"
            label="Shop Name"
            value={draft.shopName}
            onChange={(shopName) => setDraft({ ...draft, shopName })}
          />
          <SheetField
            id="mobile"
            label="Mobile Number"
            type="tel"
            value={draft.mobile}
            onChange={(mobile) => setDraft({ ...draft, mobile })}
          />
          <SheetField
            id="email"
            label="Email"
            type="email"
            value={draft.email}
            onChange={(email) => setDraft({ ...draft, email })}
          />
          <p className="text-[0.68rem] font-medium text-muted-foreground">
            Photo uploads open in the next release — the field is UI-ready.
          </p>
          <PrimaryButton
            onClick={() => {
              onChange(draft);
              setEditing(false);
              onNotify("Account updated");
            }}
          >
            Save changes
          </PrimaryButton>
        </div>
      </SettingsSheet>

      <SettingsSheet
        open={password}
        title="Change password"
        subtitle="Use at least 8 characters"
        onClose={() => setPassword(false)}
      >
        <div className="space-y-4">
          <SheetField id="current-password" label="Current Password" type="password" value="" onChange={() => {}} />
          <SheetField id="new-password" label="New Password" type="password" value="" onChange={() => {}} />
          <SheetField id="confirm-password" label="Confirm New Password" type="password" value="" onChange={() => {}} />
          <PrimaryButton
            onClick={() => {
              setPassword(false);
              onNotify("Password updated");
            }}
          >
            Update password
          </PrimaryButton>
        </div>
      </SettingsSheet>

      <ConfirmSheet
        open={confirm === "logout"}
        title="Log out?"
        body="You will need to sign in again with your registered mobile number."
        confirmLabel="Log out"
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          onLogout();
        }}
      />

      <ConfirmSheet
        open={confirm === "logout-all"}
        title="Log out from all devices?"
        body="Every phone, tablet and browser signed in with this partner account will be signed out immediately."
        confirmLabel="Log out everywhere"
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          onLogoutAll();
        }}
      />
    </SettingsSection>
  );
}

function SheetField({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </label>
      <div className="field-focus mt-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground"
          placeholder={type === "password" ? "••••••••" : undefined}
        />
      </div>
    </div>
  );
}
