import { Link } from "@tanstack/react-router";
import { Bell, Search, ShieldCheck, Sparkles, Store } from "lucide-react";

import { partnerRoutes } from "../../navigation/partner-routes";

export function PartnerDesktopTopBar({
  title,
  subtitle,
  shopName,
  isOnline,
  onToggleStatus,
  unreadCount = 0,
  searchQuery = "",
  onSearchChange,
}: {
  title?: string;
  subtitle?: string;
  shopName?: string;
  isOnline?: boolean;
  onToggleStatus?: () => void;
  unreadCount?: number;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}) {
  return (
    <header className="sticky top-0 z-20 hidden h-20 items-center justify-between border-b border-border/80 bg-background/85 px-8 backdrop-blur-md md:flex">
      {/* Title & Subtitle or Search */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">
          {title || "Dashboard"}
        </h1>
        {subtitle ? (
          <p className="text-xs font-semibold text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {onSearchChange ? (
          <div className="relative w-64 lg:w-80">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search orders, customers, services..."
              className="h-10 w-full rounded-2xl border border-border bg-card pl-10 pr-4 text-xs font-medium text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        ) : null}

        {/* Store Live Status Pill */}
        <button
          type="button"
          onClick={onToggleStatus}
          className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
            isOnline
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-border bg-muted text-muted-foreground"
          }`}
        >
          <span
            className={`size-2 rounded-full ${
              isOnline ? "bg-emerald-500 animate-ping inline-block" : "bg-zinc-400"
            }`}
          />
          <span>{isOnline ? "Store Online" : "Store Offline"}</span>
        </button>

        {/* Notifications */}
        <Link
          to={partnerRoutes.notifications}
          className="relative flex size-10 items-center justify-center rounded-2xl border border-border bg-card text-foreground transition-colors hover:bg-muted"
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-black text-white">
              {unreadCount}
            </span>
          ) : null}
        </Link>

        {/* Profile Avatar */}
        <Link
          to={partnerRoutes.profile}
          className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card p-1.5 pr-3 transition-colors hover:bg-muted"
        >
          <div className="flex size-7 items-center justify-center rounded-xl bg-primary/25 font-bold text-xs text-brand-dark">
            {shopName ? shopName.slice(0, 1).toUpperCase() : "P"}
          </div>
          <span className="text-xs font-bold text-foreground max-w-[120px] truncate">
            {shopName || "Partner"}
          </span>
        </Link>
      </div>
    </header>
  );
}
