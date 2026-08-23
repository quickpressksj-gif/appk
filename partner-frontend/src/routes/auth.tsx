import { createFileRoute } from "@tanstack/react-router";

import { PartnerAuthScreen } from "../screens/PartnerAuthScreen";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Partner Login · QuickPress Partner" },
      { name: "description", content: "Sign in to your QuickPress partner store." },
      { property: "og:title", content: "Partner Login · QuickPress Partner" },
      { property: "og:description", content: "Sign in to your QuickPress partner store." },
    ],
  }),
  component: PartnerAuthScreen,
});
