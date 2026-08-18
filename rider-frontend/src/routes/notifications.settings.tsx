import { createFileRoute } from "@tanstack/react-router";

import { NotificationSettingsScreen } from "../screens/notifications/NotificationSettingsScreen";

export const Route = createFileRoute("/notifications/settings")({
  head: () => ({
    meta: [
      { title: "Notification Settings · QuickPress Rider" },
      {
        name: "description",
        content: "Control delivery alerts, chat, wallet, promotions, sound and quiet hours.",
      },
      { property: "og:title", content: "Notification Settings · QuickPress Rider" },
      {
        property: "og:description",
        content: "Control delivery alerts, chat, wallet, promotions, sound and quiet hours.",
      },
    ],
  }),
  component: NotificationSettingsScreen,
});
