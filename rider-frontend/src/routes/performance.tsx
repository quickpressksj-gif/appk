import { createFileRoute } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";
import { PerformanceScreen } from "../screens/history/PerformanceScreen";

import { requireRiderAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/performance")({
  beforeLoad: requireRiderAuth,
  head: () => ({
    meta: [
      { title: "Performance · QuickPress Rider" },
      { name: "description", content: "Ratings, on-time percentage, streaks and achievements." },
      { property: "og:title", content: "Performance · QuickPress Rider" },
      { property: "og:description", content: "Ratings, on-time percentage, streaks and achievements." },
    ],
  }),
  component: () => (
    <RiderProvider>
      <PerformanceScreen />
    </RiderProvider>
  ),
});
