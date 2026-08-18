import { createFileRoute } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";
import { RiderProfileScreen } from "../screens/RiderProfileScreen";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Rider Profile · QuickPress Rider" },
      { name: "description", content: "Personal, vehicle, bank details, documents and KYC status." },
      { property: "og:title", content: "Rider Profile · QuickPress Rider" },
      { property: "og:description", content: "Personal, vehicle, bank details, documents and KYC status." },
    ],
  }),
  component: () => (
    <RiderProvider>
      <RiderProfileScreen />
    </RiderProvider>
  ),
});
