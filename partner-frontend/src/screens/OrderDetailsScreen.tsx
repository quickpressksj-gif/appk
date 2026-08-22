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
    <PartnerLayout
      activeTab="orders"
      title={order ? `Order #${order.code}` : "Order Details"}
      subtitle={order ? `Status: ${STAGE_LABEL[order.stage]}` : ""}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-4 md:px-8 md:py-6">
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
