import {
  BellRing,
  CreditCard,
  Megaphone,
  MessageSquare,
  PackageCheck,
  ShieldAlert,
  Truck,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  NOTIFICATION_CHANNELS,
  type NotificationChannelId,
  type NotificationPreferences,
} from "../../data/partner-settings-mock";
import { SettingsCard, SettingsSection, SettingsToggleRow } from "./SettingsPrimitives";

const CHANNEL_ICONS: Record<NotificationChannelId, LucideIcon> = {
  newOrders: PackageCheck,
  orderUpdates: Truck,
  customerMessages: MessageSquare,
  payments: CreditCard,
  wallet: Wallet,
  promotions: Megaphone,
  system: ShieldAlert,
};

/** Sprint 3.10 — per-channel notification toggles. */
export function NotificationsSection({
  notifications,
  onChange,
  delay = 0,
}: {
  notifications: NotificationPreferences;
  onChange: (id: NotificationChannelId, next: boolean, label: string) => void;
  delay?: number;
}) {
  return (
    <SettingsSection
      id="notifications"
      icon={BellRing}
      title="Notifications"
      description="Choose what QuickPress alerts you about"
      delay={delay}
    >
      <SettingsCard>
        {NOTIFICATION_CHANNELS.map((channel) => (
          <SettingsToggleRow
            key={channel.id}
            icon={CHANNEL_ICONS[channel.id]}
            label={channel.label}
            description={channel.description}
            checked={notifications[channel.id]}
            onChange={(next) => onChange(channel.id, next, channel.label)}
          />
        ))}
      </SettingsCard>
    </SettingsSection>
  );
}
