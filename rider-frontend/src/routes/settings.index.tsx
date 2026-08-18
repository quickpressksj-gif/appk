import { createFileRoute } from "@tanstack/react-router";

import { SettingsHomeScreen } from "../screens/settings/SettingsHomeScreen";

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [
      { title: "Settings · QuickPress Rider" },
      { name: "description", content: "Account, work, notifications, theme, security, legal and app info." },
      { property: "og:title", content: "Settings · QuickPress Rider" },
      { property: "og:description", content: "Account, work, notifications, theme, security, legal and app info." },
    ],
  }),
  component: SettingsHomeScreen,
});
