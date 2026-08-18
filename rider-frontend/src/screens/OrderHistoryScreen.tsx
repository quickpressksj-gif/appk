import { History, IndianRupee, MapPin } from "lucide-react";
import { useState } from "react";

import { Toaster } from "@/shared/ui/sonner";

import { RiderEmptyState } from "../components/RiderPrimitives";
import { RiderListSkeleton } from "../components/RiderSkeletons";
import { RiderTopBar } from "../components/RiderTopBar";
import { useRiderResource } from "../hooks/use-rider-resource";
import { fetchRiderHistory } from "@/api/rider/rider-orders-api";
import type { RiderHistoryEntry } from "@/shared/types/rider";

const TABS: { id: RiderHistoryEntry["outcome"]; label: string }[] = [
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "failed", label: "Failed" },
];

const TONE: Record<RiderHistoryEntry["outcome"], string> = {
  completed: "bg-secondary/10 text-brand-green",
  cancelled: "bg-muted text-muted-foreground",
  failed: "bg-destructive/10 text-destructive",
};

export function OrderHistoryScreen() {
  const { data, isLoading } = useRiderResource(fetchRiderHistory);
  const [tab, setTab] = useState<RiderHistoryEntry["outcome"]>("completed");

  const rows = (data ?? []).filter((row) => row.outcome === tab);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md">
        <RiderTopBar title="Order History" subtitle="All past trips" />

        <div className="sticky top-[3.75rem] z-20 bg-background/85 px-5 py-3 backdrop-blur">
          <div className="flex gap-2 rounded-full bg-muted p-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex-1 rounded-full py-2.5 text-xs font-black tracking-tight transition-all duration-300 active:scale-[0.97] ${
                  tab === item.id
                    ? "bg-background text-brand-dark shadow-soft"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <RiderListSkeleton rows={4} />
        ) : (
          <div className="space-y-3 px-5 pb-32 pt-2">
            {rows.length === 0 ? (
              <RiderEmptyState
                icon={History}
                title={`No ${tab} trips`}
                body="Trips you finish will be listed here with earnings and distance."
              />
            ) : (
              rows.map((row, index) => (
                <div
                  key={row.id} className="card-soft border border-border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black tracking-tight text-foreground">
                        {row.customerName}
                      </p>
                      <p className="truncate text-[0.7rem] font-semibold text-muted-foreground">
                        {row.code} · {row.partnerName}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider ${TONE[row.outcome]}`}
                    >
                      {row.outcome}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[0.7rem] font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {row.distanceKm} km
                    </span>
                    <span>{row.date}</span>
                    <span className="flex items-center gap-0.5 text-foreground">
                      <IndianRupee className="size-3.5" />
                      {row.amount}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <Toaster />
    </main>
  );
}
