import { createFileRoute } from "@tanstack/react-router";

import { PartnerProvider } from "../context/PartnerContext";
import { AnnouncementsScreen } from "../screens/AnnouncementsScreen";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements · QuickPress Partner" },
      {
        name: "description",
        content: "Platform updates, maintenance notices, campaigns and festival offers.",
      },
      { property: "og:title", content: "Announcements · QuickPress Partner" },
      {
        property: "og:description",
        content: "Platform updates, maintenance notices, campaigns and festival offers.",
      },
    ],
  }),
  component: () => (
    <PartnerProvider>
      <AnnouncementsScreen />
    </PartnerProvider>
  ),
});