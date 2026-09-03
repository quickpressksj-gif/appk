import { createFileRoute } from "@tanstack/react-router";
import { RiderOrdersScreen } from "../screens/RiderOrdersScreen";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "Delivery Orders — QuickPress Captain" },
      {
        name: "description",
        content: "QuickPress Captain Assigned Orders & Tasks",
      },
    ],
  }),
  component: RiderOrdersScreen,
});
