import { createFileRoute } from "@tanstack/react-router";

import { PartnerProvider } from "../context/PartnerContext";
import { AnalyticsScreen } from "../screens/AnalyticsScreen";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics & Reports · QuickPress Partner" },
      {
        name: "description",
        content: "Revenue trends, order volume, customer growth and downloadable store reports.",
      },
      { property: "og:title", content: "Analytics & Reports · QuickPress Partner" },
      {
        property: "og:description",
        content: "Revenue trends, order volume, customer growth and downloadable store reports.",
      },
    ],
  }),
  component: () => (
    <PartnerProvider>
      <AnalyticsScreen />
    </PartnerProvider>
  ),
});