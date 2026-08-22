import { createFileRoute } from "@tanstack/react-router";

import { AnalyticsScreen } from "../screens/AnalyticsScreen";
import { requirePartnerAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/analytics")({
  beforeLoad: requirePartnerAuth,
  head: () => ({
    meta: [
      { title: "Partner Analytics · QuickPress Partner" },
      { name: "description", content: "Growth metrics, order heatmaps and operational bottlenecks." },
      { property: "og:title", content: "Partner Analytics · QuickPress Partner" },
      { property: "og:description", content: "Growth metrics, order heatmaps and operational bottlenecks." },
    ],
  }),
  component: AnalyticsScreen,
});
