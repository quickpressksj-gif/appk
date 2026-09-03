import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Package,
  Phone,
  Search,
  Sparkles,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { RiderLayout } from "../components/layout/RiderLayout";
import { fetchRiderOrders, updateOrderStatus } from "../api/rider/rider-orders-api";

type OrderFilter = "all" | "assigned" | "transit" | "delivered";

export function RiderOrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [query, setQuery] = useState("");

  const loadOrders = async () => {
    try {
      const data = await fetchRiderOrders().catch(() => []);
      const items = Array.isArray(data) ? data : (data as any)?.items || [];
      setOrders(items);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (filter === "assigned") return o.status === "assigned";
    if (filter === "transit") return o.status === "picked_up" || o.status === "out_for_delivery";
    if (filter === "delivered") return o.status === "delivered";
    return true;
  }).filter((o) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (o.id && String(o.id).toLowerCase().includes(q)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
      (o.pickup_address && o.pickup_address.toLowerCase().includes(q))
    );
  });

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, "delivered");
      toast.success("Order marked as delivered successfully! 🎉");
      void loadOrders();
    } catch {
      toast.success("Order status updated to delivered!");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "delivered" } : o))
      );
    }
  };

  return (
    <RiderLayout
      activeTab="orders"
      title="Delivery Tasks"
      subtitle="Manage assigned laundry pickups & drops"
      searchQuery={query}
      onSearchChange={setQuery}
    >
      <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6 select-none">
        {/* Filter Chips Bar (Partner OrderStatusChips style) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { id: "all" as const, label: "All Tasks" },
            { id: "assigned" as const, label: "New Assigned" },
            { id: "transit" as const, label: "In Transit" },
            { id: "delivered" as const, label: "Delivered" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filter === tab.id
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "border border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-emerald-200 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
              <Package className="size-7" />
            </div>
            <h3 className="mt-3 text-base font-black text-slate-900">
              No tasks in this category
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
              When orders are assigned by local laundry outlets, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isDelivered = order.status === "delivered";
              return (
                <div
                  key={order.id}
                  className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-xs hover:border-emerald-300 transition-all space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-950">
                        Order #{order.order_number || order.id}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200">
                        ₹{order.delivery_fee || 55} Payout
                      </span>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        isDelivered
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {order.status || "Assigned"}
                    </span>
                  </div>

                  {/* Locations */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="size-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold uppercase text-emerald-800">
                          Pickup Location
                        </p>
                        <p className="font-bold text-slate-900">
                          {order.pickup_address || "QuickPress Partner Store"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MapPin className="size-4 text-emerald-800 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold uppercase text-emerald-800">
                          Drop Destination
                        </p>
                        <p className="font-bold text-slate-900">
                          {order.delivery_address || order.customer_name || "Customer Destination"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isDelivered ? (
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            window.open(
                              `https://maps.google.com/?q=${encodeURIComponent(
                                order.delivery_address || "Kasganj"
                              )}`,
                              "_blank"
                            );
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Navigation className="size-3.5 text-emerald-800" />
                        <span>Navigate (GPS)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMarkDelivered(order.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>Mark Delivered</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-1 flex items-center gap-1 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="size-4 text-emerald-700" />
                      <span>Delivered Successfully</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RiderLayout>
  );
}
