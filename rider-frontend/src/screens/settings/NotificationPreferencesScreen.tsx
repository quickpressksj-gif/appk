import { useNavigate } from "@tanstack/react-router";
import {
  BellRing,
  IndianRupee,
  MessageSquare,
  Package,
  RotateCcw,
  Store,
  Tag,
  Vibrate,
  Volume2,
  Wallet,
} from "lucide-react";
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

/** Settings → Notifications: eight preference switches, UI only. */
export function NotificationPreferencesScreen() {
  const navigate = useNavigate();
  const { notifications, updateNotification, resetNotifications } = useRiderSettings();
  const [success, setSuccess] = useState(false);

  const flash = () => {
    setSuccess(true);
    window.setTimeout(() => setSuccess(false), 800);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Notifications"
          subtitle="Choose what reaches you"
          onBack={() => void navigate({ to: riderRoutes.settings })}
          action={
            <button
              type="button"
              aria-label="Reset notification settings"
              onClick={() => {
                resetNotifications();
                toast.success("Notification settings reset");
                flash();
              }}
              className="grid size-10 place-items-center rounded-2xl bg-muted text-foreground transition-all duration-300 active:scale-[0.94]"
            >
              <RotateCcw className="size-4" />
            </button>
          }
        />

        <div className="space-y-4 px-5 pb-32 pt-4">
          <SettingsCard title="Deliveries" caption="Assignments and reminders">
            <div className="divide-y divide-border">
              <SettingsToggle
                icon={Package}
                label="Delivery alerts"
                hint="New assignments, pickup and drop reminders."
                checked={notifications.deliveryAlerts}
                onChange={(next) => {
                  updateNotification("deliveryAlerts", next);
                  flash();
                }}
              />
            </div>
          </SettingsCard>

          <SettingsCard title="Messages" caption="Chats from customers and partners" delay={60}>
            <div className="divide-y divide-border">
              <SettingsToggle
                icon={MessageSquare}
                label="Customer messages"
                hint="Chat messages from customers on active orders."
                checked={notifications.customerMessages}
                onChange={(next) => {
                  updateNotification("customerMessages", next);
                  flash();
                }}
              />
              <SettingsToggle
                icon={Store}
                label="Partner messages"
                hint="Store updates about packing and pickup readiness."
                checked={notifications.partnerMessages}
                onChange={(next) => {
                  updateNotification("partnerMessages", next);
                  flash();
                }}
              />
            </div>
          </SettingsCard>

          <SettingsCard title="Money" caption="Earnings, wallet and offers" delay={120}>
            <div className="divide-y divide-border">
              <SettingsToggle
                icon={IndianRupee}
                label="Earnings"
                hint="Daily and weekly earning summaries."
                checked={notifications.earnings}
                onChange={(next) => {
                  updateNotification("earnings", next);
                  flash();
                }}
              />
              <SettingsToggle
                icon={Wallet}
                label="Wallet"
                hint="Credits, withdrawals and bank transfer updates."
                checked={notifications.wallet}
                onChange={(next) => {
                  updateNotification("wallet", next);
                  flash();
                }}
              />
              <SettingsToggle
                icon={Tag}
                label="Promotions"
                hint="Incentive campaigns, bonus slabs and referral offers."
                checked={notifications.promotions}
                onChange={(next) => {
                  updateNotification("promotions", next);
                  flash();
                }}
              />
            </div>
          </SettingsCard>

          <SettingsCard title="Alert style" caption="How alerts feel on this device" delay={180}>
            <div className="divide-y divide-border">
              <SettingsToggle
                icon={Volume2}
                label="Sound"
                hint="Play the QuickPress alert tone for new pings."
                checked={notifications.sound}
                onChange={(next) => {
                  updateNotification("sound", next);
                  flash();
                }}
              />
              <SettingsToggle
                icon={Vibrate}
                label="Vibration"
                hint="Haptic buzz alongside every delivery alert."
                checked={notifications.vibration}
                onChange={(next) => {
                  updateNotification("vibration", next);
                  flash();
                }}
              />
            </div>
          </SettingsCard>

          <button
            type="button"
            onClick={() => void navigate({ to: riderRoutes.notifications })}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4 text-sm font-black tracking-tight text-foreground transition-all duration-300 active:scale-[0.97]"
          >
            <BellRing className="size-4" />
            Open notification inbox
          </button>
        </div>
      </div>

      <SettingsSuccess open={success} message="Preference saved" />
      <Toaster />
    </main>
  );
}