import { createFileRoute } from "@tanstack/react-router";
import { RiderAuthScreen } from "../screens/RiderAuthScreen";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Captain Login — QuickPress" },
      {
        name: "description",
        content: "QuickPress Captain Delivery Partner Login Portal",
      },
    ],
  }),
  component: RiderAuthScreen,
});
