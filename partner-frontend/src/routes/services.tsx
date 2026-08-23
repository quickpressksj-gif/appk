import { createFileRoute } from "@tanstack/react-router";

import { ManageServicesScreen } from "../screens/ManageServicesScreen";
import { requirePartnerAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/services")({
  beforeLoad: requirePartnerAuth,
  component: ManageServicesScreen,
});
