import { createFileRoute } from "@tanstack/react-router";

import { SecuritySettingsScreen } from "../screens/settings/SecuritySettingsScreen";

export const Route = createFileRoute("/settings/security")({
  head: () => ({
    meta: [
      { title: "Security · QuickPress Rider" },
      { name: "description", content: "Device sessions, password, two-factor authentication and privacy." },
      { property: "og:title", content: "Security · QuickPress Rider" },
      { property: "og:description", content: "Device sessions, password, two-factor authentication and privacy." },
    ],
  }),
  component: SecuritySettingsScreen,
});
