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
  { id: "pickup", label: "Pickup Orders" },
  { id: "delivery", label: "Delivery Orders" },
];

export function AssignedOrdersScreen() {
  const { data, isLoading, setData } = useRiderResource(fetchRiderOrders);
  const [tab, setTab] = useState<RiderTaskType>("pickup");

  const orders = (data ?? []).filter((order) => order.taskType === tab);

  const handleAccept = async (order: RiderOrder) => {
    // TODO: replace with POST /api/rider/orders/:id/accept
    await acceptRiderOrder(order.id);
    setData(
      (data ?? []).map((item) =>
        item.id === order.id ? { ...item, status: "accepted" as const } : item,
      ),
    );
    toast.success(`Accepted ${order.code}`);
  };

  const handleReject = async (order: RiderOrder) => {
    // TODO: replace with POST /api/rider/orders/:id/reject
    await rejectRiderOrder(order.id);
    setData((data ?? []).filter((item) => item.id !== order.id));
    toast(`Rejected ${order.code}`);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md">
        <RiderTopBar
          title="Assigned Orders"
          subtitle="Accept, reject or open details"
          action={<RiderBellAction count={2} />}
        />

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
          <RiderListSkeleton />
        ) : (
          <div className="space-y-3 px-5 pb-32 pt-2">
            {orders.length === 0 ? (
              <RiderEmptyState
                icon={PackageSearch}
                title="No orders here yet"
                body="Stay online — new assignments appear the moment they're allocated to you."
              />
            ) : (
              orders.map((order, index) => (
                <RiderOrderCard
                  key={order.id}
                  order={order}
                  delay={index * 70}
                  onAccept={(o) => void handleAccept(o)}
                  onReject={(o) => void handleReject(o)}
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
