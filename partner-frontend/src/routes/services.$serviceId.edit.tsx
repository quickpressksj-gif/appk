import { createFileRoute } from "@tanstack/react-router";

import { EditServiceScreen } from "../screens/EditServiceScreen";
import { requirePartnerAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/services/$serviceId/edit")({
  beforeLoad: requirePartnerAuth,
  head: () => ({
    meta: [
      { title: "Edit Service · QuickPress Partner" },
      {
        name: "description",
        content: "Change pricing, processing time, minimum order and availability for a service.",
      },
      { property: "og:title", content: "Edit Service · QuickPress Partner" },
      {
        property: "og:description",
        content: "Change pricing, processing time, minimum order and availability for a service.",
      },
    ],
  }),
  component: EditServiceRoute,
});

function EditServiceRoute() {
  const { serviceId } = Route.useParams();
  return <EditServiceScreen serviceId={serviceId} />;
}
