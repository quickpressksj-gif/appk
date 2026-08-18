/**
 * QuickPress Checkout — customer data layer (Sprint 2.4).
 *
 * One screen, one read:
 *
 *   GET  /api/checkout        address book + pickup schedule + cart totals +
 *                             payment methods + wallet balance
 *   POST /api/orders          place the order
 *
 * The checkout screen renders the view models below unchanged, so the UI needed
 * no redesign — only its data source moved from four calls to one.
 */

import type { Order } from "@shared/types";

import { apiGetJson, apiPostJson } from "../core/transport";
import {
  fetchAddresses as fetchAddressBook,
  fetchCart,
  fetchPaymentMethods,
  fetchPickupSlots,
  type Address,
  type CartData,
  type PaymentMethod,
  type PickupOption,
} from "./cart-api";

export const CHECKOUT_API_ENDPOINTS = {
  checkout: "/api/checkout",
  orders: "/api/orders",
} as const;

export type CheckoutPaymentMethod = PaymentMethod & {
  /** A disabled method (empty wallet, online payments not live yet) can't be picked. */
  enabled: boolean;
  comingSoon: boolean;
};

export type CheckoutData = {
  addresses: Address[];
  selectedAddressId: string;
  days: PickupOption[];
  slots: PickupOption[];
  selectedDay: string;
  selectedSlot: string;
  payments: CheckoutPaymentMethod[];
  selectedPaymentId: string;
  walletBalance: number;
  deliveryEstimate: string;
  cart: CartData;
};

type RawAddress = {
  id: string;
  type?: "home" | "office" | "other";
  label?: string;
  line?: string;
  cityLine?: string;
  phone?: string;
};

type RawPayment = {
  id: string;
  kind: PaymentMethod["kind"];
  name: string;
  note: string;
  enabled?: boolean;
  comingSoon?: boolean;
};

type RawCheckout = {
  addresses?: RawAddress[];
  selectedAddressId?: string;
  pickup?: {
    days?: PickupOption[];
    slots?: PickupOption[];
    selectedDay?: string;
    selectedSlot?: string;
  };
  store?: CartData["store"];
  items?: CartData["items"];
  coupons?: CartData["coupons"];
  charges?: CartData["charges"];
  totals?: CartData["totals"];
  payments?: RawPayment[];
  selectedPaymentId?: string;
  walletBalance?: number;
  deliveryEstimate?: string;
};

const ADDRESS_LABELS = { home: "Home", office: "Office", other: "Other" } as const;

function toAddress(raw: RawAddress): Address {
  return {
    id: raw.id,
    label: ADDRESS_LABELS[raw.type ?? "other"] ?? "Other",
    line: raw.line ?? "",
    city: raw.cityLine ?? "",
    phone: raw.phone ?? "",
  };
}

function toPayment(raw: RawPayment): CheckoutPaymentMethod {
  return {
    id: raw.id,
    kind: raw.kind,
    name: raw.name,
    note: raw.note,
    enabled: raw.enabled !== false,
    comingSoon: raw.comingSoon === true,
  };
}

/** GET /api/checkout — everything the checkout screen needs in one round trip. */
export async function fetchCheckout(couponDiscount = 0): Promise<CheckoutData> {
  const raw = await apiGetJson<RawCheckout>(CHECKOUT_API_ENDPOINTS.checkout, {
    params: { couponDiscount },
  });

  const addresses = (raw.addresses ?? []).map(toAddress);
  const days = raw.pickup?.days ?? [];
  const slots = raw.pickup?.slots ?? [];
  const payments = (raw.payments ?? []).map(toPayment);
  const firstEnabled = payments.find((method) => method.enabled);

  return {
    addresses,
    selectedAddressId: raw.selectedAddressId || (addresses[0]?.id ?? ""),
    days,
    slots,
    selectedDay: raw.pickup?.selectedDay || (days[0]?.id ?? ""),
    selectedSlot: raw.pickup?.selectedSlot || (slots[0]?.id ?? ""),
    payments,
    selectedPaymentId: raw.selectedPaymentId || firstEnabled?.id || "",
    walletBalance: raw.walletBalance ?? 0,
    deliveryEstimate: raw.deliveryEstimate ?? "",
    cart: {
      store: raw.store ?? null,
      items: raw.items ?? [],
      coupons: raw.coupons ?? [],
      charges: raw.charges as CartData["charges"],
      totals: raw.totals as CartData["totals"],
    } as CartData,
  };
}

/**
 * Older builds (and the mock router before Sprint 2.4) have no /api/checkout.
 * Composing the four legacy reads keeps the screen working against them.
 */
export async function fetchCheckoutCompat(couponDiscount = 0): Promise<CheckoutData> {
  try {
    return await fetchCheckout(couponDiscount);
  } catch {
    const [cart, addresses, paymentData, schedule] = await Promise.all([
      fetchCart(couponDiscount),
      fetchAddressBook(),
      fetchPaymentMethods(),
      fetchPickupSlots(),
    ]);
    return {
      addresses,
      selectedAddressId: addresses[0]?.id ?? "",
      days: schedule.days,
      slots: schedule.slots,
      selectedDay: schedule.days[0]?.id ?? "",
      selectedSlot: schedule.slots[0]?.id ?? "",
      payments: paymentData.methods.map((method) => ({
        ...method,
        enabled: true,
        comingSoon: false,
      })),
      selectedPaymentId: paymentData.methods[0]?.id ?? "",
      walletBalance: 0,
      deliveryEstimate: "",
      cart,
    };
  }
}

export type PlaceOrderInput = {
  addressId: string;
  address: Address | undefined;
  items: CartData["items"];
  pickup: { day: string; slot: string; express: boolean };
  payment: CheckoutPaymentMethod | undefined;
  couponCode?: string;
  couponDiscount?: number;
  instructions?: string;
  /** Sent so a double tap or a retry can never create two orders. */
  idempotencyKey: string;
};

export type PlacedOrder = {
  orderId: string;
  orderNumber: string;
  pickupEstimate: string;
  deliveryEstimate: string;
};

/** POST /api/orders — server prices the order and clears the cart. */
export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  const method = input.payment;
  const response = await apiPostJson<
    Partial<PlacedOrder> & { order?: Order; id?: string; code?: string }
  >(CHECKOUT_API_ENDPOINTS.orders, {
    serviceLabel: input.items[0]?.name ?? "Laundry",
    items: input.items.map((item) => ({
      id: item.id,
      name: item.name,
      qty: item.qty,
      price: item.price,
    })),
    addressId: input.addressId,
    address: input.address
      ? {
          label: input.address.label,
          line: input.address.line,
          city: input.address.city,
          phone: input.address.phone,
        }
      : undefined,
    pickup: {
      date: input.pickup.day,
      slot: input.pickup.slot,
      express: input.pickup.express,
    },
    payment: {
      mode: method?.kind === "cod" ? "cod" : "online",
      label: method?.name ?? "Cash on delivery",
      note:
        method?.kind === "cod"
          ? "Pay on delivery"
          : method?.kind === "wallet"
            ? "Paid from QuickPress wallet"
            : (method?.note ?? ""),
      method: method?.id,
    },
    couponCode: input.couponCode ?? "",
    couponDiscount: input.couponDiscount ?? 0,
    instructions: input.instructions ?? "",
    idempotencyKey: input.idempotencyKey,
  });

  // FastAPI returns {orderId, orderNumber, …}; the mock router returns the Order.
  const order = response.order;
  const orderId = response.orderId ?? order?.id ?? response.id ?? "";
  return {
    orderId,
    orderNumber: response.orderNumber ?? order?.code ?? response.code ?? orderId,
    pickupEstimate: response.pickupEstimate ?? "",
    deliveryEstimate: response.deliveryEstimate ?? "",
  };
}
