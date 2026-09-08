import React, { useState } from "react";
import { Bell, MapPin, Menu, Volume2, VolumeX } from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import { isAudioMuted, toggleAudioMuted } from "../../lib/captain-audio";
import { toast } from "sonner";

interface CaptainTopBarProps {
  isOnline: boolean;
  onToggleDuty: () => void;
  onOpenDrawer: () => void;
  onOpenNotifications?: () => void;
  notificationCount?: number;
  loading?: boolean;
}

export const CaptainTopBar: React.FC<CaptainTopBarProps> = ({
  isOnline,
  onToggleDuty,
  onOpenDrawer,
  onOpenNotifications,
  notificationCount = 0,
  loading = false,
}) => {
  const { t } = useLanguage();
  const [muted, setMuted] = useState(() => isAudioMuted());

  const handleToggleSound = () => {
    const next = toggleAudioMuted();
    setMuted(next);
    toast.info(next ? "Audio Alerts Muted 🔇" : "Audio Alerts Active 🔊");
  };

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-3.5 pb-2.5 bg-white border-b border-neutral-100 shadow-xs select-none"
      style={{ paddingTop: "max(env(safe-area-inset-top, 0px) + 8px, 12px)" }}
    >
      {/* Left: Hamburger Menu */}
      <button
        type="button"
        onClick={onOpenDrawer}
        aria-label="Open Navigation Menu"
        className="flex items-center justify-center w-10 h-10 -ml-1 text-neutral-800 rounded-full hover:bg-neutral-50 active:scale-95 transition-transform"
      >
        <Menu className="w-6 h-6 stroke-[2.4]" />
      </button>

      {/* Center: Duty Toggle Switch (OFF DUTY ○ / ON DUTY ●) */}
      <button
        type="button"
        disabled={loading}
        onClick={onToggleDuty}
        className={`relative flex items-center justify-between h-9.5 px-3 min-w-[135px] rounded-full transition-all duration-300 border ${
          isOnline
            ? "bg-[#E6F8EE] border-[#10B981] text-[#15803D]"
            : "bg-white border-neutral-300 text-neutral-600 shadow-xs"
        } ${loading ? "opacity-75 cursor-not-allowed" : "active:scale-95 cursor-pointer"}`}
      >
        <span className="text-xs font-black tracking-wider uppercase">
          {loading ? "..." : isOnline ? t("dash.onDuty", "ON DUTY") : t("dash.offDuty", "OFF DUTY")}
        </span>

        {/* Switch Toggle Dot */}
        <div
          className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 shadow-xs ${
            isOnline
              ? "bg-[#00C853] text-white shadow-[#00C853]/30 ml-2"
              : "bg-neutral-400 text-white ml-2"
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-white" />
        </div>
      </button>

      {/* Right: Audio Control, Location & Notifications */}
      <div className="flex items-center gap-1.5 -mr-1">
        {/* Sound Toggle Button (Tap to mute/unmute bike audio) */}
        <button
          type="button"
          onClick={handleToggleSound}
          aria-label={muted ? "Unmute Audio" : "Mute Audio"}
          className={`relative flex items-center justify-center w-8.5 h-8.5 rounded-full transition-all active:scale-95 ${
            muted
              ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
          title={muted ? "Audio Alerts Muted" : "Audio Alerts Active"}
        >
          {muted ? (
            <VolumeX className="w-4.5 h-4.5 stroke-[2.4]" />
          ) : (
            <Volume2 className="w-4.5 h-4.5 stroke-[2.4]" />
          )}
        </button>

        <button
          type="button"
          aria-label="Current Location"
          className="flex items-center justify-center w-8.5 h-8.5 text-neutral-800 rounded-full hover:bg-neutral-50 active:scale-95 transition-transform"
        >
          <MapPin className="w-4.5 h-4.5 text-neutral-800 stroke-[2.2] fill-neutral-800" />
        </button>

        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label="Notifications"
          className="relative flex items-center justify-center w-8.5 h-8.5 text-neutral-800 rounded-full hover:bg-neutral-50 active:scale-95 transition-transform"
        >
          <Bell className="w-4.5 h-4.5 text-neutral-800 stroke-[2.2] fill-neutral-800" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-black text-white bg-red-600 rounded-full border-2 border-white shadow-xs">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
