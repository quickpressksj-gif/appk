import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BellRing,
  IndianRupee,
  MessageSquare,
  MoonStar,
  Package,
  RotateCcw,
  Smartphone,
  Store,
  Tag,
  Vibrate,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { RiderTopBar } from "../../components/RiderTopBar";
import {
  SettingsSection,
  SettingsTimeRow,
  SettingsToggleRow,
} from "../../components/notifications/NotificationSettingsPanels";
import { riderRoutes } from "../../navigation/rider-routes";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from "../../data/rider-notifications-mock";

type ExtraPreferences = {
  customerMessages: boolean;
  partnerMessages: boolean;
  earnings: boolean;
};

/** Notification Settings — UI-only preference switches (no backend writes). */
export function NotificationSettingsScreen() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [extra, setExtra] = useState<ExtraPreferences>({
    customerMessages: true,
    partnerMessages: true,
    earnings: true,
  });

  const set = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K],
  ) => setPrefs((prev) => ({ ...prev, [key]: value }));

  const setExtraKey = (key: keyof ExtraPreferences, value: boolean) =>
    setExtra((prev) => ({ ...prev, [key]: value }));

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Notification Settings"
          subtitle="Choose what reaches you and when"
          onBack={() => navigate({ to: riderRoutes.notifications })}
        />

        <div className="space-y-4 px-5 pb-32 pt-4">
          <SettingsSection title="Deliveries" caption="Order and pickup alerts">
            <SettingsToggleRow
              icon={Package}
              label="Delivery alerts"
              hint="New assignments, pickup and drop reminders."
              checked={prefs.orderAlerts}
              onChange={(next) => set("orderAlerts", next)}
            />
            <SettingsToggleRow
              icon={BellRing}
              label="System updates"
              hint="App releases, document reminders and policy changes."
              checked={prefs.systemUpdates}
              onChange={(next) => set("systemUpdates", next)}
            />
          </SettingsSection>

          <SettingsSection title="Messages" caption="Chats and support replies" delay={60}>
            <SettingsToggleRow
              icon={MessageSquare}
              label="Customer messages"
              hint="Chat messages from customers on active orders."
              checked={extra.customerMessages}
              onChange={(next) => setExtraKey("customerMessages", next)}
            />
            <SettingsToggleRow
              icon={Store}
              label="Partner messages"
              hint="Store updates about packing and pickup readiness."
              checked={extra.partnerMessages}
              onChange={(next) => setExtraKey("partnerMessages", next)}
            />
            <SettingsToggleRow
              icon={Smartphone}
              label="Support chat"
              hint="Replies from the QuickPress rider support team."
              checked={prefs.chatMessages}
              onChange={(next) => set("chatMessages", next)}
            />
          </SettingsSection>

          <SettingsSection title="Money" caption="Wallet, earnings and offers" delay={120}>
            <SettingsToggleRow
              icon={IndianRupee}
              label="Wallet"
              hint="Credits, withdrawals and bank transfer updates."
              checked={prefs.paymentAlerts}
              onChange={(next) => set("paymentAlerts", next)}
            />
            <SettingsToggleRow
              icon={IndianRupee}
              label="Earnings"
              hint="Daily and weekly earning summaries."
              checked={extra.earnings}
              onChange={(next) => setExtraKey("earnings", next)}
            />
            <SettingsToggleRow
              icon={Tag}
              label="Promotions"
              hint="Surge, incentives and festival campaigns."
              checked={prefs.promotions}
              onChange={(next) => set("promotions", next)}
            />
          </SettingsSection>

          <SettingsSection title="Alert style" caption="Sound, vibration and quiet hours" delay={180}>
            <SettingsToggleRow
              icon={Volume2}
              label="Sound"
              hint="Play a tone for new order alerts."
              checked={prefs.sound}
              onChange={(next) => set("sound", next)}
            />
            <SettingsToggleRow
              icon={Vibrate}
              label="Vibration"
              hint="Vibrate on high priority notifications."
              checked={prefs.vibration}
              onChange={(next) => set("vibration", next)}
            />
            <SettingsToggleRow
              icon={MoonStar}
              label="Do not disturb"
              hint="Mute non-critical alerts during quiet hours."
              checked={prefs.doNotDisturb}
              onChange={(next) => set("doNotDisturb", next)}
            />
            <SettingsTimeRow
              label="Quiet hours"
              from={prefs.dndFrom}
              to={prefs.dndTo}
              onFrom={(next) => set("dndFrom", next)}
              onTo={(next) => set("dndTo", next)}
              disabled={!prefs.doNotDisturb}
            />
          </SettingsSection>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPrefs(DEFAULT_NOTIFICATION_PREFERENCES);
                setExtra({ customerMessages: true, partnerMessages: true, earnings: true });
                toast.success("Preferences reset");
              }}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border text-xs font-black tracking-tight text-foreground"
            >
              <RotateCcw className="size-4" strokeWidth={2.4} /> Reset
            </button>
            <button
              type="button"
              onClick={() => toast.success("Notification preferences saved")}
              className="min-h-12 flex-1 rounded-full bg-primary/25 text-xs font-black tracking-tight text-brand-dark active:scale-[0.98]"
            >
              Save preferences
            </button>
          </div>

          <p className="text-center text-[0.64rem] font-medium text-muted-foreground">
            Preferences are UI-only in this build. Firebase Cloud Messaging will sync them per device.
          </p>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
