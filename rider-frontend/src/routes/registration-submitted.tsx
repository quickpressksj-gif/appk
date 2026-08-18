import { createFileRoute } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";
import { RiderRegistrationSubmittedScreen } from "../screens/RiderRegistrationSubmittedScreen";

export const Route = createFileRoute("/registration-submitted")({
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
  component: () => (
    <RiderProvider>
      <RiderRegistrationSubmittedScreen />
    </RiderProvider>
  ),
});
