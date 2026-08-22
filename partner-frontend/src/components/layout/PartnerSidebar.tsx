import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  HelpCircle,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Settings2,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

import { partnerRoutes, partnerSidebarLinks } from "../../navigation/partner-routes";

export function PartnerSidebar({
  shopName,
  isOnline,
  onToggleStatus,
  onLogout,
}: {
  shopName?: string;
  isOnline?: boolean;
  onToggleStatus?: () => void;
  onLogout?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border/80 bg-card/95 backdrop-blur-md transition-all duration-300 md:flex lg:w-72">
      {/* Brand Header */}
      <div className="flex h-20 items-center gap-3 border-b border-border/60 px-6">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-primary to-yellow-300 text-brand-dark shadow-md font-black text-xl tracking-tighter">
          QP
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-foreground text-sm tracking-tight">QuickPress</span>
            <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-brand-dark tracking-wide">
              Partner
            </span>
          </div>
          <p className="truncate text-xs font-semibold text-muted-foreground">
            {shopName || "Store Console"}
          </p>
        </div>
      </div>

      {/* Store status card */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/40 p-3">
          <div className="flex items-center gap-2.5">
            <span
              className={`size-2.5 rounded-full ${
                isOnline ? "bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" : "bg-zinc-400"
              }`}
            />
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Store Status
              </p>
              <p className="text-xs font-bold text-foreground">
                {isOnline ? "Accepting Orders" : "Store Closed"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleStatus}
            aria-label="Toggle store online status"
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isOnline ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isOnline ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4 scrollbar-thin">
        <div className="px-2 pb-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/70">
          Operations
        </div>
        {partnerSidebarLinks.slice(0, 6).map((link) => {
          const isActive = pathname === link.to || pathname.startsWith(`${link.to}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.id}
              to={link.to}
              className={`group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200 ${
                isActive
                  ? "bg-primary text-brand-dark shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon
                className={`size-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? "text-brand-dark" : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              <span className="flex-1 truncate">{link.label}</span>
            </Link>
          );
        })}

        <div className="pt-3 px-2 pb-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/70">
          Management
        </div>
        {partnerSidebarLinks.slice(6).map((link) => {
          const isActive = pathname === link.to || pathname.startsWith(`${link.to}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.id}
              to={link.to}
              className={`group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200 ${
                isActive
                  ? "bg-primary text-brand-dark shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon
                className={`size-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? "text-brand-dark" : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              <span className="flex-1 truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Account */}
      <div className="border-t border-border/70 p-4 space-y-2">
        <Link
          to={partnerRoutes.profile}
          className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-muted"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-brand-dark font-bold text-xs">
            {shopName ? shopName.slice(0, 2).toUpperCase() : "QP"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-foreground">
              {shopName || "Partner Account"}
            </p>
            <p className="text-[10px] text-muted-foreground">Manage profile</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="size-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
