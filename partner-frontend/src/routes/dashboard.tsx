import { createFileRoute } from "@tanstack/react-router";

import { PartnerProvider } from "../context/PartnerContext";
import { PartnerOrdersProvider } from "../context/PartnerOrdersContext";
import { PartnerDashboardScreen } from "../screens/PartnerDashboardScreen";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Partner Dashboard · QuickPress Partner" },
      { name: "description", content: "Track live orders, capacity and earnings at a glance." },
      { property: "og:title", content: "Partner Dashboard · QuickPress Partner" },
      { property: "og:description", content: "Track live orders, capacity and earnings at a glance." },
    ],
  }),
  component: () => (
    <PartnerProvider>
      <PartnerOrdersProvider>
        <PartnerDashboardScreen />
      </PartnerOrdersProvider>
    </PartnerProvider>
  ),
});
