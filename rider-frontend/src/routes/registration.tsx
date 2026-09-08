import { createFileRoute, redirect } from "@tanstack/react-router";
import { RiderRegistrationScreen } from "../screens/RiderRegistrationScreen";
import { readSession } from "../api/core/session-store";
import { isRiderApproved, isRiderOnboarded } from "../lib/auth-guard";

export const Route = createFileRoute("/registration")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const sess = readSession("rider") || readSession();

    // If no session, redirect to auth
    if (!sess || !sess.token) {
      throw redirect({ to: "/auth" });
    }

    // If already approved, DO NOT open registration form -> go to dashboard!
    if (isRiderApproved(sess)) {
      throw redirect({ to: "/dashboard" });
    }

    // If already submitted registration -> go to verification page!
    if (isRiderOnboarded(sess)) {
      throw redirect({ to: "/verification" });
    }
  },
  head: () => ({
    meta: [
      { title: "Captain Registration — QuickPress" },
      {
        name: "description",
        content: "QuickPress Captain Delivery Partner KYC & Registration",
      },
    ],
  }),
  component: RiderRegistrationScreen,
});
