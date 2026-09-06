import { createFileRoute } from "@tanstack/react-router";
import { RiderProfileScreen } from "../screens/RiderProfileScreen";
import { requireRiderAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/profile")({
  beforeLoad: () => {
    requireRiderAuth();
  },
  head: () => ({
    meta: [
      { title: "Captain Profile — QuickPress" },
      {
        name: "description",
        content: "QuickPress Captain Account, Vehicle, KYC & Settings",
      },
    ],
  }),
  component: RiderProfileScreen,
});
