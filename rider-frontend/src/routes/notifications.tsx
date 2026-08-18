import { createFileRoute, Outlet } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";

/** Notifications layout — hosts the center, settings and announcements routes. */
export const Route = createFileRoute("/notifications")({
  component: () => (
    <RiderProvider>
      <Outlet />
    </RiderProvider>
  ),
});
