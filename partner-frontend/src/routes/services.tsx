import { createFileRoute, Outlet } from "@tanstack/react-router";

import { PartnerProvider } from "../context/PartnerContext";
import { PartnerServicesProvider } from "../context/PartnerServicesContext";

export const Route = createFileRoute("/services")({
  component: () => (
    <PartnerProvider>
      <PartnerServicesProvider>
        {/* Required: /services, /services/new and /services/$serviceId/edit render here. */}
        <Outlet />
      </PartnerServicesProvider>
    </PartnerProvider>
  ),
});
