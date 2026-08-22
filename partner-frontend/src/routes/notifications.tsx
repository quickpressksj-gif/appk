import { createFileRoute } from "@tanstack/react-router";

import { NotificationsScreen } from "../screens/NotificationsScreen";
import { requirePartnerAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/notifications")({
  beforeLoad: requirePartnerAuth,
  head: () => ({
    meta: [
      { title: "Partner Notifications · QuickPress Partner" },
      { name: "description", content: "Order alerts, platform announcements and payout notices." },
      { property: "og:title", content: "Partner Notifications · QuickPress Partner" },
      { property: "og:description", content: "Order alerts, platform announcements and payout notices." },
    ],
  }),
  component: NotificationsScreen,
});
