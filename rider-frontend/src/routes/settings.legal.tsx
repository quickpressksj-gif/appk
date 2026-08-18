import { createFileRoute } from "@tanstack/react-router";

import { LegalScreen } from "../screens/settings/LegalScreen";

export const Route = createFileRoute("/settings/legal")({
  head: () => ({
    meta: [
      { title: "Legal · QuickPress Rider" },
      { name: "description", content: "Privacy policy, terms, rider agreement and help center." },
      { property: "og:title", content: "Legal · QuickPress Rider" },
      { property: "og:description", content: "Privacy policy, terms, rider agreement and help center." },
    ],
  }),
  component: LegalScreen,
});
