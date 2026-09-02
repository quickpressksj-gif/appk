import { Outlet, createFileRoute } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";
import { RiderSettingsProvider } from "../context/RiderSettingsContext";

import { requireRiderAuth } from "../lib/auth-guard";

/** Settings layout — provides rider session + settings store to every child route. */
export const Route = createFileRoute("/settings")({
  beforeLoad: requireRiderAuth,
  head: () => ({
    meta: [
      { title: "Settings · QuickPress Rider" },
      {
        name: "description",
        content: "Account, work preferences, notifications, theme, security and legal.",
      },
      { property: "og:title", content: "Settings · QuickPress Rider" },
      {
        property: "og:description",
        content: "Account, work preferences, notifications, theme, security and legal.",
      },
    ],
  }),
  component: () => (
    <RiderProvider>
      <RiderSettingsProvider>
        <Outlet />
      </RiderSettingsProvider>
    </RiderProvider>
  ),
});
