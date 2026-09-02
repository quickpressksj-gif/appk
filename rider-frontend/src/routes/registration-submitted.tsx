import { createFileRoute } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";
import { RiderRegistrationSubmittedScreen } from "../screens/RiderRegistrationSubmittedScreen";

import { requireRiderSession } from "../lib/auth-guard";

export const Route = createFileRoute("/registration-submitted")({
  beforeLoad: requireRiderSession,
  head: () => ({
    meta: [
      { title: "Application Submitted · QuickPress Rider" },
      {
        name: "description",
        content: "Your rider application is under review. Track the verification steps here.",
      },
      { property: "og:title", content: "Application Submitted · QuickPress Rider" },
      {
        property: "og:description",
        content: "Your rider application is under review. Track the verification steps here.",
      },
    ],
  }),
  component: RiderRegistrationSubmittedScreen,
});
