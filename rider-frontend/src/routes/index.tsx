import { createFileRoute, redirect } from "@tanstack/react-router";
import { RiderAuthScreen } from "../screens/RiderAuthScreen";
import { readSession } from "../api/core/session-store";
import { isRiderApproved, isRiderOnboarded } from "../lib/auth-guard";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const sess = readSession("rider") || readSession();
      if (sess && sess.token) {
        if (isRiderApproved(sess)) {
          throw redirect({ to: "/dashboard" });
        }
        if (isRiderOnboarded(sess)) {
          throw redirect({ to: "/verification" });
        }
        throw redirect({ to: "/registration" });
      }
    }
  },
  head: () => ({
    meta: [
      { title: "QuickPress Captain — Delivery Partner" },
      {
        name: "description",
        content: "QuickPress Captain — Delivery Partner App with Zero Commission",
      },
    ],
  }),
  component: RiderAuthScreen,
});
