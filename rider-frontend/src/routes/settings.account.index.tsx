import { createFileRoute } from "@tanstack/react-router";

import { AccountProfileScreen } from "../screens/settings/AccountProfileScreen";

export const Route = createFileRoute("/settings/account/")({
  head: () => ({
    meta: [
      { title: "Profile · QuickPress Rider" },
      { name: "description", content: "Rider information, profile photo and vehicle details." },
      { property: "og:title", content: "Profile · QuickPress Rider" },
      { property: "og:description", content: "Rider information, profile photo and vehicle details." },
    ],
  }),
  component: AccountProfileScreen,
});
