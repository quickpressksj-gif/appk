import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Bike,
  CreditCard,
  FileText,
  IndianRupee,
  MapPin,
  MessageSquareQuote,
  Navigation,
  Package,
  PhoneCall,
  Star,
} from "lucide-react";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerTopBar } from "../components/PartnerTopBar";
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
      <span className="font-semibold text-muted-foreground">{label}</span>
      <span
        className={`text-right ${strong ? "text-sm font-black text-foreground" : "font-bold text-foreground"}`}
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

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md md:max-w-3xl lg:max-w-5xl">
        <PartnerTopBar
          title={order ? order.code : "Order Details"}
          subtitle={order ? STAGE_LABEL[order.stage] : ""}
          onBack={() => navigate({ to: partnerRoutes.orders })}
        />

        <div className="px-5 pb-40 pt-4">
          {isLoading ? (
            <OrderDetailSkeleton />
          ) : !order ? (
            <div className="card-soft border border-border px-6 py-12 text-center">
              <p className="text-sm font-black tracking-tight text-foreground">Order not found</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                This order may have been removed from your queue.
              </p>
            </div>
          ) : (
            <div className="animate-soft-fade grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
              <div className="space-y-5">
                {/* Customer information */}
                <section className="card-soft border border-border p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-base font-black tracking-tight text-foreground">
                          {order.customerName}
                        </p>
                        <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[0.62rem] font-bold text-foreground">
                          <Star className="size-3 fill-current text-brand-green" />
                          {order.customerRating.toFixed(1)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[0.7rem] font-semibold text-muted-foreground">
                        {order.customerPhone} · {order.customerOrders} orders with you
                      </p>
                      <p className="text-[0.7rem] font-semibold text-muted-foreground">
                        Placed {order.placedAt}
                      </p>
                    </div>
                    <OrderStatusBadge order={order} />
                  </div>

                  <div className="mt-4 flex gap-2">
                    <a
                      href={`tel:${order.customerPhone.replace(/\s/g, "")}`}
                      className="ripple flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-xs font-bold tracking-tight text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.97]"
                    >
                      <PhoneCall className="size-4" />
                      Call
                    </a>
                    <button
                      type="button"
                      className="ripple flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-xs font-bold tracking-tight text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.97]"
                    >
                      <Navigation className="size-4" />
                      Navigate
                    </button>
                  </div>
                </section>

                {/* Addresses */}
                <section className="card-soft border border-border p-4">
                  <SectionHeading title="Pickup & Delivery" />
                  <div className="mt-4 space-y-4">
                    <div className="flex gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                        <MapPin className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                          Pickup · {order.pickupTime}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-foreground">
                          {order.pickupAddress}
                        </p>
                        <p className="text-[0.68rem] font-semibold text-muted-foreground">
                          {order.distanceKm} km from your store
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-brand-green-dark">
                        <Bike className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                          Delivery ETA · {order.deliveryEta}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-foreground">
                          {order.deliveryAddress}
                        </p>
                        {order.assignedRider ? (
                          <p className="text-[0.68rem] font-semibold text-brand-green-dark">
                            Rider assigned · {order.assignedRider}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Service breakdown */}
                <section className="card-soft border border-border">
                  <div className="p-4 pb-0">
                    <SectionHeading title={`Service breakdown · ${order.itemCount} items`} />
                  </div>
                  <div className="mt-4 divide-y divide-border">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold tracking-tight text-foreground">
                            {item.name}
                          </p>
                          <p className="text-[0.68rem] font-semibold text-muted-foreground">
                            {item.service} · Qty {item.qty}
                          </p>
                        </div>
                        <span className="flex shrink-0 items-center gap-0.5 text-sm font-black text-foreground">
                          <IndianRupee className="size-3.5" />
                          {item.price.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Pricing summary */}
                <section className="card-soft border border-border p-4">
                  <SectionHeading title="Pricing summary" />
                  <div className="mt-4 space-y-2.5">
                    <Row label="Subtotal" value={`₹${order.charges.subtotal.toLocaleString("en-IN")}`} />
                    <Row label="Pickup & delivery" value={`₹${order.charges.pickupFee}`} />
                    <Row label="Taxes (5%)" value={`₹${order.charges.taxes}`} />
                    <Row label="Discount" value={`− ₹${order.charges.discount}`} />
                    <div className="border-t border-border pt-2.5">
                      <Row
                        label="Total"
                        value={`₹${order.charges.total.toLocaleString("en-IN")}`}
                        strong
                      />
                    </div>
                  </div>
                </section>

                {/* Special instructions */}
                <section className="card-soft border border-border p-4">
                  <SectionHeading title="Special instructions" />
                  <p className="mt-3 flex gap-2 text-xs font-medium text-muted-foreground">
                    <MessageSquareQuote className="size-4 shrink-0" />
                    {order.specialInstructions || "No special instructions from the customer."}
                  </p>
                </section>
              </div>

              <div className="space-y-5">
                {/* Timeline */}
                <section className="card-soft border border-border p-4">
                  <SectionHeading title="Order timeline" />
                  <div className="mt-4">
                    <OrderTimeline order={order} />
                  </div>
                </section>

                {/* Payment details */}
                <section className="card-soft border border-border p-4">
                  <SectionHeading title="Payment details" />
                  <div className="mt-4 space-y-2.5">
                    <Row
                      label="Mode"
                      value={order.paymentMode === "cod" ? "Cash on delivery" : "Online (UPI)"}
                    />
                    <Row
                      label="Status"
                      value={
                        order.paymentStatus === "paid"
                          ? "Paid"
                          : order.paymentStatus === "refunded"
                            ? "Refunded"
                            : "Pending"
                      }
                    />
                    <Row label="Payable to store" value={`₹${order.amount.toLocaleString("en-IN")}`} />
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-[0.68rem] font-semibold text-muted-foreground">
                    <CreditCard className="size-3.5" />
                    Settlement reflects in your wallet within 24 hours of delivery.
                  </p>
                </section>

                {/* Invoice placeholder */}
                <section className="card-soft border border-border p-4">
                  <SectionHeading title="Invoice" />
                  <div className="mt-3 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center">
                    <FileText className="mx-auto size-6 text-muted-foreground" />
                    <p className="mt-2 text-xs font-bold tracking-tight text-foreground">
                      {order.invoiceNo ?? "Invoice generates after delivery"}
                    </p>
                    <p className="mt-1 text-[0.68rem] font-medium text-muted-foreground">
                      Downloadable PDF arrives with the billing integration.
                    </p>
                  </div>
                </section>

                {/* Cancelled reason */}
                {order.cancelReason ? (
                  <section className="card-soft border border-destructive/25 p-4">
                    <SectionHeading title="Cancellation reason" />
                    <p className="mt-2 text-xs font-bold text-destructive">{order.cancelReason}</p>
                  </section>
                ) : null}

                <p className="flex items-center gap-2 px-1 text-[0.68rem] font-semibold text-muted-foreground">
                  <Package className="size-3.5" />
                  {order.services.join(" · ")}
                </p>
              </div>
            </div>
          )}
        </div>

        {order ? (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
            <div className="mx-auto w-full max-w-md px-5 py-4 md:max-w-3xl lg:max-w-5xl">
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

      {sheetNode}
      {overlay}
      <Toaster />
    </main>
  );
}
