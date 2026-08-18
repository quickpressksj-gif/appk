import { useNavigate } from "@tanstack/react-router";
import { BellRing, Megaphone, MessagesSquare } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@shared/ui/sonner";

import { PartnerTopBar } from "../components/PartnerTopBar";
import { PartnerBottomNav } from "../components/PartnerBottomNav";
import { PullToRefresh } from "../components/dashboard/PullToRefresh";
import { PartnerEmptyState, SectionHeading } from "../components/PartnerPrimitives";
import { NotificationCard } from "../components/notifications/NotificationCard";
import { NotificationToolbar } from "../components/notifications/NotificationToolbar";
import { NotificationListSkeleton } from "../components/notifications/NotificationSkeletons";
import { OfflineBanner, useOnlineStatus } from "../components/notifications/OfflineBanner";
import { CustomerSuccessOverlay } from "../components/customers/CustomerSuccessOverlay";
import { usePartnerResource } from "../hooks/use-partner-resource";
import { partnerRoutes } from "../navigation/partner-routes";
import {
  fetchPartnerNotificationsData,
  matchesNotificationFilter,
  unreadCount,
  type NotificationFilterId,
  type PartnerNotification,
} from "../data/partner-notifications-mock";

/**
 * Sprint 3.8 — Notification Center (UI only, mock data).
 * TODO(fcm): hydrate this list from Firebase Cloud Messaging pushes.
 */
export function NotificationsScreen() {
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const { data, setData } = usePartnerResource(fetchPartnerNotificationsData);
  const [filter, setFilter] = useState<NotificationFilterId>("all");
  const [success, setSuccess] = useState<string | null>(null);

  const items: PartnerNotification[] = data?.notifications ?? [];

  const update = useCallback(
    (next: PartnerNotification[]) => {
      setData((prev) => (prev ? { ...prev, notifications: next } : prev));
    },
    [setData],
  );

  const handleRefresh = useCallback(async () => {
    const fresh = await fetchPartnerNotificationsData();
    setData(fresh);
    toast.success("Notifications refreshed");
  }, [setData]);

  const visible = useMemo(
    () => items.filter((item) => matchesNotificationFilter(item, filter)),
    [items, filter],
  );

  const unread = unreadCount(items);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md md:max-w-3xl lg:max-w-5xl">
        <PartnerTopBar
          title="Notifications"
          subtitle={`${unread} unread · order, payment & system alerts`}
          onBack={() => navigate({ to: partnerRoutes.dashboard })}
          action={
            <button
              type="button"
              aria-label="Open messages"
              onClick={() => navigate({ to: partnerRoutes.messages })}
              className="flex size-10 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94]"
            >
              <MessagesSquare className="size-5" />
            </button>
          }
        />

        {!data ? (
          <div className="px-5 pb-32 pt-4">
            <NotificationListSkeleton />
          </div>
        ) : (
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="animate-fade-in px-5 pb-32 pt-4">
              {online ? null : <OfflineBanner />}

              <div className="mt-1 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => navigate({ to: partnerRoutes.messages })}
                  className="card-soft ripple flex min-h-16 items-center gap-2 border border-border p-4 text-left transition-all duration-300 hover:border-primary/60"
                >
                  <MessagesSquare className="size-5 shrink-0 text-brand-dark" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold tracking-tight text-foreground">
                      Messages
                    </span>
                    <span className="block text-[0.66rem] font-semibold uppercase tracking-wider text-muted-foreground">
                      Customers & support
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ to: partnerRoutes.announcements })}
                  className="card-soft ripple flex min-h-16 items-center gap-2 border border-border p-4 text-left transition-all duration-300 hover:border-primary/60"
                >
                  <Megaphone className="size-5 shrink-0 text-brand-dark" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold tracking-tight text-foreground">
                      Announcements
                    </span>
                    <span className="block text-[0.66rem] font-semibold uppercase tracking-wider text-muted-foreground">
                      Updates & offers
                    </span>
                  </span>
                </button>
              </div>

              <div className="mt-6">
                <SectionHeading title="Notification Center" />
                <div className="mt-4">
                  <NotificationToolbar
                    filter={filter}
                    onFilterChange={setFilter}
                    unread={unread}
                    total={visible.length}
                    onMarkAllRead={() => {
                      update(items.map((item) => ({ ...item, read: true })));
                      setSuccess("All notifications marked read");
                    }}
                    onClearAll={() => {
                      update([]);
                      setSuccess("Notifications cleared");
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                {visible.length === 0 ? (
                  <div className="lg:col-span-2">
                    <PartnerEmptyState
                      icon={BellRing}
                      title={filter === "all" ? "No notifications" : "Nothing in this filter"}
                      body="Order, payment, wallet and system alerts will show up here."
                    />
                  </div>
                ) : (
                  visible.map((item) => (
                    <NotificationCard
                      key={item.id}
                      notification={item}
                      onMarkRead={(id) =>
                        update(
                          items.map((entry) =>
                            entry.id === id ? { ...entry, read: true } : entry,
                          ),
                        )
                      }
                      onDelete={(id) => {
                        update(items.filter((entry) => entry.id !== id));
                        setSuccess("Notification deleted");
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </PullToRefresh>
        )}

        <PartnerBottomNav active="dashboard" />
      </div>

      <CustomerSuccessOverlay message={success} onDone={() => setSuccess(null)} />
      <Toaster />
    </main>
  );
}
