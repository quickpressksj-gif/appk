import { createFileRoute } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";
import { RiderDashboardScreen } from "../screens/RiderDashboardScreen";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Rider Dashboard · QuickPress Rider" },
      { name: "description", content: "Today's deliveries, earnings and pending pickups at a glance." },
      { property: "og:title", content: "Rider Dashboard · QuickPress Rider" },
      { property: "og:description", content: "Today's deliveries, earnings and pending pickups at a glance." },
    ],
  }),
  component: () => (
    <RiderProvider>
      <RiderDashboardScreen />
    </RiderProvider>
  ),
});
