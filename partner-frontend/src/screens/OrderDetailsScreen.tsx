import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  FileText,
  HelpCircle,
  IndianRupee,
  MapPin,
  MessageSquare,
  MessageSquareQuote,
  Navigation,
  Package,
  PhoneCall,
  Printer,
  Share2,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerLayout } from "../components/layout/PartnerLayout";
import { SectionHeading } from "../components/PartnerPrimitives";
import { OrderActionBar } from "../components/orders/OrderActionBar";
import { OrderStatusBadge } from "../components/orders/OrderCard";
import { OrderDetailSkeleton } from "../components/orders/OrderSkeletons";
import { OrderTimeline } from "../components/orders/OrderTimeline";
import { usePartnerOrders } from "../context/PartnerOrdersContext";
import { useOrderActionHandler } from "../hooks/use-order-action-handler";
import { partnerRoutes } from "../navigation/partner-routes";
import { STAGE_LABEL } from "../data/partner-orders-mock";

import { useEffect, useState } from "react";
import { fetchPartnerOrder } from "@/api/partner/partner-orders-api";

function formatOrderTime(value?: string | number): string {
  if (!value) return "Recently";
  if (typeof value === "string" && (value.includes("ago") || value === "Today" || value === "Yesterday" || value === "Recently")) {
    return value;
  }
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(value);
  }
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="font-semibold text-zinc-500">{label}</span>
      <span
        className={`text-right ${strong ? "text-sm font-black text-zinc-900" : "font-bold text-zinc-800"}`}
      >
        {value}
      </span>
    </div>
  );
}

export function OrderDetailsScreen({ orderId: propOrderId }: { orderId?: string }) {
  const navigate = useNavigate();
  const routeParams = (useParams({ strict: false }) as { orderId?: string }) || {};
  const orderId = propOrderId || routeParams?.orderId;
  const { orders, isLoading } = usePartnerOrders();
  const { handleAction, sheetNode, overlay, busy } = useOrderActionHandler();
  const [fetchedOrder, setFetchedOrder] = useState<ManagedOrder | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  const matchedOrder = orders.find(
    (item) =>
      item.id === orderId ||
      item.code === orderId ||
      item.id?.toLowerCase() === orderId?.toLowerCase() ||
      item.code?.toLowerCase() === orderId?.toLowerCase()
  );

  useEffect(() => {
    if (!matchedOrder && orderId) {
      let active = true;
      setFetchLoading(true);
      fetchPartnerOrder(orderId)
        .then((remote) => {
          if (active && remote) {
            const timeline = Array.isArray(remote?.timeline) ? remote.timeline : [];
            const items = Array.isArray(remote?.items) ? remote.items : [];
            const cancelledEntry = timeline.find((entry) => /reject|cancel/i.test(entry.label));
            setFetchedOrder({
              id: remote.id || (remote as any).orderId || "",
              code: remote.code || remote.id || "",
              stage: (remote.status as any) || "new",
              customerName: remote.customerName || "Customer",
              customerRating: 5.0,
              customerPhone: remote.customerPhone || "",
              customerOrders: 1,
              pickupAddress: remote.address || "",
              deliveryAddress: remote.address || "",
              pickupTime: remote.slot || "Today",
              pickupDay: "today",
              deliveryEta: remote.slot || "Tomorrow",
              distanceKm: 0,
              services: remote.serviceLabel ? [remote.serviceLabel] : [],
              itemCount: remote.itemCount || items.reduce((sum, it) => sum + (it.qty || 1), 0) || 1,
              amount: remote.amount || 0,
              paymentStatus: remote.status === "cancelled" ? "refunded" : remote.paymentMode === "cod" ? "pending" : "paid",
              paymentMode: remote.paymentMode || "cod",
              placedAt: remote.placedAt || "Recently",
              placedMinutesAgo: 0,
              specialInstructions: "",
              items: items.map((item) => ({
                id: item.id || "",
                name: item.name || "Laundry Item",
                service: remote.serviceLabel || "Laundry",
                qty: item.qty || 1,
                price: item.price || 0,
              })),
              charges: {
                subtotal: remote.amount || 0,
                pickupFee: 0,
                taxes: 0,
                discount: 0,
                total: remote.amount || 0,
              },
              timeline: timeline.map((entry) => ({ id: entry.id || "", label: entry.label || "", time: entry.time || "" })),
              invoiceNo: null,
              cancelReason: remote.status === "cancelled" ? (cancelledEntry?.label ?? (remote as any).cancelledReason ?? "Cancelled") : null,
              assignedRider: (remote as any).riderName || null,
            });
          }
        })
        .catch(() => undefined)
        .finally(() => {
          if (active) setFetchLoading(false);
        });
      return () => {
        active = false;
      };
    }
  }, [matchedOrder, orderId]);

  const order = matchedOrder || fetchedOrder;
  const isScreenLoading = (isLoading && !order) || (fetchLoading && !order);

  const copyCode = () => {
    if (order?.code) {
      navigator.clipboard.writeText(order.code);
      toast.success(`Order Code #${order.code} copied!`);
    }
  };

  const stageLabel = order ? (STAGE_LABEL[order.stage] || order.stage || "Active") : "";
  const items = order?.items || [];
  const charges = order?.charges || {
    subtotal: order?.amount || 0,
    pickupFee: 0,
    taxes: 0,
    discount: 0,
    total: order?.amount || 0,
  };
  const timeline = order?.timeline || [];

  const riderName =
    typeof order?.assignedRider === "object" && order?.assignedRider
      ? (order.assignedRider as any).name || "QuickPress Rider"
      : typeof order?.assignedRider === "string" && order.assignedRider
      ? order.assignedRider
      : "Rider being dispatched";

  const riderVehicle =
    typeof order?.assignedRider === "object" && order?.assignedRider
      ? (order.assignedRider as any).vehicleNumber || "QuickPress Logistics"
      : "QuickPress Logistics";

  return (
    <PartnerLayout
      activeTab="orders"
      hideBottomNav={true}
      title={order ? `Order #${order.code}` : "Order Details"}
      subtitle={order ? `Status: ${stageLabel}` : ""}
    >
      {/* ========================================================================= */}
      {/* MOBILE ORDER DETAILS VIEW (< md)                                          */}
      {/* ========================================================================= */}
      <div className="min-h-screen bg-[#F6F7F9] pb-36 text-zinc-900 md:hidden">
        {/* Sticky Mobile Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-white px-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: partnerRoutes.orders })}
              className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 active:scale-95 transition-all"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black tracking-tight text-zinc-900">
                  {order ? `#${order.code}` : "Order Details"}
                </h1>
                <button type="button" onClick={copyCode} className="text-zinc-400 hover:text-zinc-700">
                  <Copy className="size-3.5" />
                </button>
              </div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                {stageLabel || "Loading..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {order?.customerPhone ? (
              <a
                href={`tel:${order.customerPhone.replace(/\s/g, "")}`}
                className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 active:scale-95 shadow-xs"
              >
                <PhoneCall className="size-4" />
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => toast.success("Invoice receipt ready for print")}
              className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 active:scale-95 border border-zinc-200 shadow-xs"
            >
              <Printer className="size-4" />
            </button>
          </div>
        </header>

        {isScreenLoading ? (
          <div className="p-4">
            <OrderDetailSkeleton />
          </div>
        ) : !order ? (
          <div className="p-6 text-center my-8 rounded-2xl bg-white mx-4 border border-zinc-200 shadow-sm">
            <Package className="mx-auto size-12 text-zinc-300" />
            <h3 className="mt-3 text-sm font-black text-zinc-900">Order not found</h3>
            <p className="mt-1 text-xs text-zinc-500">This order may have been archived or removed.</p>
            <button
              type="button"
              onClick={() => navigate({ to: partnerRoutes.orders })}
              className="mt-4 rounded-full bg-zinc-950 px-5 py-2 text-xs font-black text-white"
            >
              Back to Orders
            </button>
          </div>
        ) : (
          <div className="space-y-3.5 p-4">
            {/* Status & Placed Time Banner */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 font-black border border-amber-100">
                    <Sparkles className="size-5" />
                  </span>
                  <div>
                    <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 border border-emerald-200/50">
                      {stageLabel}
                    </span>
                    <p className="mt-1 text-[11px] font-medium text-zinc-500">
                      Booked: <span className="font-bold text-zinc-700">{formatOrderTime(order.placedAt)}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-black tracking-tight text-zinc-900">₹{order.amount || charges.total}</span>
                  <p className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5 inline-block uppercase">
                    {order.paymentMode === "cod" ? "Cash on Delivery" : "Paid Online"}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Details Card */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-black text-zinc-900">{order.customerName || "Customer"}</p>
                    <span className="flex items-center gap-0.5 rounded-full bg-amber-50 border border-amber-200/50 px-2 py-0.5 text-[10px] font-black text-amber-800">
                      <Star className="size-2.5 fill-current text-amber-500" />
                      {order.customerRating && order.customerRating > 0 ? order.customerRating.toFixed(1) : "5.0"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-600 font-semibold">
                    {order.customerPhone || "Phone registered"} · {order.customerOrders || 1} orders placed
                  </p>
                  {order.pickupAddress ? (
                    <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-zinc-500">
                      <MapPin className="size-3.5 shrink-0 text-zinc-400 mt-0.5" />
                      <span className="line-clamp-2">{order.pickupAddress}</span>
                    </p>
                  ) : null}
                </div>

                {order.customerPhone ? (
                  <a
                    href={`tel:${order.customerPhone.replace(/\s/g, "")}`}
                    className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-3.5 py-2 text-xs font-black text-white shadow-md shadow-emerald-600/20 active:scale-95 shrink-0"
                  >
                    <PhoneCall className="size-3.5" />
                    <span>Call</span>
                  </a>
                ) : null}
              </div>
            </div>

            {/* Booked Services & Items */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
              <h2 className="text-[11px] font-black uppercase tracking-wider text-zinc-500">
                Items & Services ({items.length})
              </h2>

              <div className="mt-3 divide-y divide-zinc-100">
                {items.length === 0 ? (
                  <p className="py-2 text-xs text-zinc-500">Standard Laundry Service Package</p>
                ) : (
                  items.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-7 items-center justify-center rounded-xl bg-zinc-100 text-xs font-black text-zinc-800 border border-zinc-200">
                          {item.qty || 1}×
                        </span>
                        <div>
                          <p className="text-xs font-black text-zinc-900">{item.name || "Laundry Service"}</p>
                          <p className="text-[10px] text-zinc-400 font-medium">₹{item.price || 0} per unit</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-zinc-900">
                        ₹{(item.qty || 1) * (item.price || 0)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Price Breakdown */}
              <div className="mt-4 space-y-2 border-t border-dashed border-zinc-200 pt-3">
                <Row label="Item Subtotal" value={`₹${charges.subtotal}`} />
                <Row label="Pickup & Delivery Fee" value={charges.pickupFee > 0 ? `₹${charges.pickupFee}` : "FREE"} />
                <Row label="Taxes & Platform Fees" value={`₹${charges.taxes}`} />
                {charges.discount > 0 ? (
                  <Row label="Discount Applied" value={`-₹${charges.discount}`} />
                ) : null}
                <div className="border-t border-zinc-200 pt-2.5">
                  <Row label="Total Bill Value" value={`₹${order.amount || charges.total}`} strong />
                </div>
              </div>
            </div>

            {/* Delivery Rider Card */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
              <h2 className="text-[11px] font-black uppercase tracking-wider text-zinc-500">
                Delivery Logistics
              </h2>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Bike className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-zinc-900">{riderName}</p>
                  <p className="text-[10px] font-semibold text-zinc-500">{riderVehicle}</p>
                </div>
              </div>
            </div>

            {/* Live Order Timeline */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
              <h2 className="text-[11px] font-black uppercase tracking-wider text-zinc-500">
                Order Timeline
              </h2>
              <div className="mt-3">
                <OrderTimeline timeline={timeline} stage={order.stage} />
              </div>
            </div>
          </div>
        )}

        {/* Sticky Mobile Bottom Order Action Bar */}
        {order ? (
          <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md px-4 py-3 border-t border-zinc-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <div className="mx-auto max-w-lg">
              <OrderActionBar
                order={order}
                size="full"
                onAction={(actionId) => handleAction(order, actionId)}
                busyAction={busy?.orderId === order.id ? busy.actionId : null}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP ORDER DETAILS VIEW (>= md)                                        */}
      {/* ========================================================================= */}
      <div className="hidden mx-auto w-full max-w-6xl px-4 py-4 md:block md:px-8 md:py-6">
        {isScreenLoading ? (
          <OrderDetailSkeleton />
        ) : !order ? (
          <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-sm">
            <p className="text-base font-black text-foreground">Order not found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              This order may have been removed or assigned to another store.
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: partnerRoutes.orders })}
              className="mt-4 inline-flex rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-brand-dark"
            >
              Back to Orders
            </button>
          </div>
        ) : (
          <div className="animate-soft-fade grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
            <div className="space-y-6">
              {/* Customer information */}
              <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-black text-foreground">
                        {order.customerName || "Customer"}
                      </p>
                      <span className="flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-foreground">
                        <Star className="size-3 fill-current text-brand-green" />
                        {order.customerRating && order.customerRating > 0 ? order.customerRating.toFixed(1) : "5.0"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground font-medium">
                      {order.customerPhone} · {order.customerOrders || 1} previous orders
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Booked at {formatOrderTime(order.placedAt)}
                    </p>
                  </div>
                  <OrderStatusBadge order={order} />
                </div>

                {order.customerPhone ? (
                  <div className="mt-5 flex gap-3">
                    <a
                      href={`tel:${order.customerPhone.replace(/\s/g, "")}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-muted/40 py-3 text-xs font-bold text-foreground transition-colors hover:bg-muted active:scale-95"
                    >
                      <PhoneCall className="size-4 text-brand-green" />
                      Call Customer
                    </a>
                  </div>
                ) : null}
              </section>

              {/* Items & Services Card */}
              <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
                <SectionHeading title="Booked Services & Items" />
                <div className="mt-4 space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/20 text-brand-dark font-bold text-xs">
                          <Package className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {item.qty || 1} × ₹{item.price || 0}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-foreground">
                        ₹{(item.qty || 1) * (item.price || 0)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="mt-6 space-y-2.5 border-t border-dashed border-border/80 pt-4">
                  <Row label="Item Subtotal" value={`₹${charges.subtotal}`} />
                  <Row label="Pickup & Delivery" value={charges.pickupFee > 0 ? `₹${charges.pickupFee}` : "FREE"} />
                  <Row label="Taxes & Fees" value={`₹${charges.taxes}`} />
                  {charges.discount > 0 ? (
                    <Row label="Discount Applied" value={`-₹${charges.discount}`} />
                  ) : null}
                  <div className="border-t border-border pt-2.5">
                    <Row label="Total Order Value" value={`₹${order.amount || charges.total}`} strong />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted/40 p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-4 text-muted-foreground" />
                    <span className="font-bold text-foreground capitalize">
                      {order.paymentMode === "cod" ? "Cash on Delivery" : "Online / UPI Payment"}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                      order.paymentStatus === "paid"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {order.paymentStatus || "pending"}
                  </span>
                </div>
              </section>
            </div>

            {/* Right Column: Actions & Order Timeline */}
            <div className="space-y-6">
              {/* Order Status Action Card */}
              <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
                <SectionHeading title="Order Actions" />
                <div className="mt-4">
                  <OrderActionBar
                    order={order}
                    size="full"
                    onAction={(actionId) => handleAction(order, actionId)}
                    busyAction={busy?.orderId === order.id ? busy.actionId : null}
                  />
                </div>
              </section>

              {/* Live Timeline */}
              <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
                <SectionHeading title="Order Timeline" />
                <div className="mt-4">
                  <OrderTimeline timeline={timeline} stage={order.stage} />
                </div>
              </section>

              {/* Assigned Delivery Rider */}
              <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
                <SectionHeading title="Delivery Rider" />
                <div className="mt-3.5 flex items-center gap-3.5">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/20 text-brand-dark">
                    <Bike className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{riderName}</p>
                    <p className="text-[10px] text-muted-foreground">{riderVehicle}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      {sheetNode}
      {overlay}
      <Toaster />
    </PartnerLayout>
  );
}
