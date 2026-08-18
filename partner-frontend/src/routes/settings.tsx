import { createFileRoute } from "@tanstack/react-router";

import { PartnerProvider } from "../context/PartnerContext";
import { BusinessSettingsScreen } from "../screens/BusinessSettingsScreen";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Business Settings · QuickPress Partner" },
      { name: "description", content: "Store availability, hours and operational limits." },
      { property: "og:title", content: "Business Settings · QuickPress Partner" },
      { property: "og:description", content: "Store availability, hours and operational limits." },
    ],
  }),
  component: () => (
    <PartnerProvider>
      <BusinessSettingsScreen />
    </PartnerProvider>
  ),
});
