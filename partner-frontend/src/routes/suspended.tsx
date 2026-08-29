import { createFileRoute } from "@tanstack/react-router";

import { PartnerSuspendedScreen } from "../screens/PartnerSuspendedScreen";

export const Route = createFileRoute("/suspended")({
  head: () => ({
    meta: [
      { title: "Store Suspended · QuickPress Partner" },
      {
        name: "description",
        content: "Your QuickPress Partner Store is currently suspended.",
      },
      { property: "og:title", content: "Store Suspended · QuickPress Partner" },
      {
        property: "og:description",
        content: "Your QuickPress Partner Store is currently suspended.",
      },
    ],
  }),
  component: PartnerSuspendedScreen,
});
