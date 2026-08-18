import { createFileRoute } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";
import { RiderAuthScreen } from "../screens/RiderAuthScreen";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Rider Login · QuickPress Rider" },
      { name: "description", content: "Sign in or sign up with your mobile number to start delivering." },
      { property: "og:title", content: "Rider Login · QuickPress Rider" },
      { property: "og:description", content: "Sign in or sign up with your mobile number to start delivering." },
    ],
  }),
  component: () => (
    <RiderProvider>
      <RiderAuthScreen />
    </RiderProvider>
  ),
});
