import { Bell, BellRing, CircleDollarSign, PackageSearch, Settings2, Truck } from "lucide-react";

import { Toaster } from "@/shared/ui/sonner";

import { RiderEmptyState } from "../components/RiderPrimitives";
import { RiderListSkeleton } from "../components/RiderSkeletons";
import { RiderTopBar } from "../components/RiderTopBar";
import { useRiderResource } from "../hooks/use-rider-resource";
import { fetchRiderNotifications } from "@/api/rider/rider-notifications-api";
import type { RiderNotificationKind } from "@/shared/types/rider";

const ICONS: Record<RiderNotificationKind, typeof Bell> = {
  "new-order": BellRing,
  "pickup-reminder": PackageSearch,
  "delivery-reminder": Truck,
  payment: CircleDollarSign,
  system: Settings2,
};

export function RiderNotificationsScreen() {
  const { data, isLoading } = useRiderResource(fetchRiderNotifications);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md">
        <RiderTopBar title="Notifications" subtitle="Orders, reminders and payouts" />

        {isLoading ? (
          <RiderListSkeleton rows={5} />
        ) : (
          <div className="space-y-3 px-5 pb-32 pt-4">
            {(data ?? []).length === 0 ? (
              <RiderEmptyState
                icon={Bell}
                title="You're all caught up"
                body="New order alerts and reminders will show up here."
              />
            ) : (
              (data ?? []).map((item, index) => {
                const Icon = ICONS[item.kind];
                return (
                  <div
                    key={item.id} className={`card-soft flex items-start gap-3 border p-4 ${
                      item.unread ? "border-primary/50" : "border-border"
                    }`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                      <Icon className="size-4" strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold tracking-tight text-foreground">
                          {item.title}
                        </p>
                        {item.unread ? (
                          <span className="size-2 shrink-0 rounded-full bg-secondary" />
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[0.7rem] font-medium leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>
                      <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
                        {item.time}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      <Toaster />
    </main>
  );
}
