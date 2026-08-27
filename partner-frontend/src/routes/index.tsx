import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { readSession } from "../api/core/session-store";
import { restorePartnerSession } from "../api/partner/partner-auth-api";
import { partnerRoutes } from "../navigation/partner-routes";
import { PartnerAuthHeader } from "../components/PartnerAuthHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuickPress Partner Console" },
      { name: "description", content: "Manage your QuickPress partner store." },
      { property: "og:title", content: "QuickPress Partner Console" },
      { property: "og:description", content: "Manage your QuickPress partner store." },
    ],
  }),
  component: PartnerSplashScreen,
});

function PartnerSplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      // 1. Instant check from localStorage
      const syncSession = readSession("partner");
      if (syncSession && syncSession.token) {
        if (syncSession.account && syncSession.account.isOnboarded === false) {
          navigate({ to: partnerRoutes.registration });
        } else {
          navigate({ to: partnerRoutes.dashboard });
        }
        return;
      }

      // 2. Async restore check
      try {
        const restored = await restorePartnerSession();
        if (cancelled) return;
        if (restored && restored.partnerId) {
          if (restored.isOnboarded === false) {
            navigate({ to: partnerRoutes.registration });
          } else {
            navigate({ to: partnerRoutes.dashboard });
          }
        } else {
          navigate({ to: partnerRoutes.auth });
        }
      } catch {
        if (!cancelled) navigate({ to: partnerRoutes.auth });
      }
    }

    void checkAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFFBF2] p-6 text-[#111827]">
      <PartnerAuthHeader badge="PARTNER" withTagline={true} />
    </div>
  );
}
