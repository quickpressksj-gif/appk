import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { readSession } from "@/api/core/session-store";
import { fetchOnboardingStatus } from "@/api/rider/rider-auth-api";
import { riderRoutes } from "../navigation/rider-routes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuickPress Captain — Starting up" },
      {
        name: "description",
        content:
          "QuickPress Captain is getting ready: checking your connection and session before taking you to delivery orders.",
      },
      { property: "og:title", content: "QuickPress Captain — Starting up" },
      {
        property: "og:description",
        content: "QuickPress Captain is getting ready before taking you to pickup and delivery tasks.",
      },
    ],
  }),
  component: CaptainSplashScreen,
});

type InitResult = {
  route: string;
};

async function initializeCaptainApp(): Promise<InitResult> {
  // Check network connectivity
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    await new Promise((resolve) => {
      window.addEventListener("online", resolve, { once: true });
    });
  }

  // Restore stored session
  const session = readSession();
  if (!session || !session.token) {
    return { route: riderRoutes.auth };
  }

  try {
    const status = await fetchOnboardingStatus();
    if (!status.isOnboarded) {
      return { route: riderRoutes.registration };
    }
    if (!status.isVerified) {
      return { route: riderRoutes.registrationSubmitted };
    }
    return { route: riderRoutes.dashboard };
  } catch {
    // If token exists, proceed to dashboard or auth as fallback
    if (session.isVerified && session.isOnboarded) {
      return { route: riderRoutes.dashboard };
    }
    return { route: riderRoutes.auth };
  }
}

function CaptainSplashScreen() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      initializeCaptainApp(),
      // Smooth 1.2s minimum splash presentation
      new Promise((resolve) => setTimeout(resolve, 1200)),
    ]).then(([result]) => {
      if (cancelled) return;
      navigate({ to: result.route });
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-between overflow-hidden bg-white px-6 py-12 select-none">
      {/* Soft brand ambient glow layers */}
      <div className="pointer-events-none absolute -top-32 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-emerald-500/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-emerald-600/8 blur-3xl" />

      <div className="h-6" />

      {/* Central Brand Mark & Animated Rings */}
      <div
        className="relative flex flex-col items-center transition-opacity duration-700"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {/* Expanding glowing radar rings */}
        <span className="pointer-events-none absolute size-44 rounded-full border-2 border-emerald-500/15 splash-ring" />
        <span className="pointer-events-none absolute size-44 rounded-full border-2 border-emerald-500/15 splash-ring [animation-delay:1.3s]" />

        {/* Wordmark Logo */}
        <div className="splash-mark relative flex flex-col items-center">
          <h1 className="text-[3.25rem] font-black leading-none tracking-[-0.05em] sm:text-[4.25rem]">
            <span className="text-zinc-950 font-black">Quick</span>
            <span className="text-emerald-600 font-black">Press</span>
          </h1>

          <div className="mt-4 flex items-center gap-2">
            <p className="splash-rise text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500">
              Captain · Pickup · Delivery
            </p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-800 border border-emerald-300">
              FLEET
            </span>
          </div>
        </div>

        {/* Animated Progress Pill */}
        <span className="splash-rise mt-8 block h-1.5 w-32 overflow-hidden rounded-full bg-zinc-100 border border-zinc-200/80">
          <span className="splash-bar block h-full w-1/3 rounded-full bg-emerald-600 shadow-sm" />
        </span>
      </div>

      {/* Bottom Footer Slogan */}
      <footer
        className="text-center transition-opacity duration-700 delay-200"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
          Fastest Laundry, Delivered · Official Captain App
        </p>
      </footer>
    </main>
  );
}
