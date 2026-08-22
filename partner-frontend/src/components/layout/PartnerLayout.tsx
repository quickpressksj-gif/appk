import { Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { Bell, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PartnerSidebar } from "./PartnerSidebar";
import { PartnerDesktopTopBar } from "./PartnerDesktopTopBar";
import { ZomatoBottomNav } from "./ZomatoBottomNav";
import { partnerRoutes, type PartnerTabId } from "../../navigation/partner-routes";
import { fetchPartnerProfile, toggleStoreStatus } from "../../api/partner/partner-profile-api";
import { usePartnerContext } from "../../context/PartnerContext";

const TAB_MAPPING: Record<PartnerTabId, "hub" | "orders" | "growth" | "menu" | "finance"> = {
  dashboard: "hub",
  orders: "orders",
  services: "menu",
  earnings: "finance",
  wallet: "finance",
  profile: "hub",
};

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

        {/* Page Content */}
        <main className="flex-1 w-full pb-20 md:pb-8">
          {children}
        </main>

        {/* Zomato-Style Mobile Floating Navigation Pill */}
        {activeTab ? (
          <ZomatoBottomNav activeTab={TAB_MAPPING[activeTab] || "hub"} />
        ) : null}
      </div>
    </div>
  );
}
