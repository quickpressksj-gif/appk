import { createFileRoute } from "@tanstack/react-router";

import { PartnerProvider } from "../context/PartnerContext";
import { PartnerSettingsScreen } from "../screens/PartnerSettingsScreen";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · QuickPress Partner" },
      {
        name: "description",
        content:
          "Manage your partner account, business hours, notifications, appearance, security and documents.",
      },
      { property: "og:title", content: "Settings · QuickPress Partner" },
      {
        property: "og:description",
        content:
          "Manage your partner account, business hours, notifications, appearance, security and documents.",
      },
    ],
  }),
  component: () => (
    <PartnerProvider>
      <PartnerSettingsScreen />
    </PartnerProvider>
  ),
});
