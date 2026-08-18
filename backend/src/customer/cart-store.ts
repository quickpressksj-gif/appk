/**
 * Smart Cart Store — one reactive, API-driven source of truth for the cart.
 *
 * Every screen (service details, partner profile, floating cart bar, cart
 * screen) reads and writes this store, and the store talks only to the
 * Sprint 2.3 backend:
 *
 *   GET    /api/cart               — line items, charges and live totals
 *   POST   /api/cart/items         — add an item
 *   PUT    /api/cart/items/{id}    — update quantity
 *   DELETE /api/cart/items/{id}    — remove an item
 *
 * Mutations are optimistic: local state updates instantly so the UI animates
 * without waiting on the network, the request fires, and the snapshot is
 * rolled back to the last server-confirmed state if the call fails. Pricing,
 * discount, delivery, handling and the estimated total always come from the
 * backend response — nothing is calculated here.
 */

import {
  EMPTY_CHARGES,
  EMPTY_TOTALS,
  deleteCartItem,
  fetchCartState,
  postCartItem,
  type CartItem,
  type CartStateResponse,
  type CartStore as CartStoreInfo,
  type Charges,
  type Totals,
} from "./cart-api";

export type CartLine = {
  id: string;
  name: string;
  price: number;
  unit: string;
  qty: number;
  image?: string | undefined;
  description?: string | undefined;
  serviceId?: string | undefined;
  partnerId?: string | undefined;
  partnerName?: string | undefined;
};

export type CartSnapshot = {
  lines: CartLine[];
  /** Server totals — count / itemsTotal / grandTotal etc. */
  totals: Totals;
  charges: Charges;
  store: CartStoreInfo | null;
  count: number;
  total: number;
  loading: boolean;
  syncing: boolean;
  error: string | null;
};

const EMPTY: CartSnapshot = {
  lines: [],
  totals: EMPTY_TOTALS,
  charges: EMPTY_CHARGES,
  store: null,
  count: 0,
  total: 0,
  loading: false,
  syncing: false,
  error: null,
};

let snapshot: CartSnapshot = EMPTY;
const listeners = new Set<() => void>();
let hydrated = false;

function toLine(item: CartItem): CartLine {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    unit: item.unit,
    qty: item.qty,
    image: item.image,
    description: item.description,
    serviceId: item.serviceId,
    partnerId: item.partnerId,
  };
}

function emit() {
  listeners.forEach((fn) => fn());
}

function set(patch: Partial<CartSnapshot>) {
  snapshot = { ...snapshot, ...patch };
  snapshot.count = snapshot.totals.count || snapshot.lines.reduce((sum, l) => sum + l.qty, 0);
  snapshot.total =
    snapshot.totals.itemsTotal || snapshot.lines.reduce((sum, l) => sum + l.qty * l.price, 0);
  emit();
}

/** Apply an authoritative backend cart payload. */
function applyServerCart(cart: CartStateResponse) {
  set({
    lines: cart.items.map(toLine),
    totals: cart.totals,
    charges: cart.charges,
    store: cart.store,
    error: null,
  });
}

/** GET /api/cart — refresh line items and the server-computed summary. */
export async function refreshCart(couponDiscount = 0): Promise<void> {
  set({ syncing: true });
  try {
    applyServerCart(await fetchCartState(couponDiscount));
  } catch {
    set({ error: "We couldn't refresh your cart." });
  } finally {
    set({ syncing: false });
  }
}

/** Load the cart once, on the client (SSR renders the empty cart). */
export function hydrateCart() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  set({ loading: true });
  void refreshCart().finally(() => set({ loading: false }));
}

export function subscribeCartLines(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getCartSnapshot(): CartSnapshot {
  return snapshot;
}

/** Stable server snapshot so SSR and hydration agree. */
export function getCartServerSnapshot(): CartSnapshot {
  return EMPTY;
}

export function lineQty(id: string): number {
  return snapshot.lines.find((line) => line.id === id)?.qty ?? 0;
}

/** Run an optimistic mutation, rolling back to `previous` when the API fails. */
async function mutate(
  optimistic: CartLine[],
  request: () => Promise<CartStateResponse | null>,
): Promise<void> {
  const previous = snapshot;
  set({ lines: optimistic, syncing: true, error: null });
  try {
    const result = await request();
    if (result) applyServerCart(result);
    else applyServerCart(await fetchCartState());
  } catch {
    // Rollback — the backend stays the source of truth.
    snapshot = { ...previous, syncing: false, error: "We couldn't update your cart." };
    emit();
    return;
  }
  set({ syncing: false });
}

/**
 * Add one unit of an item (or bump it when already in the cart).
 *
 * The first item immediately hits POST /api/cart/items and refreshes the
 * summary, so the floating cart bar switches from "Add" to "Checkout" with the
 * real backend total behind it.
 */
export function addCartLine(input: Omit<CartLine, "qty">, qty = 1) {
  const existing = snapshot.lines.find((line) => line.id === input.id);
  if (existing) {
    stepCartLine(input.id, qty);
    return;
  }

  const optimistic = [...snapshot.lines, { ...input, qty }];
  void mutate(optimistic, async () => {
    await postCartItem({
      itemId: input.id,
      id: input.id,
      qty,
      name: input.name,
      price: input.price,
      unit: input.unit,
      ...(input.image === undefined ? {} : { image: input.image }),
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.serviceId === undefined ? {} : { serviceId: input.serviceId }),
      ...(input.partnerId === undefined ? {} : { partnerId: input.partnerId }),
    });
    return fetchCartState();
  });
}

export function stepCartLine(id: string, delta: number) {
  const current = lineQty(id);
  const nextQty = Math.max(0, current + delta);
  const optimistic =
    nextQty === 0
      ? snapshot.lines.filter((line) => line.id !== id)
      : snapshot.lines.map((line) => (line.id === id ? { ...line, qty: nextQty } : line));

  void mutate(optimistic, async () => {
    if (nextQty === 0) return deleteCartItem(id);
    const { putCartItem } = await import("./cart-api");
    return putCartItem(id, nextQty);
  });
}

export function removeCartLine(id: string) {
  void mutate(
    snapshot.lines.filter((line) => line.id !== id),
    () => deleteCartItem(id),
  );
}

/** Remove every line — each one through DELETE /api/cart/items/{id}. */
export function clearCartLines() {
  const ids = snapshot.lines.map((line) => line.id);
  void mutate([], async () => {
    for (const id of ids) await deleteCartItem(id);
    return fetchCartState();
  });
}
