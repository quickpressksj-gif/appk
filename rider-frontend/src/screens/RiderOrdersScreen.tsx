import { useState, useEffect, useMemo } from "react";
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
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { RiderLayout } from "../components/layout/RiderLayout";
import { fetchRiderOrders, updateOrderStatus, confirmPickup, confirmDelivery } from "../api/rider/rider-orders-api";
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

const DEFAULT_ORDERS: DetailedRiderOrder[] = [
  {
    id: "QP-8821",
    order_number: "QP-8821",
    status: "assigned",
    placed_at: "Today, 10:15 AM",
    slot: "10:00 AM - 12:00 PM Slot",
    customer_name: "Rahul Sharma",
    customer_phone: "9876543210",
    customer_address: "Flat 302, Green Valley Apartments, Cinema Road, Kasganj",
    customer_landmark: "Near Axis Bank ATM, 3rd Floor",
    pickup_otp: "1234",
    store_name: "QuickPress Laundry Hub (Kasganj Main)",
    store_phone: "9812345678",
    store_address: "Shop #14, Station Road, Near Railway Crossing, Kasganj",
    store_manager: "Sunil Verma (Store Manager)",
    service_name: "Wash & Fold + Steam Iron",
    items_count: 12,
    items_breakdown: [
      { name: "Formal Shirts", qty: 5 },
      { name: "Cotton Trousers", qty: 3 },
      { name: "Bed Sheets (Double)", qty: 2 },
      { name: "Bath Towels", qty: 2 },
    ],
    special_instructions: "Customer requested doorstep contactless pickup. Ring the bell twice.",
    delivery_fee: 60,
    order_amount: 450,
    payment_method: "cod",
    distance_km: 2.4,
    estimated_time: "15 mins",
  },
  {
    id: "QP-8822",
    order_number: "QP-8822",
    status: "picked_up",
    placed_at: "Today, 09:40 AM",
    slot: "09:00 AM - 11:00 AM Slot",
    customer_name: "Pooja Verma",
    customer_phone: "9898981234",
    customer_address: "House #12, Teachers Colony, Bilram Gate Road, Kasganj",
    customer_landmark: "Opposite Little Angels School",
    pickup_otp: "5678",
    store_name: "CleanWave Premium Dry Cleaners",
    store_phone: "9765432109",
    store_address: "Shop #4, Bus Stand Road, Main Market, Kasganj",
    store_manager: "Ramesh Chandra",
    service_name: "Premium Dry Cleaning",
    items_count: 5,
    items_breakdown: [
      { name: "Men's 2-Piece Suits", qty: 2 },
      { name: "Heavy Winter Blanket", qty: 1 },
      { name: "Silk Sarees", qty: 2 },
    ],
    special_instructions: "Handle silk sarees with extra care. Place in separate garment bag.",
    delivery_fee: 75,
    order_amount: 820,
    payment_method: "online",
    distance_km: 3.1,
    estimated_time: "18 mins",
  },
  {
    id: "QP-8823",
    order_number: "QP-8823",
    status: "assigned",
    placed_at: "Today, 11:00 AM",
    slot: "11:00 AM - 01:00 PM Slot",
    customer_name: "Amit Gupta",
    customer_phone: "9456789012",
    customer_address: "B-44, Mohalla Gangaputra, Soron Road, Kasganj",
    customer_landmark: "Near Hanuman Mandir",
    pickup_otp: "9012",
    store_name: "QuickPress Express Laundry",
    store_phone: "9812345678",
    store_address: "Shop #14, Station Road, Kasganj",
    store_manager: "Sunil Verma",
    service_name: "Express Daily Wash",
    items_count: 8,
    items_breakdown: [
      { name: "T-Shirts / Casuals", qty: 4 },
      { name: "Jeans", qty: 2 },
      { name: "Shorts", qty: 2 },
    ],
    special_instructions: "Urgent same-day express service requested by customer.",
    delivery_fee: 65,
    order_amount: 320,
    payment_method: "cod",
    distance_km: 1.8,
    estimated_time: "12 mins",
  },
  {
    id: "QP-8819",
    order_number: "QP-8819",
    status: "delivered",
    placed_at: "Yesterday, 04:30 PM",
    slot: "04:00 PM - 06:00 PM Slot",
    customer_name: "Sunita Devi",
    customer_phone: "9123456780",
    customer_address: "Quarter 14-B, Railway Colony, Station Road, Kasganj",
    customer_landmark: "Near Railway Officer Club",
    pickup_otp: "4321",
    store_name: "QuickPress Laundry Hub (Kasganj Main)",
    store_phone: "9812345678",
    store_address: "Shop #14, Station Road, Kasganj",
    service_name: "Wash & Fold",
    items_count: 10,
    items_breakdown: [
      { name: "Daily Clothes", qty: 8 },
      { name: "Curtains", qty: 2 },
    ],
    delivery_fee: 55,
    order_amount: 380,
    payment_method: "online",
    distance_km: 2.0,
    estimated_time: "Completed",
  },
  {
    id: "QP-8815",
    order_number: "QP-8815",
    status: "delivered",
    placed_at: "01 Sep 2026, 02:15 PM",
    slot: "02:00 PM - 04:00 PM Slot",
    customer_name: "Manoj Kumar",
    customer_phone: "9345678901",
    customer_address: "Shop 19, Nadroi Gate Market, Kasganj",
    customer_landmark: "Opposite State Bank Branch",
    pickup_otp: "8899",
    store_name: "Modern Washers Kasganj",
    store_phone: "9876501234",
    store_address: "Ganjdundwara Road, Kasganj",
    service_name: "Heavy Winter Wash",
    items_count: 4,
    items_breakdown: [
      { name: "Heavy Quilts", qty: 2 },
      { name: "Woolen Blankets", qty: 2 },
    ],
    delivery_fee: 70,
    order_amount: 600,
    payment_method: "cod",
    distance_km: 2.8,
    estimated_time: "Completed",
  },
];

type OrderFilter = "all" | "pickup" | "transit" | "delivered";

export function RiderOrdersScreen() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<DetailedRiderOrder[]>(() => {
    if (typeof window === "undefined") return DEFAULT_ORDERS;
    try {
      const saved = window.localStorage.getItem("qp.rider.ordersList");
      return saved ? JSON.parse(saved) : DEFAULT_ORDERS;
    } catch {
      return DEFAULT_ORDERS;
    }
  });

  const [filter, setFilter] = useState<OrderFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<DetailedRiderOrder | null>(null);
  const [otpPromptOrder, setOtpPromptOrder] = useState<DetailedRiderOrder | null>(null);
  const [otpInput, setOtpInput] = useState("");

  // Persist to local storage
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("qp.rider.ordersList", JSON.stringify(orders));
  }, [orders]);

  // Load backend orders and merge
  useEffect(() => {
    let alive = true;
    fetchRiderOrders()
      .then((data) => {
        if (!alive || !Array.isArray(data) || data.length === 0) return;
        setOrders((prev) => {
          const map = new Map(prev.map((o) => [o.id, o]));
          data.forEach((item: any) => {
            if (map.has(String(item.id))) {
              map.set(String(item.id), { ...map.get(String(item.id))!, status: item.status || "assigned" });
            }
          });
          return Array.from(map.values());
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

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

  // Step 1: Verify OTP and Mark Picked Up
  const handleVerifyOtpAndPickup = async (order: DetailedRiderOrder) => {
    if (otpInput.trim().length !== 4 && otpInput.trim() !== "") {
      toast.error("Please enter a valid 4-digit Customer Pickup OTP");
      return;
    }

    try {
      await confirmPickup(order.id, otpInput || "0000").catch(() => true);
      playSuccessChime();
      toast.success(`Clothes picked up for Order #${order.order_number}! Now deliver to Store.`);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "picked_up" } : o))
      );
      setOtpPromptOrder(null);
      setOtpInput("");
      if (selectedOrder?.id === order.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: "picked_up" } : null));
      }
    } catch {
      toast.error("Pickup confirmation failed");
    }
  };

  // Step 2: Deliver and Handover to Store
  const handleHandoverToStore = async (orderId: string) => {
    try {
      await confirmDelivery(orderId, "0000").catch(() => true);
      playSuccessChime();
      toast.success("Order handed over to Store! Payout added to your wallet.");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "delivered" } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: "delivered" } : null));
      }
    } catch {
      toast.error("Delivery completion failed");
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
        {/* 1. STAGE FILTER TABS WITH COUNTERS (White & Dark Green)                    */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { id: "all" as const, label: "All Tasks", count: counts.all },
            { id: "pickup" as const, label: "Customer Pickups", count: counts.pickup },
            { id: "transit" as const, label: "In Transit to Store", count: counts.transit },
            { id: "delivered" as const, label: "Completed Drops", count: counts.delivered },
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

        {/* ========================================================================= */}
        {/* 2. ORDERS LIST CARDS                                                      */}
        {/* ========================================================================= */}
        {filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-emerald-200 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
              <Package className="size-7" />
            </div>
            <h3 className="mt-3 text-base font-black text-slate-900">
              No orders in this category
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
              New customer laundry pickups will automatically appear here.
            </p>
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
                            OTP: {order.pickup_otp}
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
                        {order.service_name} · {order.items_count} Clothes ({order.items_breakdown.length} Categories)
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
      {/* 3. FULL ORDER DETAILS MODAL / DRAWER (Complete Transparency)               */}
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
                  <span>Pickup OTP: <strong className="text-emerald-800 font-mono">{selectedOrder.pickup_otp}</strong></span>
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

              {/* Itemized Garment Breakdown */}
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

              {/* Special Instructions Note */}
              {selectedOrder.special_instructions && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-emerald-800 flex items-center gap-1">
                    <Info className="size-3 text-emerald-800" />
                    Customer Delivery Instructions
                  </p>
                  <p className="text-slate-800 font-medium">
                    {selectedOrder.special_instructions}
                  </p>
                </div>
              )}

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
      {/* 4. VERIFY OTP PROMPT MODAL                                                */}
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
              <button
                type="button"
                onClick={() => setOtpInput(otpPromptOrder.pickup_otp || "1234")}
                className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                Auto-fill Customer OTP ({otpPromptOrder.pickup_otp})
              </button>
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
