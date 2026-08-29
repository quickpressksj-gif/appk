import { createFileRoute } from "@tanstack/react-router";

import { RiderDashboardScreen } from "../screens/RiderDashboardScreen";
import { requireRiderAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireRiderAuth,
  head: () => ({
    meta: [
      { title: "Rider Dashboard · QuickPress Rider" },
      { name: "description", content: "Today's deliveries, earnings and pending pickups at a glance." },
      { property: "og:title", content: "Rider Dashboard · QuickPress Rider" },
      { property: "og:description", content: "Today's deliveries, earnings and pending pickups at a glance." },
    ],
  }),
  component: RiderDashboardScreen,
});
