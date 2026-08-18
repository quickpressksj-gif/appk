import { createFileRoute } from "@tanstack/react-router";

import { PartnerProvider } from "../context/PartnerContext";
import { NotificationsScreen } from "../screens/NotificationsScreen";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Partner Notifications · QuickPress Partner" },
      { name: "description", content: "Order, payout and incentive alerts for your store." },
      { property: "og:title", content: "Partner Notifications · QuickPress Partner" },
      { property: "og:description", content: "Order, payout and incentive alerts for your store." },
    ],
  }),
  component: () => (
    <PartnerProvider>
      <NotificationsScreen />
    </PartnerProvider>
  ),
});
