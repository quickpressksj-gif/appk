import { createFileRoute, redirect } from "@tanstack/react-router";

import { partnerRoutes } from "../navigation/partner-routes";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: partnerRoutes.auth });
  },
  head: () => ({
    meta: [
      { title: "QuickPress Partner Console" },
      { name: "description", content: "Sign in to manage your QuickPress partner store." },
      { property: "og:title", content: "QuickPress Partner Console" },
      { property: "og:description", content: "Sign in to manage your QuickPress partner store." },
    ],
  }),
  component: () => null,
});
