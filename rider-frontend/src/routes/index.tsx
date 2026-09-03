import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { readSession } from "../api/core/session-store";
import { QuickPressCaptainLogo } from "../components/QuickPressCaptainLogo";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuickPress Captain" },
      {
        name: "description",
        content: "QuickPress Captain — Delivery Partner App",
      },
    ],
  }),
  component: CaptainRootSplash,
});

function CaptainRootSplash() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const timer = setTimeout(() => {
      if (!active) return;
      const sess = readSession("rider") || readSession();

      if (sess && sess.token) {
        if (sess.isOnboarded === false && sess.account?.isOnboarded === false) {
          void navigate({ to: "/onboarding" });
        } else {
          void navigate({ to: "/dashboard" });
        }
      } else {
        void navigate({ to: "/auth" });
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <main className="min-h-dvh bg-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <QuickPressCaptainLogo variant="stacked" size="lg" />
      <div className="mt-8 flex items-center gap-2 text-xs font-bold text-slate-400">
        <Loader2 className="size-4 animate-spin text-emerald-600" />
        <span>Starting QuickPress Captain...</span>
      </div>
    </main>
  );
}
