import { createFileRoute } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";
import { RiderRegistrationScreen } from "../screens/RiderRegistrationScreen";

export const Route = createFileRoute("/registration")({
  head: () => ({
    meta: [
      { title: "Rider Registration · QuickPress Rider" },
      { name: "description", content: "Add your profile, vehicle, documents and bank details." },
      { property: "og:title", content: "Rider Registration · QuickPress Rider" },
      { property: "og:description", content: "Add your profile, vehicle, documents and bank details." },
    ],
  }),
  component: () => (
    <RiderProvider>
      <RiderRegistrationScreen />
    </RiderProvider>
  ),
});
