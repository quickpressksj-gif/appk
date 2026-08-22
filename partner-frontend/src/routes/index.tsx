import { createFileRoute, redirect } from "@tanstack/react-router";

import { partnerRoutes } from "../navigation/partner-routes";
import { readSession } from "../api/core/session-store";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const session = readSession("partner");
    if (session && session.token) {
      throw redirect({ to: partnerRoutes.dashboard });
    }
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
