import { useNavigate } from "@tanstack/react-router";
import { BellRing, CheckCheck, Gift, PackageCheck, TriangleAlert, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerTopBar } from "../components/PartnerTopBar";
import { PartnerBottomNav } from "../components/PartnerBottomNav";
import { PartnerListSkeleton } from "../components/PartnerSkeletons";
import { PartnerEmptyState } from "../components/PartnerPrimitives";
import { usePartnerResource } from "../hooks/use-partner-resource";
import { partnerRoutes } from "../navigation/partner-routes";
import {
  fetchPartnerNotifications,
  markNotificationsRead,
} from "@/api/partner/partner-profile-api";

const KIND_ICON = {
  order: PackageCheck,
  payout: Wallet,
  alert: TriangleAlert,
  promo: Gift,
} as const;

export function NotificationsScreen() {
  const navigate = useNavigate();
  const { data: items, setData } = usePartnerResource(fetchPartnerNotifications);

  const handleReadAll = async () => {
    if (!items) return;
    setData(items.map((item) => ({ ...item, read: true })));
    // TODO: replace with POST /api/partner/notifications/read
    await markNotificationsRead();
    toast.success("All notifications marked read");
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <PartnerTopBar
          title="Notifications"
          onBack={() => navigate({ to: partnerRoutes.dashboard })}
          action={
            <button
              type="button"
              aria-label="Mark all read"
              onClick={() => void handleReadAll()}
              className="flex size-10 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94]"
            >
              <CheckCheck className="size-5" />
            </button>
          }
        />

        {!items ? (
          <PartnerListSkeleton />
        ) : (
          <div className="space-y-3 px-5 pb-32 pt-4">
            {items.length === 0 ? (
              <PartnerEmptyState
                icon={BellRing}
                title="Nothing new"
                body="Order, payout and incentive updates will show up here."
              />
            ) : (
              items.map((item, index) => {
                const Icon = KIND_ICON[item.kind];
                return (
                  <div
                    key={item.id} className={`card-soft flex gap-3 border p-4 transition-all duration-300 ${
                      item.read ? "border-border" : "border-primary/50 bg-primary/5"
                    }`}
                  >
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
                        item.kind === "alert"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/15 text-brand-dark"
                      }`}
                    >
                      <Icon className="size-5" strokeWidth={2.1} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold tracking-tight text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[0.72rem] font-medium text-muted-foreground">
                        {item.body}
                      </p>
                      <p className="mt-1.5 text-[0.66rem] font-bold uppercase tracking-wider text-muted-foreground">
                        {item.time}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        <PartnerBottomNav active="dashboard" />
      </div>
      <Toaster />
    </main>
  );
}
