import { PackageSearch } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { RiderBottomNav } from "../components/RiderBottomNav";
import { RiderOrderCard } from "../components/RiderOrderCard";
import { RiderEmptyState } from "../components/RiderPrimitives";
import { RiderListSkeleton } from "../components/RiderSkeletons";
import { RiderBellAction, RiderTopBar } from "../components/RiderTopBar";
import { useRiderResource } from "../hooks/use-rider-resource";
import {
  acceptRiderOrder,
  fetchRiderOrders,
  rejectRiderOrder,
} from "@/api/rider/rider-orders-api";
import type { RiderOrder, RiderTaskType } from "@/shared/types/rider";

const TABS: { id: RiderTaskType; label: string }[] = [
  { id: "pickup", label: "Pickup Tasks" },
  { id: "delivery", label: "Delivery Tasks" },
];

export function AssignedOrdersScreen() {
  const { data, isLoading, setData } = useRiderResource(fetchRiderOrders);
  const [tab, setTab] = useState<RiderTaskType>("pickup");

  const orderList: RiderOrder[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.items)
      ? (data as any).items
      : [];

  const orders = orderList.filter((order) => (order.taskType || "pickup") === tab);

  const handleAccept = async (order: RiderOrder) => {
    await acceptRiderOrder(order.id);
    setData(
      orderList.map((item) =>
        item.id === order.id ? { ...item, status: "accepted" as const } : item,
      ),
    );
    toast.success(`Accepted order ${order.code} 🚀`);
  };

  const handleReject = async (order: RiderOrder) => {
    await rejectRiderOrder(order.id);
    setData(orderList.filter((item) => item.id !== order.id));
    toast.info(`Declined order ${order.code}`);
  };

  return (
    <main className="relative min-h-screen bg-slate-50/50 pb-28 text-slate-900">
      <div className="mx-auto w-full max-w-md lg:max-w-3xl">
        <RiderTopBar
          title="Assigned Orders"
          subtitle="Real-time pickup & delivery requests"
          action={<RiderBellAction count={0} />}
        />

        {/* Tab Controls */}
        <div className="sticky top-[3.5rem] z-20 bg-white/90 px-4 py-2.5 backdrop-blur-md border-b border-slate-100">
          <div className="flex gap-1.5 rounded-2xl bg-slate-100 p-1">
            {TABS.map((item) => {
              const count = orderList.filter((o) => (o.taskType || "pickup") === item.id).length;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition-all active:scale-[0.97] ${
                    tab === item.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span>{item.label}</span>
                  {count > 0 ? (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                        tab === item.id ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders Feed */}
        {isLoading ? (
          <div className="p-4">
            <RiderListSkeleton rows={3} />
          </div>
        ) : (
          <div className="space-y-3 px-4 pt-3.5">
            {orders.length === 0 ? (
              <div className="my-8 rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
                <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <PackageSearch className="size-6" />
                </span>
                <p className="mt-3 text-sm font-black text-slate-900">
                  No {tab === "pickup" ? "Pickup" : "Delivery"} Tasks
                </p>
                <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                  New orders will automatically notify you when customers request laundry pickup or dispatch.
                </p>
              </div>
            ) : (
              orders.map((order, index) => (
                <RiderOrderCard
                  key={order.id}
                  order={order}
                  delay={index * 50}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
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
