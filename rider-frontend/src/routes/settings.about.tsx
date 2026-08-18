import { createFileRoute } from "@tanstack/react-router";

import { AboutScreen } from "../screens/settings/AboutScreen";

export const Route = createFileRoute("/settings/about")({
  head: () => ({
    meta: [
      { title: "About · QuickPress Rider" },
      { name: "description", content: "App version, build number and update check." },
      { property: "og:title", content: "About · QuickPress Rider" },
      { property: "og:description", content: "App version, build number and update check." },
    ],
  }),
  component: AboutScreen,
});
