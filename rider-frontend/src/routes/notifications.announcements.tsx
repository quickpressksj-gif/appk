import { createFileRoute } from "@tanstack/react-router";

import { AnnouncementsScreen } from "../screens/notifications/AnnouncementsScreen";

export const Route = createFileRoute("/notifications/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements · QuickPress Rider" },
      {
        name: "description",
        content: "Campaigns, incentives, festival offers, maintenance windows and system updates.",
      },
      { property: "og:title", content: "Announcements · QuickPress Rider" },
      {
        property: "og:description",
        content: "Campaigns, incentives, festival offers, maintenance windows and system updates.",
      },
    ],
  }),
  component: AnnouncementsScreen,
});
