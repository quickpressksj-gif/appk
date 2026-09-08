import { createFileRoute, redirect } from "@tanstack/react-router";
import { readSession } from "../api/core/session-store";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const sess = readSession("rider") || readSession();
      if (sess && sess.token) {
        throw redirect({ to: "/dashboard" });
      }
    }
    throw redirect({ to: "/" });
  },
  component: () => null,
});
