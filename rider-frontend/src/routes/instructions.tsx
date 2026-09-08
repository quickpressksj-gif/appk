import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CaptainLanguageSelector } from "../components/auth/CaptainLanguageSelector";
import { CaptainInstructionSlides } from "../components/auth/CaptainInstructionSlides";

export const Route = createFileRoute("/instructions")({
  head: () => ({
    meta: [
      { title: "Captain Instructions & Benefits — QuickPress" },
      {
        name: "description",
        content: "QuickPress Captain Instructions, Benefits and Zero-Commission Details",
      },
    ],
  }),
  component: CaptainInstructionsRoute,
});

function CaptainInstructionsRoute() {
  const navigate = useNavigate();
  const [showLanguage, setShowLanguage] = useState(false);

  if (showLanguage) {
    return (
      <CaptainLanguageSelector
        onBack={() => setShowLanguage(false)}
        onProceed={() => setShowLanguage(false)}
      />
    );
  }

  return (
    <CaptainInstructionSlides
      onChangeLanguage={() => setShowLanguage(true)}
      onComplete={() => navigate({ to: "/" })}
    />
  );
}
