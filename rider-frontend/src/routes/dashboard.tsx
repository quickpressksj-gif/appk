import { createFileRoute } from "@tanstack/react-router";
import { RiderDashboardScreen } from "../screens/RiderDashboardScreen";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Captain Hub — QuickPress" },
      {
        name: "description",
        content: "QuickPress Captain Operations Hub & Live Dispatch",
      },
    ],
  }),
  component: RiderDashboardScreen,
});
