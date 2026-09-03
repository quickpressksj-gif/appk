import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { RiderSidebar } from "./RiderSidebar";
import { RiderDesktopTopBar } from "./RiderDesktopTopBar";
import { RiderBottomNav, type RiderTabId } from "../RiderBottomNav";
import { useRiderContext } from "../../context/RiderContext";

export function RiderLayout({
  children,
  activeTab = "dashboard",
  title = "Captain Hub",
  subtitle = "Accept live laundry pickups & track earnings",
  searchQuery,
  onSearchChange,
  hideBottomNav = false,
}: {
  children: ReactNode;
  activeTab?: RiderTabId;
  title?: string;
  subtitle?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  hideBottomNav?: boolean;
}) {
  const navigate = useNavigate();
  const { session, hydrating, isOnline, setOnline, signOut } = useRiderContext();

  const captainName = session?.fullName || "Delivery Captain";
  const captainId = session?.riderId || "CP-9821";

  // Strict Auth Guard: If not logged in and hydration finished, redirect to /auth
  useEffect(() => {
    if (!hydrating && !session) {
      void navigate({ to: "/auth" });
    }
  }, [hydrating, session, navigate]);

  // Initialize Google Translate globally
  useEffect(() => {
    import("../../lib/google-translate").then((m) => m.initGoogleTranslateScript());
  }, []);

  const handleToggleDuty = () => {
    // Play Web Audio chime
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(isOnline ? 440 : 880, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      /* ignore */
    }
    setOnline(!isOnline);
  };

  const handleLogout = () => {
    signOut();
    void navigate({ to: "/auth" });
  };

  if (hydrating || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500">Checking Captain session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/60 text-slate-900 font-sans">
      {/* Desktop Left Sidebar (>= md) */}
      <RiderSidebar
        captainName={captainName}
        captainId={captainId}
        isOnline={isOnline}
        onToggleStatus={handleToggleDuty}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        {/* Desktop Top Bar */}
        <RiderDesktopTopBar
          title={title}
          subtitle={subtitle}
          captainName={captainName}
          isOnline={isOnline}
          onToggleStatus={handleToggleDuty}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />

        {/* Page Children Container */}
        <main className="flex-1 pb-24 lg:pb-8">{children}</main>

        {/* Mobile Floating Glass Dock Navigation */}
        {!hideBottomNav ? <RiderBottomNav active={activeTab} /> : null}

        {/* Google Translate Hidden Engine Container */}
        <div id="google_translate_element" className="hidden" aria-hidden="true" />
      </div>
    </div>
  );
}
