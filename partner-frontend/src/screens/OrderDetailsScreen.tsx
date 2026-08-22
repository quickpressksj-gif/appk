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
import { useState } from "react";
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

export function OrderDetailsScreen() {
  const navigate = useNavigate();
  const { orderId } = useParams({ from: partnerRoutes.orderDetails });
  const { orders, isLoading } = usePartnerOrders();
  const { handleAction, sheetNode, overlay, busy } = useOrderActionHandler();

  const order = orders.find((item) => item.id === orderId);

  const copyCode = () => {
    if (order?.code) {
      navigator.clipboard.writeText(order.code);
      toast.success(`Order Code ${order.code} copied!`);
    }
  };

  return (
    <PartnerLayout
      activeTab="orders"
      title={order ? `Order #${order.code}` : "Order Details"}
      subtitle={order ? `Status: ${STAGE_LABEL[order.stage]}` : ""}
    >
      {/* ========================================================================= */}
      {/* MOBILE ZOMATO ORDER DETAILS VIEW (< md)                                   */}
      {/* ========================================================================= */}
      <div className="min-h-screen bg-[#F4F5F7] pb-32 text-zinc-900 md:hidden">
        {/* Sticky Mobile Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-white px-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: partnerRoutes.orders })}
              className="text-zinc-800 p-1 active:scale-95"
            >
              <ArrowLeft className="size-5" />
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
              <p className="text-[10px] font-semibold text-zinc-500">
                {order ? STAGE_LABEL[order.stage] : "Loading"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {order ? (
              <a
                href={`tel:${order.customerPhone.replace(/\s/g, "")}`}
                className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 active:scale-95"
              >
                <PhoneCall className="size-4" />
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => toast.success("Invoice receipt ready for print")}
              className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 active:scale-95"
            >
              <Printer className="size-4" />
            </button>
          </div>
        </header>

        {isLoading ? (
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
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800 text-xs font-black">
                    🧺
                  </span>
                  <div>
                    <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      {STAGE_LABEL[order.stage]}
                    </span>
                    <p className="mt-0.5 text-[11px] font-semibold text-zinc-500">
                      Booked {order.placedAt}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black text-zinc-900">₹{order.amount}</span>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">
                    {order.paymentMode === "cod" ? "Cash on Delivery" : "Paid Online"}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Details Card */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-black text-zinc-900">{order.customerName}</p>
                    <span className="flex items-center gap-0.5 rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-bold text-zinc-700">
                      <Star className="size-2.5 fill-current text-amber-500" />
                      {order.customerRating > 0 ? order.customerRating.toFixed(1) : "5.0"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 font-medium">
                    {order.customerPhone} · {order.customerOrders} orders placed
                  </p>
                </div>

                <a
                  href={`tel:${order.customerPhone.replace(/\s/g, "")}`}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs active:scale-95 shrink-0"
                >
                  <PhoneCall className="size-3.5" />
                  <span>Call</span>
                </a>
              </div>
            </div>

            {/* Booked Services & Items */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-600">
                Items & Services ({order.items.length})
              </h2>

              <div className="mt-3 divide-y divide-zinc-100">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-700">
                        {item.qty}×
                      </span>
                      <div>
                        <p className="text-xs font-black text-zinc-900">{item.name}</p>
                        <p className="text-[10px] text-zinc-400 font-medium">₹{item.price} per unit</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-zinc-900">
                      ₹{item.qty * item.price}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="mt-4 space-y-2 border-t border-dashed border-zinc-200 pt-3">
                <Row label="Item Subtotal" value={`₹${order.charges.subtotal}`} />
                <Row label="Pickup & Delivery Fee" value={order.charges.pickupFee > 0 ? `₹${order.charges.pickupFee}` : "FREE"} />
                <Row label="Taxes & Platform Fees" value={`₹${order.charges.taxes}`} />
                {order.charges.discount > 0 ? (
                  <Row label="Discount Applied" value={`-₹${order.charges.discount}`} />
                ) : null}
                <div className="border-t border-zinc-200 pt-2">
                  <Row label="Total Bill Value" value={`₹${order.amount}`} strong />
                </div>
              </div>
            </div>

            {/* Delivery Rider Card */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-600">
                Delivery Logistics
              </h2>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Bike className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-zinc-900">
                    {order.assignedRider?.name || "Rider being dispatched"}
                  </p>
                  <p className="text-[10px] font-medium text-zinc-500">
                    {order.assignedRider ? `Vehicle: ${order.assignedRider.vehicleNumber}` : "QuickPress Logistics Team"}
                  </p>
                </div>
              </div>
            </div>

            {/* Live Order Timeline */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-600">
                Order Timeline
              </h2>
              <div className="mt-3">
                <OrderTimeline timeline={order.timeline} stage={order.stage} />
              </div>
            </div>
          </div>
        )}

        {/* Sticky Mobile Bottom Order Action Bar */}
        {order ? (
          <div className="fixed bottom-0 inset-x-0 z-30 bg-white p-3 border-t border-zinc-200 shadow-2xl">
            <div className="mx-auto max-w-md">
              <OrderActionBar
                order={order}
                onAction={handleAction}
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
        {isLoading ? (
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
                        {order.customerName}
                      </p>
                      <span className="flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-foreground">
                        <Star className="size-3 fill-current text-brand-green" />
                        {order.customerRating > 0 ? order.customerRating.toFixed(1) : "5.0"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground font-medium">
                      {order.customerPhone} · {order.customerOrders} previous orders
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Booked at {order.placedAt}
                    </p>
                  </div>
                  <OrderStatusBadge order={order} />
                </div>

                <div className="mt-5 flex gap-3">
                  <a
                    href={`tel:${order.customerPhone.replace(/\s/g, "")}`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-muted/40 py-3 text-xs font-bold text-foreground transition-colors hover:bg-muted active:scale-95"
                  >
                    <PhoneCall className="size-4 text-brand-green" />
                    Call Customer
                  </a>
                </div>
              </section>

              {/* Items & Services Card */}
              <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
                <SectionHeading title="Booked Services & Items" />
                <div className="mt-4 space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/20 text-brand-dark font-bold text-xs">
                          <Package className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {item.qty} × ₹{item.price}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-foreground">
                        ₹{item.qty * item.price}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="mt-6 space-y-2.5 border-t border-dashed border-border/80 pt-4">
                  <Row label="Item Subtotal" value={`₹${order.charges.subtotal}`} />
                  <Row label="Pickup & Delivery" value={order.charges.pickupFee > 0 ? `₹${order.charges.pickupFee}` : "FREE"} />
                  <Row label="Taxes & Fees" value={`₹${order.charges.taxes}`} />
                  {order.charges.discount > 0 ? (
                    <Row label="Discount Applied" value={`-₹${order.charges.discount}`} />
                  ) : null}
                  <div className="border-t border-border pt-2.5">
                    <Row label="Total Order Value" value={`₹${order.amount}`} strong />
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
                    {order.paymentStatus}
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
                    onAction={handleAction}
                    busyAction={busy?.orderId === order.id ? busy.actionId : null}
                  />
                </div>
              </section>

              {/* Live Timeline */}
              <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
                <SectionHeading title="Order Timeline" />
                <div className="mt-4">
                  <OrderTimeline timeline={order.timeline} stage={order.stage} />
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
                    <p className="text-xs font-bold text-foreground">
                      {order.assignedRider?.name || "Rider being assigned"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {order.assignedRider ? `Vehicle: ${order.assignedRider.vehicleNumber}` : "QuickPress Logistics"}
                    </p>
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
