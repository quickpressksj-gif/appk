import { createFileRoute, redirect } from "@tanstack/react-router";

import { adminRoutes } from "../navigation/admin-routes";
import { adminHead } from "../lib/head";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: adminRoutes.auth });
  },
  head: () => adminHead("Sign in", "Sign in to the QuickPress operations console."),
  component: () => null,
});