import { createFileRoute } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";
import { LiveNavigationScreen } from "../screens/LiveNavigationScreen";

export const Route = createFileRoute("/live-navigation/$deliveryId")({
  head: () => ({
    meta: [
      { title: "Live Navigation · QuickPress Rider" },
      {
        name: "description",
        content:
          "Full screen navigation with pickup and drop markers, ETA, traffic insight and trip actions.",
      },
      { property: "og:title", content: "Live Navigation · QuickPress Rider" },
      {
        property: "og:description",
        content:
          "Full screen navigation with pickup and drop markers, ETA, traffic insight and trip actions.",
      },
    ],
  }),
  component: () => (
    <RiderProvider>
      <LiveNavigationScreen />
    </RiderProvider>
  ),
});
