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
  hideBottomNav = false,
}: {
  children: ReactNode;
  activeTab?: PartnerTabId;
  title?: string;
  subtitle?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  hideBottomNav?: boolean;
}) {
  const navigate = useNavigate();
  const { session, hydrating, signOut } = usePartnerContext();
  const [shopName, setShopName] = useState<string>("QuickPress Partner");
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Strict Auth Guard: If not logged in, redirect to login screen
  useEffect(() => {
    if (!hydrating && !session) {
      void navigate({ to: partnerRoutes.auth });
    }
  }, [hydrating, session, navigate]);

  useEffect(() => {
    if (!session) return;
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
  }, [session]);

  const handleToggleStatus = async () => {
    try {
      const next = !isOnline;
      setIsOnline(next);
      await toggleStoreStatus(next);
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

  // Show loading indicator while checking authentication session
  if (hydrating || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs font-bold text-muted-foreground">Checking store session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Left Sidebar (>= md) */}
      <PartnerSidebar
        shopName={shopName}
        isOnline={isOnline}
        onToggleStatus={handleToggleStatus}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        {/* Desktop Top Bar (>= md) */}
        <PartnerDesktopTopBar
          title={title}
          subtitle={subtitle}
          shopName={shopName}
          isOnline={isOnline}
          onToggleStatus={handleToggleStatus}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />

        {/* Page Content */}
        <main className="flex-1 w-full pb-24 md:pb-8">
          {children}
        </main>

        {/* Customer-Panel Style Glass Pill Bottom Navigation Bar (< md) */}
        {activeTab && !hideBottomNav ? (
          <div className="md:hidden">
            <PartnerBottomNav active={activeTab} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
