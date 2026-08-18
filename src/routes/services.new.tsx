import { createFileRoute } from "@tanstack/react-router";

import { AddServiceScreen } from "../screens/AddServiceScreen";

export const Route = createFileRoute("/services/new")({
  head: () => ({
    meta: [
      { title: "Add Service · QuickPress Partner" },
      {
        name: "description",
        content: "Publish a new laundry or ironing service with pricing and turnaround time.",
      },
      { property: "og:title", content: "Add Service · QuickPress Partner" },
      {
        property: "og:description",
        content: "Publish a new laundry or ironing service with pricing and turnaround time.",
      },
    ],
  }),
  component: AddServiceScreen,
});
