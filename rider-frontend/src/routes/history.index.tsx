import { createFileRoute } from "@tanstack/react-router";

import { DeliveryHistoryScreen } from "../screens/history/DeliveryHistoryScreen";

export const Route = createFileRoute("/history/")({
  head: () => ({
    meta: [
      { title: "Delivery History · QuickPress Rider" },
      { name: "description", content: "Completed and cancelled trips with earnings, distance and ratings." },
      { property: "og:title", content: "Delivery History · QuickPress Rider" },
      { property: "og:description", content: "Completed and cancelled trips with earnings, distance and ratings." },
    ],
  }),
  component: DeliveryHistoryScreen,
});
