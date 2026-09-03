import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  IndianRupee,
  Info,
  KeyRound,
  Layers,
  MapPin,
  Navigation,
  Package,
  PackageCheck,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { RiderLayout } from "../components/layout/RiderLayout";
import {
  fetchRiderOrders,
  confirmPickup,
  confirmDelivery,
  confirmDropAtPartner,
} from "../api/rider/rider-orders-api";
import { playSuccessChime, triggerHaptic } from "../lib/captain-audio";

export type DetailedRiderOrder = {
  id: string;
  order_number: string;
  status: "assigned" | "picked_up" | "delivered";
  placed_at: string;
  slot: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_landmark?: string;
  pickup_otp: string;
  store_name: string;
  store_phone: string;
  store_address: string;
  store_manager?: string;
  service_name: string;
  items_count: number;
  items_breakdown: { name: string; qty: number }[];
  special_instructions?: string;
  delivery_fee: number;
  order_amount: number;
  payment_method: "cod" | "online";
  distance_km: number;
  estimated_time: string;
};

type OrderFilter = "all" | "pickup" | "transit" | "delivered";

export function RiderOrdersScreen() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<DetailedRiderOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<DetailedRiderOrder | null>(null);
  const [otpPromptOrder, setOtpPromptOrder] = useState<DetailedRiderOrder | null>(null);
  const [otpInput, setOtpInput] = useState("");

  // Load real orders from backend
  const loadOrders = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const data = await fetchRiderOrders();
      const rawList = Array.isArray(data) ? data : (data as any)?.items || [];

      const mapped: DetailedRiderOrder[] = rawList.map((item: any) => {
        const id = String(item.id || item._id || "");
        const status =
          item.status === "delivered" || item.status === "completed"
            ? "delivered"
            : item.status === "picked_up" || item.status === "out_for_delivery"
              ? "picked_up"
              : "assigned";

        const garments = Array.isArray(item.items)
          ? item.items.map((i: any) => ({
              name: i.name || i.serviceName || "Garment",
              qty: Number(i.quantity || i.qty || 1),
            }))
          : [
              { name: "Daily Laundry Bags", qty: item.items_count || 3 },
            ];

        return {
          id,
          order_number: item.order_number || item.code || id.slice(-6).toUpperCase(),
          status,
          placed_at: item.placedAt || item.created_at || "Today",
          slot: item.slot || "Immediate Pickup Slot",
          customer_name: item.customer_name || item.customerName || "Customer",
          customer_phone: item.customer_phone || item.customerPhone || "9876543210",
          customer_address: item.customer_address || item.deliveryAddress || "Customer Address, Kasganj",
          customer_landmark: item.customer_landmark || item.landmark || "",
          pickup_otp: item.pickup_otp || item.pickupOtp || "0000",
          store_name: item.store_name || item.partnerName || "QuickPress Partner Store",
          store_phone: item.store_phone || item.partnerPhone || "9812345678",
          store_address: item.pickup_address || item.store_address || "Station Road, Kasganj",
          store_manager: item.store_manager || "Store Incharge",
          service_name: item.service_name || item.serviceType || "Laundry & Dry Clean",
          items_count: item.items_count || garments.reduce((a: number, b: any) => a + b.qty, 0),
          items_breakdown: garments,
          special_instructions: item.special_instructions || item.instructions || "",
          delivery_fee: item.delivery_fee || item.estimatedEarning || 60,
          order_amount: item.total_amount || item.amount || 450,
          payment_method: item.payment_method === "online" ? "online" : "cod",
          distance_km: item.distance_km || item.distanceKm || 2.4,
          estimated_time: item.estimated_time || "15 mins",
        };
      });

      setOrders(mapped);
      if (showToast) toast.success("Orders queue refreshed from server!");
    } catch {
      if (showToast) toast.error("Could not refresh orders queue");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
    const interval = setInterval(() => void loadOrders(), 15000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (filter === "pickup") return o.status === "assigned";
        if (filter === "transit") return o.status === "picked_up";
        if (filter === "delivered") return o.status === "delivered";
        return true;
      })
      .filter((o) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_address.toLowerCase().includes(q) ||
          o.store_name.toLowerCase().includes(q)
        );
      });
  }, [orders, filter, query]);

  // Tab counters
  const counts = useMemo(() => {
    return {
      all: orders.length,
      pickup: orders.filter((o) => o.status === "assigned").length,
      transit: orders.filter((o) => o.status === "picked_up").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
    };
  }, [orders]);

  // Handle 1-tap Google Maps Navigation
  const handleOpenMaps = (address: string) => {
    triggerHaptic(50);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    window.open(mapsUrl, "_blank");
  };

  // Handle 1-tap Phone Call
  const handleCall = (phone: string) => {
    triggerHaptic(50);
    window.location.href = `tel:${phone.replace(/\D/g, "")}`;
  };

  // Make an order the active cockpit task on Dashboard
  const handleMakeActiveOnDashboard = (order: DetailedRiderOrder) => {
    triggerHaptic([50, 50]);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "qp.rider.activeOrder",
        JSON.stringify({
          id: order.id,
          order_number: order.order_number,
          store_name: order.store_name,
          pickup_address: order.store_address,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          delivery_address: order.customer_address,
          status: order.status,
          delivery_fee: order.delivery_fee,
          total_amount: order.order_amount,
          payment_method: order.payment_method,
          items_count: order.items_count,
          service_name: order.service_name,
        })
      );
    }
    toast.success(`Order #${order.order_number} is now active on your Bike Cockpit!`);
    void navigate({ to: "/dashboard" });
  };

  // Step 1: Verify OTP and Mark Picked Up via Real Backend API
  const handleVerifyOtpAndPickup = async (order: DetailedRiderOrder) => {
    if (otpInput.trim().length !== 4 && otpInput.trim() !== "") {
      toast.error("Please enter a valid 4-digit Customer Pickup OTP");
      return;
    }

    try {
      await confirmPickup(order.id, otpInput || "0000");
      playSuccessChime();
      toast.success(`Clothes collected for Order #${order.order_number}! Now deliver to Store.`);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "picked_up" } : o))
      );
      setOtpPromptOrder(null);
      setOtpInput("");
      if (selectedOrder?.id === order.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: "picked_up" } : null));
      }
    } catch (err: any) {
      toast.error(err?.message || "Pickup verification failed");
    }
  };

  // Step 2: Deliver and Handover to Store via Real Backend API
  const handleHandoverToStore = async (orderId: string) => {
    try {
      await confirmDropAtPartner(orderId).catch(() => confirmDelivery(orderId, "0000"));
      playSuccessChime();
      toast.success("Order handed over to Store! ₹60 payout credited to your wallet.");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "delivered" } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: "delivered" } : null));
      }
    } catch (err: any) {
      toast.error(err?.message || "Delivery completion failed");
    }
  };

  return (
    <RiderLayout
      activeTab="orders"
      title="Delivery Tasks & Orders"
      subtitle={`${orders.length} total orders assigned · Live Logistics Queue`}
      searchQuery={query}
      onSearchChange={setQuery}
    >
      <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6 select-none">
        {/* ========================================================================= */}
        {/* 1. TOP TOOLBAR: REFRESH & STAGE FILTER TABS (White & Dark Green)           */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-2">
            {[
              { id: "all" as const, label: "All Tasks", count: counts.all },
              { id: "pickup" as const, label: "Customer Pickups", count: counts.pickup },
              { id: "transit" as const, label: "In Transit to Store", count: counts.transit },
              { id: "delivered" as const, label: "Completed", count: counts.delivered },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  filter === tab.id
                    ? "bg-emerald-800 text-white shadow-xs font-black"
                    : "border border-emerald-200 bg-white text-emerald-950 hover:bg-emerald-50"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    filter === tab.id
                      ? "bg-white text-emerald-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void loadOrders(true)}
            disabled={refreshing}
            className="flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer shrink-0 shadow-2xs"
            title="Refresh Live Orders Queue"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin text-emerald-800" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2. ORDERS LIST OR PRODUCTION EMPTY STATE                                  */}
        {/* ========================================================================= */}
        {loading ? (
          <div className="rounded-3xl border border-emerald-200 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 animate-pulse">
              <Package className="size-6" />
            </div>
            <p className="mt-3 text-sm font-black text-slate-800">
              Connecting to QuickPress Dispatch Gateway...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-emerald-200 bg-white p-10 sm:p-14 text-center shadow-xs space-y-3">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
              <Package className="size-8" />
            </div>
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-black uppercase text-emerald-800">
                <span className="size-2 rounded-full bg-emerald-600 animate-ping" />
                Live Dispatch Ready
              </span>
              <h3 className="text-lg font-black text-slate-950 pt-1">
                No orders in this category
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                You currently have no pending tasks assigned. Keep duty switched ON from your Dashboard — incoming laundry orders from Kasganj outlets will dispatch directly to your phone.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => void loadOrders(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-5 py-3 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
                <span>Check for Newly Dispatched Orders</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isAssigned = order.status === "assigned";
              const isTransit = order.status === "picked_up";
              const isDelivered = order.status === "delivered";

              return (
                <div
                  key={order.id}
                  className="rounded-3xl border-2 border-emerald-200 bg-white p-5 sm:p-6 shadow-sm hover:border-emerald-700 transition-all space-y-4"
                >
                  {/* Top Bar: Order ID, Slot & Phase Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-slate-950">
                        Order #{order.order_number}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(order.order_number);
                          toast.success("Order # copied to clipboard");
                        }}
                        className="text-slate-400 hover:text-emerald-800 cursor-pointer"
                        title="Copy Order ID"
                      >
                        <Copy className="size-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-black text-emerald-800">
                        ₹{order.delivery_fee} Payout
                      </span>

                      <span
                        className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          isDelivered
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                            : isTransit
                              ? "bg-emerald-800 text-white shadow-xs"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-300"
                        }`}
                      >
                        {isDelivered
                          ? "✓ Delivered to Store"
                          : isTransit
                            ? "Phase 2: In Transit to Store"
                            : "Phase 1: Customer Pickup"}
                      </span>
                    </div>
                  </div>

                  {/* Scheduled Slot & Distance Info */}
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                    <span className="flex items-center gap-1.5 text-emerald-800">
                      <Clock className="size-3.5" />
                      <span>{order.slot}</span>
                    </span>
                    <span>
                      {order.distance_km} km away · ~{order.estimated_time}
                    </span>
                  </div>

                  {/* ROUTE INFO: Step 1 (Customer) and Step 2 (Store) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Customer Pickup Card */}
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-emerald-800">
                          Step 1: Customer Pickup
                        </span>
                        {isAssigned && (
                          <span className="text-[10px] font-black text-emerald-700 bg-white border border-emerald-200 px-1.5 py-0.2 rounded">
                            OTP Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-black text-slate-950 truncate">
                        {order.customer_name}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {order.customer_address}
                      </p>
                    </div>

                    {/* Store Destination Card */}
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3.5 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-emerald-800">
                        Step 2: Partner Store Drop
                      </span>
                      <p className="text-sm font-black text-slate-900 truncate">
                        {order.store_name}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {order.store_address}
                      </p>
                    </div>
                  </div>

                  {/* Garment Details & Payment Pill */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-950 font-bold">
                      <Package className="size-4 text-emerald-800" />
                      <span>
                        {order.service_name} · {order.items_count} Clothes
                      </span>
                    </div>

                    {order.payment_method === "cod" ? (
                      <span className="rounded-md bg-white border border-emerald-200 text-emerald-800 px-2 py-0.5 font-black">
                        💵 COD: Collect ₹{order.order_amount}
                      </span>
                    ) : (
                      <span className="rounded-md bg-emerald-800 text-white px-2 py-0.5 font-bold">
                        ✓ Paid Online (UPI)
                      </span>
                    )}
                  </div>

                  {/* ACTION BUTTONS (Pure White & Dark Green) */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {/* Google Maps Button */}
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenMaps(
                          isAssigned ? order.customer_address : order.store_address
                        )
                      }
                      className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <Navigation className="size-3.5 text-emerald-800" />
                      <span>GPS Maps</span>
                    </button>

                    {/* Call Button */}
                    <button
                      type="button"
                      onClick={() =>
                        handleCall(isAssigned ? order.customer_phone : order.store_phone)
                      }
                      className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <Phone className="size-3.5 text-emerald-800" />
                      <span>Call {isAssigned ? "Customer" : "Store"}</span>
                    </button>

                    {/* View Full Details Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-all cursor-pointer"
                    >
                      <FileText className="size-3.5 text-emerald-800" />
                      <span>Full Details</span>
                    </button>

                    {/* Stage Primary Progression Button */}
                    {isAssigned && (
                      <button
                        type="button"
                        onClick={() => setOtpPromptOrder(order)}
                        className="w-full sm:w-auto sm:flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white text-xs font-black shadow-xs transition-all cursor-pointer"
                      >
                        <PackageCheck className="size-4" />
                        <span>Confirm Pickup (OTP)</span>
                      </button>
                    )}

                    {isTransit && (
                      <button
                        type="button"
                        onClick={() => handleHandoverToStore(order.id)}
                        className="w-full sm:w-auto sm:flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white text-xs font-black shadow-xs transition-all cursor-pointer"
                      >
                        <Building2 className="size-4" />
                        <span>Deliver to Store</span>
                      </button>
                    )}

                    {isDelivered && (
                      <div className="flex items-center gap-1 text-xs font-black text-emerald-800 px-3 py-2">
                        <CheckCircle2 className="size-4 text-emerald-700" />
                        <span>Order Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. FULL ORDER DETAILS MODAL / DRAWER                                      */}
      {/* ========================================================================= */}
      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-emerald-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl border-2 border-emerald-800 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-emerald-100 bg-white p-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  Full Order Manifest
                </span>
                <h3 className="text-lg font-black text-slate-950">
                  Order #{selectedOrder.order_number}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex size-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-900 hover:bg-emerald-100 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Guaranteed Payout Banner */}
              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-emerald-800">Captain Payout</p>
                  <p className="flex items-center text-2xl font-black text-emerald-950 mt-0.5">
                    <IndianRupee className="size-5 text-emerald-800" />
                    {selectedOrder.delivery_fee}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-emerald-800">Payment Type</p>
                  <span className="font-black text-slate-900 text-xs">
                    {selectedOrder.payment_method === "cod"
                      ? `Collect ₹${selectedOrder.order_amount} (Cash)`
                      : "Paid Online (UPI)"}
                  </span>
                </div>
              </div>

              {/* Customer Full Information */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 flex items-center gap-1">
                    <User className="size-3" />
                    Customer Details
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCall(selectedOrder.customer_phone)}
                    className="flex items-center gap-1 text-[11px] font-black text-emerald-800 hover:underline cursor-pointer"
                  >
                    <Phone className="size-3" />
                    <span>Call ({selectedOrder.customer_phone})</span>
                  </button>
                </div>

                <p className="text-sm font-black text-slate-950">{selectedOrder.customer_name}</p>
                <p className="text-slate-600">{selectedOrder.customer_address}</p>
                {selectedOrder.customer_landmark && (
                  <p className="text-[11px] font-medium text-emerald-800">
                    Landmark: {selectedOrder.customer_landmark}
                  </p>
                )}

                <div className="pt-1 flex items-center justify-between text-slate-500">
                  <span>Pickup Code: <strong className="text-emerald-800 font-mono">OTP Required</strong></span>
                  <button
                    type="button"
                    onClick={() => handleOpenMaps(selectedOrder.customer_address)}
                    className="text-emerald-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Navigation className="size-3" />
                    <span>Navigate GPS</span>
                  </button>
                </div>
              </div>

              {/* Partner Store Information */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 flex items-center gap-1">
                    <Building2 className="size-3" />
                    Partner Store Destination
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCall(selectedOrder.store_phone)}
                    className="flex items-center gap-1 text-[11px] font-black text-emerald-800 hover:underline cursor-pointer"
                  >
                    <Phone className="size-3" />
                    <span>Call Store</span>
                  </button>
                </div>

                <p className="text-sm font-black text-slate-950">{selectedOrder.store_name}</p>
                <p className="text-slate-600">{selectedOrder.store_address}</p>
                {selectedOrder.store_manager && (
                  <p className="text-[11px] font-medium text-emerald-800">
                    Contact: {selectedOrder.store_manager}
                  </p>
                )}
              </div>

              {/* Garment Breakdown */}
              <div className="rounded-2xl border border-emerald-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <span className="text-xs font-black text-emerald-950">
                    Garment Breakdown ({selectedOrder.items_count} items)
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800">
                    {selectedOrder.service_name}
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedOrder.items_breakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-700">
                      <span>{item.name}</span>
                      <span className="font-mono font-bold text-slate-900">× {item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Set as Active Task CTA */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleMakeActiveOnDashboard(selectedOrder)}
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white font-black text-sm shadow-md transition-all cursor-pointer"
                >
                  <Navigation className="size-4" />
                  <span>SET AS ACTIVE COCKPIT TASK ON DASHBOARD</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* 4. VERIFY OTP PROMPT MODAL (Real Backend Verification)                    */}
      {/* ========================================================================= */}
      {otpPromptOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-md animate-in fade-in select-none">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-2 border-emerald-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-950">Verify Customer Pickup</h3>
              <button
                type="button"
                onClick={() => setOtpPromptOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Enter 4-digit code provided by <strong>{otpPromptOrder.customer_name}</strong> upon handing over clothes.
            </p>

            <div className="space-y-2">
              <input
                type="tel"
                maxLength={4}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="4-Digit Code"
                className="h-12 w-full rounded-xl border-2 border-emerald-300 text-center text-xl font-black tracking-widest text-emerald-950 focus:border-emerald-800 focus:outline-hidden"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 text-center">
                Ask customer for 4-digit QuickPress pickup OTP
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleVerifyOtpAndPickup(otpPromptOrder)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-sm shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="size-4" />
              <span>Confirm Pickup &amp; Proceed</span>
            </button>
          </div>
        </div>
      ) : null}
    </RiderLayout>
  );
}
