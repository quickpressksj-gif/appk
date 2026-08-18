import { createFileRoute, Outlet } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";

export const Route = createFileRoute("/history")({
  component: () => (
    <RiderProvider>
      <Outlet />
    </RiderProvider>
  ),
});
