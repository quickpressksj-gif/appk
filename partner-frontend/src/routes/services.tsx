import { createFileRoute, Outlet } from "@tanstack/react-router";

import { PartnerServicesProvider } from "../context/PartnerServicesContext";
import { requirePartnerAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/services")({
  beforeLoad: requirePartnerAuth,
  component: () => (
    <PartnerServicesProvider>
      <Outlet />
    </PartnerServicesProvider>
  ),
});
