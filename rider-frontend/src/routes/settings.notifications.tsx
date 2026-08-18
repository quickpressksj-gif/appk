import { createFileRoute } from "@tanstack/react-router";

import { NotificationPreferencesScreen } from "../screens/settings/NotificationPreferencesScreen";

export const Route = createFileRoute("/settings/notifications")({
  head: () => ({
    meta: [
      { title: "Notification Settings · QuickPress Rider" },
      { name: "description", content: "Delivery alerts, messages, earnings, wallet, sound and vibration." },
      { property: "og:title", content: "Notification Settings · QuickPress Rider" },
      { property: "og:description", content: "Delivery alerts, messages, earnings, wallet, sound and vibration." },
    ],
  }),
  component: NotificationPreferencesScreen,
});
