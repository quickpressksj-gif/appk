import { createFileRoute, Outlet } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";

/** Messages layout — hosts the communication center and chat threads. */
export const Route = createFileRoute("/messages")({
  component: () => (
    <RiderProvider>
      <Outlet />
    </RiderProvider>
  ),
});
