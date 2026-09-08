import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CaptainLanguageSelector } from "../components/auth/CaptainLanguageSelector";
import { CaptainInstructionSlides } from "../components/auth/CaptainInstructionSlides";

export const Route = createFileRoute("/instruction")({
  head: () => ({
    meta: [
      { title: "Captain Instructions & Guidelines — QuickPress" },
      {
        name: "description",
        content: "QuickPress Captain Instructions, Guidelines and Zero-Commission Details",
      },
    ],
  }),
  component: CaptainInstructionRoute,
});

function CaptainInstructionRoute() {
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
