import { createFileRoute } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";
import { AssignedOrdersScreen } from "../screens/AssignedOrdersScreen";

import { requireRiderAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/orders/")({
  beforeLoad: requireRiderAuth,
  head: () => ({
    meta: [
      { title: "Assigned Orders · QuickPress Rider" },
      { name: "description", content: "Accept or reject assigned pickup and delivery orders." },
      { property: "og:title", content: "Assigned Orders · QuickPress Rider" },
      { property: "og:description", content: "Accept or reject assigned pickup and delivery orders." },
    ],
  }),
  component: () => (
    <RiderProvider>
      <AssignedOrdersScreen />
    </RiderProvider>
  ),
});
