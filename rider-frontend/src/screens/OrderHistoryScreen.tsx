import { History, IndianRupee, MapPin, PackageCheck, Route } from "lucide-react";
import { useState } from "react";

import { Toaster } from "@/shared/ui/sonner";

import { RiderBottomNav } from "../components/RiderBottomNav";
import { RiderEmptyState } from "../components/RiderPrimitives";
import { RiderListSkeleton } from "../components/RiderSkeletons";
import { RiderTopBar } from "../components/RiderTopBar";
import { useRiderResource } from "../hooks/use-rider-resource";
import { fetchRiderHistory } from "@/api/rider/rider-orders-api";
import type { RiderHistoryEntry } from "@/shared/types/rider";

const TABS: { id: RiderHistoryEntry["outcome"]; label: string }[] = [
  { id: "completed", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
  { id: "failed", label: "Failed" },
];

const TONE: Record<RiderHistoryEntry["outcome"], string> = {
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-slate-100 text-slate-600 border border-slate-200",
  failed: "bg-rose-50 text-rose-700 border border-rose-200",
};

export function OrderHistoryScreen() {
  const { data, isLoading } = useRiderResource(fetchRiderHistory);
  const [tab, setTab] = useState<RiderHistoryEntry["outcome"]>("completed");

  const historyList: RiderHistoryEntry[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.items)
      ? (data as any).items
      : [];

  const rows = historyList.filter((row) => (row.outcome || "completed") === tab);

  return (
    <main className="relative min-h-screen bg-slate-50/50 pb-28 text-slate-900">
      <div className="mx-auto w-full max-w-md lg:max-w-3xl">
        <RiderTopBar title="Trip History" subtitle="Archive of all fulfilled deliveries" />

        {/* Tab Controls */}
        <div className="sticky top-[3.5rem] z-20 bg-white/90 px-4 py-2.5 backdrop-blur-md border-b border-slate-100">
          <div className="flex gap-1.5 rounded-2xl bg-slate-100 p-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex-1 rounded-xl py-2 text-xs font-black transition-all active:scale-[0.97] ${
                  tab === item.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-4">
            <RiderListSkeleton rows={4} />
          </div>
        ) : (
          <div className="space-y-3 px-4 pt-3.5">
            {rows.length === 0 ? (
              <div className="my-8 rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
                <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <History className="size-6" />
                </span>
                <p className="mt-3 text-sm font-black text-slate-900">No {tab} Deliveries</p>
                <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                  Your fulfilled deliveries will be listed here with distance and payout receipts.
                </p>
              </div>
            ) : (
              rows.map((row) => (
                <article
                  key={row.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold text-slate-400">{row.code}</p>
                      <p className="mt-0.5 truncate text-sm font-black text-slate-900">
                        {row.customerName}
                      </p>
                      <p className="truncate text-[11px] font-semibold text-slate-500">
                        {row.partnerName}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${TONE[row.outcome]}`}
                    >
                      {row.outcome}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold">
                      <Route className="size-3.5" />
                      {row.distanceKm} km
                    </span>
                    <span className="text-[11px]">{row.date ? new Date(row.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Recent"}</span>
                    <p className="flex items-center font-extrabold text-slate-900 text-sm">
                      <IndianRupee className="size-3.5" strokeWidth={2.5} />
                      {row.amount}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        <RiderBottomNav active="orders" />
      </div>
      <Toaster />
    </main>
  );
}
