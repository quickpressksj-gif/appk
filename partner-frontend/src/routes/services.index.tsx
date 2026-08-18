import { createFileRoute } from "@tanstack/react-router";

import { ManageServicesScreen } from "../screens/ManageServicesScreen";

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: [
      { title: "Manage Services · QuickPress Partner" },
      {
        name: "description",
        content: "Update your rate card, pricing, turnaround times and service availability.",
      },
      { property: "og:title", content: "Manage Services · QuickPress Partner" },
      {
        property: "og:description",
        content: "Update your rate card, pricing, turnaround times and service availability.",
      },
    ],
  }),
  component: ManageServicesScreen,
});
