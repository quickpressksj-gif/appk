/**
 * The order lifecycle engine of the mock backend.
 *
 * Every transition below is the mock equivalent of one FastAPI endpoint, and
 * every guard mirrors a rule the real backend must enforce:
 *
 *   customer places      → placed
 *   partner accepts      → partner_accepted → (auto) rider_assigned
 *   rider picks up       → picked_up → at_partner
 *   partner processes    → processing
 *   partner completes    → completed
 *   rider delivers       → out_for_delivery → delivered
 */

import type {
  Order,
  OrderLifecycleStatus,
  OrderLine,
  OrderTotals,
  PlaceOrderPayload,
} from "@shared/types";
import { ORDER_STATUS_LABEL } from "@shared/types/order";

import { ApiError } from "../core/errors";
import { getDb, mutateDb } from "./db";
import type { MockDb } from "./db";

type Actor = "customer" | "partner" | "rider" | "admin" | "system";

function nowIso(): string {
  return new Date().toISOString();
}

function otp(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function findOrder(orderId: string): Order {
  const db = getDb();
  const order = db.orders.find((item) => item.id === orderId || item.code === orderId);
  if (!order) throw new ApiError("not-found", `Order ${orderId} does not exist`, 404);
  return order;
}

function notify(
  db: MockDb,
  accountId: string | null | undefined,
  role: "customer" | "partner" | "rider" | "admin",
  title: string,
  description: string,
): void {
  if (!accountId) return;
  db.notifications.unshift({
    id: `ntf-${accountId}-${db.notifications.length}-${Date.now().toString(36)}`,
    accountId,
    role,
    kind: "system",
    title,
    description,
    createdAt: nowIso(),
    read: false,
  });
}

function notifyLifecycle(order: Order, status: OrderLifecycleStatus): void {
  const db = getDb();
  const label = ORDER_STATUS_LABEL[status];
  notify(db, order.customer.id, "customer", label, `Order ${order.code}: ${label}`);
  notify(db, order.partner.id, "partner", label, `Order ${order.code}: ${label}`);
  if (order.rider) notify(db, order.rider.id, "rider", label, `Order ${order.code}: ${label}`);
  const admin = db.accounts.find((account) => account.role === "admin");
  notify(db, admin?.id, "admin", label, `Order ${order.code}: ${label}`);
}

function pushEvent(order: Order, status: OrderLifecycleStatus, actor: Actor): void {
  order.status = status;
  order.updatedAt = nowIso();
  order.events.push({
    id: `${order.code}-evt-${order.events.length}`,
    status,
    label: ORDER_STATUS_LABEL[status],
    at: order.updatedAt,
    actor,
  });
  notifyLifecycle(order, status);
}

function expect(order: Order, allowed: OrderLifecycleStatus[], action: string): void {
  if (order.status === "cancelled") {
    throw new ApiError("conflict", `Order ${order.code} was cancelled`, 409);
  }
  if (!allowed.includes(order.status)) {
    throw new ApiError(
      "conflict",
      `Cannot ${action}: order ${order.code} is currently "${ORDER_STATUS_LABEL[order.status]}"`,
      409,
    );
  }
}

function computeTotals(items: OrderLine[], override?: Partial<OrderTotals>): OrderTotals {
  const itemsTotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const base: OrderTotals = {
    itemsTotal,
    pickup: 0,
    delivery: 29,
    handling: 9,
    gst: Math.round(itemsTotal * 0.05),
    discount: 0,
    grandTotal: 0,
  };
  const merged = { ...base, ...(override ?? {}) };
  merged.grandTotal =
    override?.grandTotal ??
    merged.itemsTotal +
      merged.pickup +
      merged.delivery +
      merged.handling +
      merged.gst -
      merged.discount;
  return merged;
}

/** POST /api/orders — customer places an order. */
export function placeOrder(payload: PlaceOrderPayload): Order {
  if (!payload.items || payload.items.length === 0) {
    throw new ApiError("validation", "Add at least one item before placing the order", 422);
  }

  return mutateDb((db) => {
    const customer =
      db.accounts.find((account) => account.id === payload.customerId) ??
      db.accounts.find((account) => account.role === "customer")!;

    const partner =
      db.partners.find((item) => item.id === payload.partnerId) ??
      db.partners.find((item) => item.acceptingNewOrders && item.isOpen) ??
      db.partners[0]!;

    db.counters.order += 1;
    const code = `QP${1040 + db.counters.order}`;
    const createdAt = nowIso();

    const order: Order = {
      id: `ord-${code}`,
      code,
      status: "placed",
      createdAt,
      updatedAt: createdAt,
      customer: { id: customer.id, name: customer.name, phone: customer.phone },
      partner: {
        id: partner.id,
        name: partner.name,
        phone: partner.phone,
        image: partner.image,
        city: partner.city,
      },
      rider: null,
      serviceLabel: payload.serviceLabel ?? payload.items[0]?.name ?? "Laundry",
      items: payload.items,
      totals: computeTotals(payload.items, payload.totals),
      address:
        payload.address ?? {
          label: "Home",
          line: "402, Sunrise Residency, 12th Main",
          city: `${partner.area}, ${partner.city}`,
          phone: customer.phone,
        },
      pickup: payload.pickup,
      delivery: payload.delivery ?? { date: "Tomorrow", slot: "10:00 AM - 12:00 PM" },
      payment: {
        mode: payload.payment.mode,
        label: payload.payment.label,
        note: payload.payment.note ?? (payload.payment.mode === "online" ? "Paid" : "Pay on delivery"),
        paid: payload.payment.mode === "online",
      },
      otp: { pickup: otp(), delivery: otp() },
      events: [
        {
          id: `${code}-evt-0`,
          status: "placed",
          label: ORDER_STATUS_LABEL.placed,
          at: createdAt,
          actor: "customer",
        },
      ],
      cancelledReason: null,
    };

    db.orders.unshift(order);
    return order;
  });
}

function assignRider(db: ReturnType<typeof getDb>, order: Order): void {
  const rider =
    db.riders.find((item) => item.isOnline && item.status === "active") ?? db.riders[0]!;
  order.rider = {
    id: rider.id,
    name: rider.name,
    phone: rider.phone,
    vehicle: rider.vehicle,
    plate: rider.plate,
    rating: rider.rating,
    trips: `${rider.trips}+ trips`,
  };
  pushEvent(order, "rider_assigned", "system");
}

/** POST /api/partner/orders/{id}/accept */
export function partnerAcceptOrder(orderId: string): Order {
  return mutateDb((db) => {
    const order = findOrder(orderId);
    expect(order, ["placed"], "accept order");
    pushEvent(order, "partner_accepted", "partner");
    assignRider(db, order);
    return order;
  });
}

/** POST /api/partner/orders/{id}/reject */
export function partnerRejectOrder(orderId: string, reason: string): Order {
  return mutateDb(() => {
    const order = findOrder(orderId);
    expect(order, ["placed", "partner_accepted"], "reject order");
    order.cancelledReason = reason || "Rejected by store";
    pushEvent(order, "cancelled", "partner");
    return order;
  });
}

/** POST /api/rider/orders/{id}/accept — rider acknowledges the assignment. */
export function riderAcceptAssignment(orderId: string, riderId: string): Order {
  return mutateDb((db) => {
    const order = findOrder(orderId);
    expect(order, ["rider_assigned"], "accept assignment");
    const rider = db.riders.find((item) => item.id === riderId);
    if (rider) {
      order.rider = {
        id: rider.id,
        name: rider.name,
        phone: rider.phone,
        vehicle: rider.vehicle,
        plate: rider.plate,
        rating: rider.rating,
        trips: `${rider.trips}+ trips`,
      };
    }
    order.updatedAt = nowIso();
    return order;
  });
}

/** POST /api/rider/orders/{id}/pickup — laundry collected from the customer. */
export function riderPickupOrder(orderId: string, providedOtp?: string): Order {
  return mutateDb(() => {
    const order = findOrder(orderId);
    expect(order, ["rider_assigned"], "mark picked up");
    if (providedOtp !== undefined && providedOtp !== "" && providedOtp !== order.otp.pickup) {
      throw new ApiError("validation", "That pickup OTP doesn't match", 422);
    }
    pushEvent(order, "picked_up", "rider");
    return order;
  });
}

/** POST /api/rider/orders/{id}/drop-at-partner */
export function riderDropAtPartner(orderId: string): Order {
  return mutateDb(() => {
    const order = findOrder(orderId);
    expect(order, ["picked_up"], "hand over at store");
    pushEvent(order, "at_partner", "rider");
    return order;
  });
}

/** POST /api/partner/orders/{id}/start-processing */
export function partnerStartProcessing(orderId: string): Order {
  return mutateDb(() => {
    const order = findOrder(orderId);
    expect(order, ["picked_up", "at_partner"], "start cleaning");
    if (order.status === "picked_up") pushEvent(order, "at_partner", "rider");
    pushEvent(order, "processing", "partner");
    return order;
  });
}

/** POST /api/partner/orders/{id}/complete — laundry is done. */
export function partnerCompleteOrder(orderId: string): Order {
  return mutateDb(() => {
    const order = findOrder(orderId);
    expect(order, ["picked_up", "at_partner", "processing"], "mark laundry completed");
    if (order.status === "picked_up") pushEvent(order, "at_partner", "rider");
    if (order.status === "at_partner") pushEvent(order, "processing", "partner");
    pushEvent(order, "completed", "partner");
    return order;
  });
}

/** POST /api/rider/orders/{id}/start-delivery */
export function riderStartDelivery(orderId: string): Order {
  return mutateDb(() => {
    const order = findOrder(orderId);
    expect(order, ["completed"], "start delivery");
    pushEvent(order, "out_for_delivery", "rider");
    return order;
  });
}

/** POST /api/rider/orders/{id}/deliver */
export function riderDeliverOrder(orderId: string, providedOtp?: string): Order {
  return mutateDb(() => {
    const order = findOrder(orderId);
    expect(order, ["completed", "out_for_delivery"], "mark delivered");
    if (providedOtp !== undefined && providedOtp !== "" && providedOtp !== order.otp.delivery) {
      throw new ApiError("validation", "That delivery OTP doesn't match", 422);
    }
    if (order.status === "completed") pushEvent(order, "out_for_delivery", "rider");
    order.payment.paid = true;
    pushEvent(order, "delivered", "rider");
    return order;
  });
}

/** POST /api/orders/{id}/cancel — customer cancels before pickup. */
export function cancelOrder(orderId: string, reason: string, actor: Actor = "customer"): Order {
  return mutateDb(() => {
    const order = findOrder(orderId);
    expect(order, ["placed", "partner_accepted", "rider_assigned"], "cancel order");
    order.cancelledReason = reason || "Cancelled by customer";
    pushEvent(order, "cancelled", actor);
    return order;
  });
}

/** POST /api/admin/orders/{id}/assign-rider */
export function adminAssignRider(orderId: string, riderId: string): Order {
  return mutateDb((db) => {
    const order = findOrder(orderId);
    const rider = db.riders.find((item) => item.id === riderId);
    if (!rider) throw new ApiError("not-found", `Rider ${riderId} does not exist`, 404);
    order.rider = {
      id: rider.id,
      name: rider.name,
      phone: rider.phone,
      vehicle: rider.vehicle,
      plate: rider.plate,
      rating: rider.rating,
      trips: `${rider.trips}+ trips`,
    };
    if (order.status === "partner_accepted") pushEvent(order, "rider_assigned", "admin");
    else order.updatedAt = nowIso();
    return order;
  });
}

export function listOrders(filter: {
  customerId?: string | undefined;
  partnerId?: string | undefined;
  riderId?: string | undefined;
  status?: string | undefined;
}): Order[] {
  return getDb().orders.filter((order) => {
    if (filter.customerId && order.customer.id !== filter.customerId) return false;
    if (filter.partnerId && order.partner.id !== filter.partnerId) return false;
    if (filter.riderId && order.rider?.id !== filter.riderId) return false;
    if (filter.status && order.status !== filter.status) return false;
    return true;
  });
}