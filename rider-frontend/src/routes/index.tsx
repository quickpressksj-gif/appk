import { createFileRoute, redirect } from "@tanstack/react-router";

import { riderRoutes } from "../navigation/rider-routes";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: riderRoutes.auth });
  },
  head: () => ({
    meta: [
      { title: "QuickPress Rider App" },
      { name: "description", content: "Sign in to pick up and deliver QuickPress orders." },
      { property: "og:title", content: "QuickPress Rider App" },
      { property: "og:description", content: "Sign in to pick up and deliver QuickPress orders." },
    ],
  }),
  component: () => null,
});
