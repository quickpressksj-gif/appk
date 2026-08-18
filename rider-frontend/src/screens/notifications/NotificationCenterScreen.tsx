import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Megaphone, MessageSquare, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { RiderTopBar } from "../../components/RiderTopBar";
import { NotificationCard } from "../../components/notifications/NotificationCard";
import { NotificationListSkeleton } from "../../components/notifications/NotificationSkeletons";
import { NotificationStateView } from "../../components/notifications/NotificationStates";
import { NotificationToolbar } from "../../components/notifications/NotificationToolbar";
import { PullToRefreshShell } from "../../components/wallet/PullToRefreshShell";
import { useRiderResource } from "../../hooks/use-rider-resource";
import { riderRoutes } from "../../navigation/rider-routes";
import {
  groupNotifications,
  selectNotifications,
  type NotificationCategory,
  type RiderNotification,
} from "../../data/rider-notifications-mock";
import { loadRiderNotifications } from "../../data/rider-notifications-adapter";

/**
 * Notification Center — grouped, filterable list backed by the real
 * `GET /api/rider/notifications` endpoint. Read/clear actions are local view
 * state only: the backend exposes no mark-as-read endpoint, so nothing is
 * faked as persisted.
 */
export function NotificationCenterScreen() {
  const navigate = useNavigate();
  const [nonce, setNonce] = useState(0);
  const { data, isLoading, setData } = useRiderResource(loadRiderNotifications, [nonce]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<NotificationCategory | "all">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const rows = data ?? [];
  const filtered = useMemo(
    () => selectNotifications(rows, category, unreadOnly, query),
    [rows, category, unreadOnly, query],
  );
  const sections = useMemo(() => groupNotifications(filtered), [filtered]);
  const unreadCount = rows.filter((row) => !row.read).length;

  const markRead = (id: string) =>
    setData(rows.map((row) => (row.id === id ? { ...row, read: true } : row)));

  const openAction = (notification: RiderNotification) => {
    markRead(notification.id);
    if (notification.actionTarget === "wallet") {
      navigate({ to: riderRoutes.wallet });
      return;
    }
    if (notification.actionTarget === "support") {
      navigate({ to: riderRoutes.messages });
      return;
    }
    if (notification.actionTarget === "announcement") {
      navigate({ to: riderRoutes.announcements });
      return;
    }
    if (notification.actionTarget === "order" && notification.reference) {
      navigate({ to: riderRoutes.orders });
      return;
    }
    toast.success("Opened notification");
  };

  const refresh = useCallback(async () => {
    setNonce((value) => value + 1);
    toast.success("Notifications refreshed");
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Notifications"
          subtitle={`${unreadCount} unread · orders, payouts and alerts`}
          action={
            <button
              type="button"
              aria-label="Notification settings"
              onClick={() => navigate({ to: riderRoutes.notificationSettings })}
              className="grid size-10 place-items-center rounded-2xl bg-muted text-foreground active:scale-[0.94]"
            >
              <Settings2 className="size-5" strokeWidth={2.2} />
            </button>
          }
        />

        {isLoading || !data ? (
          <NotificationListSkeleton />
        ) : (
          <PullToRefreshShell onRefresh={refresh}>
            <div className="px-5 pb-32 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => navigate({ to: riderRoutes.announcements })}
                  className="card-soft animate-notify-in flex items-center gap-2 border border-border p-3 text-left active:scale-[0.98]"
                >
                  <Megaphone className="size-4 shrink-0 text-brand-dark" strokeWidth={2.4} />
                  <span className="text-[0.72rem] font-black tracking-tight text-foreground">
                    Announcements
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ to: riderRoutes.messages })}
                  className="card-soft animate-notify-in flex items-center gap-2 border border-border p-3 text-left active:scale-[0.98]"
                  style={{ animationDelay: "60ms" }}
                >
                  <MessageSquare className="size-4 shrink-0 text-brand-green" strokeWidth={2.4} />
                  <span className="text-[0.72rem] font-black tracking-tight text-foreground">
                    Messages
                  </span>
                </button>
              </div>

              <div className="mt-4">
                <NotificationToolbar
                  query={query}
                  onQuery={setQuery}
                  category={category}
                  onCategory={setCategory}
                  unreadOnly={unreadOnly}
                  onUnreadOnly={setUnreadOnly}
                  unreadCount={unreadCount}
                  resultCount={filtered.length}
                  onMarkAllRead={() => {
                    setData(rows.map((row) => ({ ...row, read: true })));
                    toast.success("All notifications marked read");
                  }}
                  onClearAll={() => {
                    setData([]);
                    toast.success("Notifications cleared");
                  }}
                />
              </div>

              <div className="mt-4 space-y-5">
                {rows.length === 0 ? (
                  <NotificationStateView state="no-notifications" />
                ) : sections.length === 0 ? (
                  <NotificationStateView
                    state="no-results"
                    onAction={() => {
                      setQuery("");
                      setCategory("all");
                      setUnreadOnly(false);
                    }}
                  />
                ) : (
                  sections.map((section) => (
                    <section key={section.group} className="space-y-3">
                      <h2 className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
                        {section.group}
                      </h2>
                      {section.rows.map((notification, index) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          delay={index * 50}
                          onOpen={() => markRead(notification.id)}
                          onAction={() => openAction(notification)}
                        />
                      ))}
                    </section>
                  ))
                )}
              </div>
            </div>
          </PullToRefreshShell>
        )}
      </div>
      <Toaster />
    </main>
  );
}
