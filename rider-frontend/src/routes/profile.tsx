import { createFileRoute } from "@tanstack/react-router";
import { RiderProfileScreen } from "../screens/RiderProfileScreen";

export const Route = createFileRoute("/profile")({
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
