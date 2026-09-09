import { createFileRoute, redirect } from "@tanstack/react-router";
import { readSession } from "../api/core/session-store";
import { isRiderApproved, isRiderOnboarded } from "../lib/auth-guard";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const sess = readSession("rider") || readSession();
      if (!sess || !sess.token) {
        throw redirect({ to: "/auth" });
      }
      if (!isRiderOnboarded(sess)) {
        throw redirect({ to: "/registration" });
      }
      if (!isRiderApproved(sess)) {
        throw redirect({ to: "/verification" });
      }
      throw redirect({ to: "/dashboard" });
    }
    throw redirect({ to: "/" });
  },
  component: () => null,
});
