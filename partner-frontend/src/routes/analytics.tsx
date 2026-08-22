import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsScreen } from "../screens/AnalyticsScreen";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsScreen,
});
