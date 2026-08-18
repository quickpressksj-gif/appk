import { createFileRoute } from "@tanstack/react-router";

import { AnalyticsDashboardScreen } from "../screens/analytics/AnalyticsDashboardScreen";

const TITLE = "Analytics · QuickPress Rider";
const DESCRIPTION =
  "Earnings, deliveries, distance, online hours and quality scores with trend charts and goals.";

export const Route = createFileRoute("/analytics/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: AnalyticsDashboardScreen,
});
