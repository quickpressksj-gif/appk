import { createFileRoute } from "@tanstack/react-router";
import { RiderOrdersScreen } from "../screens/RiderOrdersScreen";
import { requireRiderAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/orders")({
  beforeLoad: () => {
    requireRiderAuth();
  },
  head: () => ({
    meta: [
      { title: "My Orders — QuickPress Captain" },
      {
        name: "description",
        content: "QuickPress Captain Orders and Delivery History",
      },
    ],
  }),
  component: RiderOrdersScreen,
});
