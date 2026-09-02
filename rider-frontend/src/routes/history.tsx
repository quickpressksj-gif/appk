import { createFileRoute, Outlet } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";

import { requireRiderAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/history")({
  beforeLoad: requireRiderAuth,
  component: () => (
    <RiderProvider>
      <Outlet />
    </RiderProvider>
  ),
});
