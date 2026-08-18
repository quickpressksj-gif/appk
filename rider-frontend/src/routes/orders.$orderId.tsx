import { createFileRoute } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";
import { RiderOrderDetailsScreen } from "../screens/RiderOrderDetailsScreen";

export const Route = createFileRoute("/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Order Details · QuickPress Rider" },
      { name: "description", content: "Customer, partner, addresses and OTP verification for the trip." },
      { property: "og:title", content: "Order Details · QuickPress Rider" },
      { property: "og:description", content: "Customer, partner, addresses and OTP verification for the trip." },
    ],
  }),
  component: () => (
    <RiderProvider>
      <RiderOrderDetailsScreen />
    </RiderProvider>
  ),
});
