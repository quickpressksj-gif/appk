import { createFileRoute } from "@tanstack/react-router";

import { PerformanceInsightsScreen } from "../screens/analytics/PerformanceInsightsScreen";

const TITLE = "Performance Insights · QuickPress Rider";
const DESCRIPTION =
  "Best working hours, best areas, profitable zones and improvement suggestions for riders.";

export const Route = createFileRoute("/analytics/insights")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: PerformanceInsightsScreen,
});
