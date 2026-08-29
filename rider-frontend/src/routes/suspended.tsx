import { createFileRoute } from "@tanstack/react-router";

import { RiderSuspendedScreen } from "../screens/RiderSuspendedScreen";

export const Route = createFileRoute("/suspended")({
  head: () => ({
    meta: [
      { title: "Account Suspended · QuickPress Captain" },
      {
        name: "description",
        content: "Your QuickPress Captain account is currently suspended.",
      },
      { property: "og:title", content: "Account Suspended · QuickPress Captain" },
      {
        property: "og:description",
        content: "Your QuickPress Captain account is currently suspended.",
      },
    ],
  }),
  component: RiderSuspendedScreen,
});
