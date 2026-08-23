import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requirePartnerAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/services")({
  beforeLoad: requirePartnerAuth,
  component: () => <Outlet />,
});
