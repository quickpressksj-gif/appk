import { useNavigate } from "@tanstack/react-router";
import { MessagesSquare, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@shared/ui/sonner";

import { PartnerTopBar } from "../components/PartnerTopBar";
import { PartnerBottomNav } from "../components/PartnerBottomNav";
import { PullToRefresh } from "../components/dashboard/PullToRefresh";
import { PartnerEmptyState, SectionHeading } from "../components/PartnerPrimitives";
import { ThreadCard } from "../components/messages/ThreadCard";
import { ThreadListSkeleton } from "../components/notifications/NotificationSkeletons";
import { OfflineBanner, useOnlineStatus } from "../components/notifications/OfflineBanner";
import { usePartnerResource } from "../hooks/use-partner-resource";
import { partnerRoutes } from "../navigation/partner-routes";
import {
  fetchPartnerNotificationsData,
  THREAD_TABS,
  type ThreadKind,
} from "../data/partner-notifications-mock";

/** Sprint 3.8 — Communication Center (UI only, mock data). */
export function MessagesScreen() {
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const { data, setData } = usePartnerResource(fetchPartnerNotificationsData);
  const [tab, setTab] = useState<ThreadKind>("customer");
  const [query, setQuery] = useState("");

  const handleRefresh = useCallback(async () => {
    const fresh = await fetchPartnerNotificationsData();
    setData(fresh);
    toast.success("Messages refreshed");
  }, [setData]);

  const threads = data?.threads ?? [];
  const visible = useMemo(
    () =>
      threads.filter(
        (thread) =>
          thread.kind === tab &&
          (query.trim() === "" ||
            `${thread.name} ${thread.subtitle} ${thread.lastMessage}`
              .toLowerCase()
              .includes(query.trim().toLowerCase())),
      ),
    [threads, tab, query],
  );

  const totalUnread = threads.reduce((sum, thread) => sum + thread.unread, 0);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md md:max-w-3xl lg:max-w-5xl">
        <PartnerTopBar
          title="Messages"
          subtitle={`${totalUnread} unread conversations`}
          onBack={() => navigate({ to: partnerRoutes.notifications })}
        />

        {!data ? (
          <div className="px-5 pb-32 pt-4">
            <ThreadListSkeleton />
          </div>
        ) : (
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="animate-fade-in px-5 pb-32 pt-4">
              {online ? null : <OfflineBanner message="Messages will sync once you reconnect." />}

              <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft transition-colors focus-within:border-primary">
                <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  aria-label="Search conversations"
                  placeholder="Search conversations"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>

              <div
                role="tablist"
                aria-label="Conversation types"
                className="no-scrollbar -mx-5 mt-4 flex items-center gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0"
              >
                {THREAD_TABS.map((item) => {
                  const isActive = tab === item.id;
                  const unread = threads
                    .filter((thread) => thread.kind === item.id)
                    .reduce((sum, thread) => sum + thread.unread, 0);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setTab(item.id)}
                      className={`min-h-9 shrink-0 rounded-full border px-3.5 text-[0.7rem] font-bold tracking-tight transition-all duration-300 active:scale-[0.96] ${
                        isActive
                          ? "border-brand-green bg-secondary/10 text-brand-green-dark"
                          : "border-border bg-card text-muted-foreground hover:border-primary/60"
                      }`}
                    >
                      {item.label}
                      {unread > 0 ? ` (${unread})` : ""}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <SectionHeading title="Conversations" />
                <div className="mt-4 space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                  {visible.length === 0 ? (
                    <div className="lg:col-span-2">
                      <PartnerEmptyState
                        icon={MessagesSquare}
                        title="No messages"
                        body="Customer, order, support and admin conversations will appear here."
                      />
                    </div>
                  ) : (
                    visible.map((thread) => (
                      <ThreadCard
                        key={thread.id}
                        thread={thread}
                        onOpen={(id) =>
                          navigate({ to: partnerRoutes.chat, params: { threadId: id } })
                        }
                      />
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