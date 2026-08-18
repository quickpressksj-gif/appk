import { createFileRoute } from "@tanstack/react-router";

import { ThemeSettingsScreen } from "../screens/settings/ThemeSettingsScreen";

export const Route = createFileRoute("/settings/theme")({
  head: () => ({
    meta: [
      { title: "Theme · QuickPress Rider" },
      { name: "description", content: "Choose light, dark or system appearance for the rider app." },
      { property: "og:title", content: "Theme · QuickPress Rider" },
      { property: "og:description", content: "Choose light, dark or system appearance for the rider app." },
    ],
  }),
  component: ThemeSettingsScreen,
});
