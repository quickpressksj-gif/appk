import { useNavigate } from "@tanstack/react-router";
import { BellRing, CheckCheck, Gift, PackageCheck, TriangleAlert, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerLayout } from "../components/layout/PartnerLayout";
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
    await markNotificationsRead();
    toast.success("All notifications marked read");
  };

  return (
    <PartnerLayout
      title="Notifications & Alerts"
      subtitle="Operational updates, order bookings and payout receipts"
    >
      <div className="mx-auto w-full max-w-4xl px-4 py-4 md:px-8 md:py-6">
        <div className="flex items-center justify-between pb-4">
          <p className="text-xs font-bold text-muted-foreground">
            {items ? `${items.filter((i) => !i.read).length} unread` : "Loading..."}
          </p>
          <button
            type="button"
            onClick={() => void handleReadAll()}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted"
          >
            <CheckCheck className="size-4" />
            <span>Mark all read</span>
          </button>
        </div>

        {!items ? (
          <PartnerListSkeleton />
        ) : items.length === 0 ? (
          <PartnerEmptyState
            icon={BellRing}
            title="Nothing new"
            body="Order, payout and incentive updates will show up here."
          />
        ) : (
          <div className="space-y-3 pb-12">
            {items.map((item) => {
              const Icon = KIND_ICON[item.kind] || BellRing;
              return (
                <div
                  key={item.id}
                  className={`flex gap-3.5 rounded-3xl border p-4 transition-all ${
                    item.read ? "border-border bg-card" : "border-primary/50 bg-primary/5 shadow-sm"
                  }`}
                >
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
                      item.kind === "alert"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/20 text-brand-dark"
                    }`}
                  >
                    <Icon className="size-5" strokeWidth={2.1} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.body}</p>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {item.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Toaster />
    </PartnerLayout>
  );
}
