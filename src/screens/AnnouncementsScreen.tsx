import { useNavigate } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@shared/ui/sonner";

import { PartnerTopBar } from "../components/PartnerTopBar";
import { PartnerBottomNav } from "../components/PartnerBottomNav";
import { PullToRefresh } from "../components/dashboard/PullToRefresh";
import { PartnerEmptyState, SectionHeading } from "../components/PartnerPrimitives";
import { AnnouncementCard } from "../components/messages/AnnouncementCard";
import { ThreadListSkeleton } from "../components/notifications/NotificationSkeletons";
import { OfflineBanner, useOnlineStatus } from "../components/notifications/OfflineBanner";
import { usePartnerResource } from "../hooks/use-partner-resource";
import { partnerRoutes } from "../navigation/partner-routes";
import {
  ANNOUNCEMENT_KIND_LABEL,
  fetchPartnerNotificationsData,
  type AnnouncementKind,
} from "../data/partner-notifications-mock";

const KIND_ORDER: AnnouncementKind[] = ["platform", "maintenance", "campaign", "festival"];

/** Sprint 3.8 — Announcements (platform updates, maintenance, campaigns, festivals). */
export function AnnouncementsScreen() {
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const { data, setData } = usePartnerResource(fetchPartnerNotificationsData);
  const [kind, setKind] = useState<AnnouncementKind | "all">("all");

  const handleRefresh = useCallback(async () => {
    const fresh = await fetchPartnerNotificationsData();
    setData(fresh);
    toast.success("Announcements refreshed");
  }, [setData]);

  const announcements = data?.announcements ?? [];
  const visible = useMemo(
    () => announcements.filter((item) => kind === "all" || item.kind === kind),
    [announcements, kind],
  );

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md md:max-w-3xl lg:max-w-5xl">
        <PartnerTopBar
          title="Announcements"
          subtitle="Platform updates, maintenance & offers"
          onBack={() => navigate({ to: partnerRoutes.notifications })}
        />

        {!data ? (
          <div className="px-5 pb-32 pt-4">
            <ThreadListSkeleton rows={4} />
          </div>
        ) : (
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="animate-fade-in px-5 pb-32 pt-4">
              {online ? null : <OfflineBanner />}

              <div className="no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
                {(["all", ...KIND_ORDER] as const).map((item) => {
                  const isActive = kind === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setKind(item)}
                      className={`min-h-9 shrink-0 rounded-full border px-3.5 text-[0.7rem] font-bold tracking-tight transition-all duration-300 active:scale-[0.96] ${
                        isActive
                          ? "border-brand-green bg-secondary/10 text-brand-green-dark"
                          : "border-border bg-card text-muted-foreground hover:border-primary/60"
                      }`}
                    >
                      {item === "all" ? "All" : ANNOUNCEMENT_KIND_LABEL[item]}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <SectionHeading title="Latest Announcements" />
                <div className="mt-4 space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                  {visible.length === 0 ? (
                    <div className="lg:col-span-2">
                      <PartnerEmptyState
                        icon={Megaphone}
                        title="No announcements"
                        body="Platform updates, maintenance notices and campaigns will appear here."
                      />
                    </div>
                  ) : (
                    visible.map((announcement) => (
                      <AnnouncementCard key={announcement.id} announcement={announcement} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </PullToRefresh>
        )}

        <PartnerBottomNav active="dashboard" />
      </div>
      <Toaster />
    </main>
  );
}