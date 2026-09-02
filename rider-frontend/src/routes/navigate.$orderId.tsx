import { createFileRoute } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";
import { RiderNavigationScreen } from "../screens/RiderNavigationScreen";

import { requireRiderAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/navigate/$orderId")({
  beforeLoad: requireRiderAuth,
  head: () => ({
    meta: [
      { title: "Navigation · QuickPress Rider" },
      { name: "description", content: "Full screen route with live ETA, distance and trip controls." },
      { property: "og:title", content: "Navigation · QuickPress Rider" },
      { property: "og:description", content: "Full screen route with live ETA, distance and trip controls." },
    ],
  }),
  component: () => (
    <RiderProvider>
      <RiderNavigationScreen />
    </RiderProvider>
  ),
});
