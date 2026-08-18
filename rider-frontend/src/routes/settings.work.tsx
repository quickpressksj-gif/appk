import { createFileRoute } from "@tanstack/react-router";

import { WorkSettingsScreen } from "../screens/settings/WorkSettingsScreen";

export const Route = createFileRoute("/settings/work")({
  head: () => ({
    meta: [
      { title: "Work Settings · QuickPress Rider" },
      { name: "description", content: "Online status, auto accept, preferred area, shift and language." },
      { property: "og:title", content: "Work Settings · QuickPress Rider" },
      { property: "og:description", content: "Online status, auto accept, preferred area, shift and language." },
    ],
  }),
  component: WorkSettingsScreen,
});
