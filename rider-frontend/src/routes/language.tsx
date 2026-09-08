import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CaptainLanguageSelector } from "../components/auth/CaptainLanguageSelector";

export const Route = createFileRoute("/language")({
  head: () => ({
    meta: [
      { title: "Select Language — QuickPress Captain" },
      {
        name: "description",
        content: "Select your preferred language for QuickPress Captain",
      },
    ],
  }),
  component: CaptainLanguageRoute,
});

function CaptainLanguageRoute() {
  const navigate = useNavigate();

  return (
    <CaptainLanguageSelector
      onBack={() => navigate({ to: "/" })}
      onProceed={() => navigate({ to: "/" })}
    />
  );
}
