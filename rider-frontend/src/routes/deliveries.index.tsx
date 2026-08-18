import { createFileRoute } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";
import { DeliveryManagementScreen } from "../screens/DeliveryManagementScreen";

export const Route = createFileRoute("/deliveries/")({
  head: () => ({
    meta: [
      { title: "Delivery Management · QuickPress Rider" },
      {
        name: "description",
        content:
          "Manage new, accepted, picked up and delivered orders with search, filters and live status actions.",
      },
      { property: "og:title", content: "Delivery Management · QuickPress Rider" },
      {
        property: "og:description",
        content:
          "Manage new, accepted, picked up and delivered orders with search, filters and live status actions.",
      },
    ],
  }),
  component: () => (
    <RiderProvider>
      <DeliveryManagementScreen />
    </RiderProvider>
  ),
});
