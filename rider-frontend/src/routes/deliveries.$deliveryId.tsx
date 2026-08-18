import { createFileRoute } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";
import { DeliveryDetailsScreen } from "../screens/DeliveryDetailsScreen";

export const Route = createFileRoute("/deliveries/$deliveryId")({
  head: () => ({
    meta: [
      { title: "Delivery Details · QuickPress Rider" },
      {
        name: "description",
        content:
          "Customer, partner, services, timeline, instructions and payment details for a delivery.",
      },
      { property: "og:title", content: "Delivery Details · QuickPress Rider" },
      {
        property: "og:description",
        content:
          "Customer, partner, services, timeline, instructions and payment details for a delivery.",
      },
    ],
  }),
  component: () => (
    <RiderProvider>
      <DeliveryDetailsScreen />
    </RiderProvider>
  ),
});
