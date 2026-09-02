import { createFileRoute } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";
import { RiderProfileScreen } from "../screens/RiderProfileScreen";

import { requireRiderAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/profile")({
  beforeLoad: requireRiderAuth,
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
