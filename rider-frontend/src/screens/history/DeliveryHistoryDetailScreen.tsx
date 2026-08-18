import { useNavigate } from "@tanstack/react-router";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { RiderTopBar } from "../../components/RiderTopBar";
import { HistoryDetailSkeleton } from "../../components/history/HistorySkeletons";
import { HistoryStateView } from "../../components/history/HistoryStates";
import {
  DeliveryProofPanel,
  EarningsBreakdownPanel,
  HistoryTimelinePanel,
  PickupDropPanel,
  RatingFeedbackPanel,
} from "../../components/history/HistoryDetailPanels";
import { useRiderResource } from "../../hooks/use-rider-resource";
import { riderRoutes } from "../../navigation/rider-routes";
import { loadDeliveryHistory } from "../../data/rider-history-mock";

/** Delivery History Detail — timeline, addresses, earnings split and feedback. */
export function DeliveryHistoryDetailScreen({ deliveryId }: { deliveryId: string }) {
  const navigate = useNavigate();
  const { data, isLoading } = useRiderResource(loadDeliveryHistory);
  const entry = data?.find((row) => row.id === deliveryId || row.orderId === deliveryId) ?? null;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title={entry ? entry.orderId : "Delivery"}
          subtitle={entry ? `${entry.date} · ${entry.time}` : "Trip details"}
          onBack={() => navigate({ to: riderRoutes.history })}
        />

        {isLoading || !data ? (
          <HistoryDetailSkeleton />
        ) : !entry ? (
          <div className="px-5 pt-6">
            <HistoryStateView state="no-history" onAction={() => navigate({ to: riderRoutes.history })} />
          </div>
        ) : (
          <div className="space-y-4 px-5 pb-32 pt-4">
            <PickupDropPanel entry={entry} />
            <HistoryTimelinePanel entry={entry} />
            <EarningsBreakdownPanel entry={entry} />
            <RatingFeedbackPanel entry={entry} />
            <DeliveryProofPanel />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => toast.success("Invoice download queued")}
                className="card-soft flex min-h-12 flex-1 items-center justify-center gap-2 border border-border text-xs font-black tracking-tight text-foreground active:scale-[0.98]"
              >
                <Download className="size-4" strokeWidth={2.2} /> Invoice
              </button>
              <button
                type="button"
                onClick={() => toast.success("Trip summary shared")}
                className="card-soft flex min-h-12 flex-1 items-center justify-center gap-2 border border-border text-xs font-black tracking-tight text-foreground active:scale-[0.98]"
              >
                <Share2 className="size-4" strokeWidth={2.2} /> Share
              </button>
            </div>
          </div>
        )}
      </div>
      <Toaster />
    </main>
  );
}