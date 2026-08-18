import { createFileRoute } from "@tanstack/react-router";

import { CustomersScreen } from "../screens/CustomersScreen";

export const Route = createFileRoute("/customers/")({
  head: () => ({
    meta: [
      { title: "Customers · QuickPress Partner" },
      {
        name: "description",
        content:
          "Browse your customer directory with lifetime spend, order counts, membership tiers and segment filters.",
      },
      { property: "og:title", content: "Customers · QuickPress Partner" },
      {
        property: "og:description",
        content:
          "Browse your customer directory with lifetime spend, order counts, membership tiers and segment filters.",
      },
    ],
  }),
  component: CustomersScreen,
});
