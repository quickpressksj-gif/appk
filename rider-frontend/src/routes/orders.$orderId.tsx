import { createFileRoute } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";
import { RiderOrderDetailsScreen } from "../screens/RiderOrderDetailsScreen";

import { requireRiderAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/orders/$orderId")({
  beforeLoad: requireRiderAuth,
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
