import { createFileRoute, Outlet } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";

export const Route = createFileRoute("/wallet")({
  component: () => (
    <RiderProvider>
      <Outlet />
    </RiderProvider>
  ),
});
