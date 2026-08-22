import { Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { Bell, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PartnerSidebar } from "./PartnerSidebar";
import { PartnerDesktopTopBar } from "./PartnerDesktopTopBar";
import { PartnerBottomNav } from "../PartnerBottomNav";
import { partnerRoutes, type PartnerTabId } from "../../navigation/partner-routes";
import { fetchPartnerProfile, toggleStoreStatus } from "../../api/partner/partner-profile-api";
import { usePartnerContext } from "../../context/PartnerContext";

export function PartnerLayout({
  children,
  activeTab,
  title,
  subtitle,
  searchQuery,
  onSearchChange,
}: {
  children: ReactNode;
  activeTab?: PartnerTabId;
  title?: string;
  subtitle?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}) {
  const navigate = useNavigate();
  const { signOut } = usePartnerContext();
  const [shopName, setShopName] = useState<string>("Store Console");
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    let alive = true;
    fetchPartnerProfile()
      .then((p) => {
        if (!alive) return;
        setShopName(p.businessName || p.ownerName || "QuickPress Partner");
        setIsOnline(p.isOnline ?? true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const handleToggleStatus = async () => {
    try {
      const next = !isOnline;
      setIsOnline(next);
      await toggleStoreStatus(next);
      toast.success(next ? "Store is now Online & accepting orders" : "Store is now Closed");
    } catch {
      setIsOnline(!isOnline);
      toast.error("Failed to update store status");
    }
  };

  const handleLogout = async () => {
    try {
      signOut();
      void navigate({ to: partnerRoutes.auth });
    } catch {
      void navigate({ to: partnerRoutes.auth });
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Left Sidebar */}
      <PartnerSidebar
        shopName={shopName}
        isOnline={isOnline}
        onToggleStatus={handleToggleStatus}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        {/* Desktop Top Bar */}
        <PartnerDesktopTopBar
          title={title}
          subtitle={subtitle}
          shopName={shopName}
          isOnline={isOnline}
          onToggleStatus={handleToggleStatus}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />

        {/* Mobile Sticky Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-background/90 px-4 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-brand-dark font-black text-sm shadow-sm">
              QP
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-foreground">{shopName}</p>
              <button
                type="button"
                onClick={handleToggleStatus}
                className="flex items-center gap-1.5 text-[10px] font-bold"
              >
                <span
                  className={`size-2 rounded-full ${
                    isOnline ? "bg-emerald-500 animate-ping inline-block" : "bg-zinc-400"
                  }`}
                />
                <span className={isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                  {isOnline ? "Open" : "Closed"}
                </span>
                <span className="text-[9px] text-muted-foreground underline ml-0.5">Change</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={partnerRoutes.notifications}
              className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-muted"
            >
              <Bell className="size-4" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 w-full pb-20 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        {activeTab ? (
          <div className="md:hidden">
            <PartnerBottomNav active={activeTab} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
