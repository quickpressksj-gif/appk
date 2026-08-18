import { createFileRoute } from "@tanstack/react-router";

import { NotificationCenterScreen } from "../screens/notifications/NotificationCenterScreen";

export const Route = createFileRoute("/notifications/")({
  head: () => ({
    meta: [
      { title: "Notification Center · QuickPress Rider" },
      {
        name: "description",
        content: "New orders, pickup reminders, wallet credits and rider alerts in one place.",
      },
      { property: "og:title", content: "Notification Center · QuickPress Rider" },
      {
        property: "og:description",
        content: "New orders, pickup reminders, wallet credits and rider alerts in one place.",
      },
    ],
  }),
  component: NotificationCenterScreen,
});
