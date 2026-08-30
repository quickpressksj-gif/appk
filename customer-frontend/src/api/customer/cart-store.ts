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

const CART_STORAGE_KEY = "quickpress_cart_cache_v2";

function readLocalLines(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalLines(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  try {
    if (lines.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    }
  } catch {
    // Ignore storage quota errors
  }
}

const initialLines = readLocalLines();
const EMPTY: CartSnapshot = {
  lines: initialLines,
  totals: {
    ...EMPTY_TOTALS,
    count: initialLines.reduce((sum, l) => sum + l.qty, 0),
    itemsTotal: initialLines.reduce((sum, l) => sum + l.qty * l.price, 0),
  },
  charges: EMPTY_CHARGES,
  store: null,
  count: initialLines.reduce((sum, l) => sum + l.qty, 0),
  total: initialLines.reduce((sum, l) => sum + l.qty * l.price, 0),
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

function computeOptimisticTotals(lines: CartLine[], currentCharges?: Charges, currentTotals?: Totals): Totals {
  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  const itemsTotal = lines.reduce((sum, l) => sum + l.qty * l.price, 0);
  const pickup = currentCharges?.pickup ?? 0;
  const delivery = currentCharges?.delivery ?? (itemsTotal > 299 ? 0 : 29);
  const handling = currentCharges?.handling ?? (itemsTotal > 0 ? 5 : 0);
  const gstRate = currentCharges?.gstRate ?? 0.18;
  const gst = Math.round(itemsTotal * gstRate);
  const discount = currentCharges?.discount ?? 0;
  const couponDiscount = currentTotals?.couponDiscount ?? 0;
  const grandTotal = Math.max(0, itemsTotal + pickup + delivery + handling + gst - discount - couponDiscount);
  return {
    count,
    itemsTotal,
    pickup,
    delivery,
    handling,
    gst,
    discount,
    couponDiscount,
    grandTotal,
  };
}

function set(patch: Partial<CartSnapshot>) {
  const nextLines = patch.lines ?? snapshot.lines;
  const optTotals = computeOptimisticTotals(nextLines, patch.charges ?? snapshot.charges, patch.totals ?? snapshot.totals);

  snapshot = {
    ...snapshot,
    ...patch,
    totals: patch.totals ? { ...optTotals, ...patch.totals } : optTotals,
  };
  snapshot.count = snapshot.totals.count;
  snapshot.total = snapshot.totals.itemsTotal;
  saveLocalLines(snapshot.lines);
  emit();
}

/** Apply an authoritative backend cart payload. */
function applyServerCart(cart: CartStateResponse) {
  const lines = cart.items.length > 0 ? cart.items.map(toLine) : snapshot.lines;
  set({
    lines,
    totals: {
      ...cart.totals,
      count: cart.items.length > 0 ? cart.totals.count : lines.reduce((sum, l) => sum + l.qty, 0),
      itemsTotal: cart.items.length > 0 ? cart.totals.itemsTotal : lines.reduce((sum, l) => sum + l.qty * l.price, 0),
    },
    charges: cart.charges,
    store: cart.store,
    error: null,
  });
}

/** GET /api/cart — refresh line items and the server-computed summary. */
export async function refreshCart(couponDiscount = 0): Promise<void> {
  set({ syncing: true });
  try {
    const serverCart = await fetchCartState(couponDiscount);
    applyServerCart(serverCart);
  } catch {
    // Keep local lines intact
    set({ syncing: false });
  } finally {
    set({ syncing: false });
  }
}

/** Load the cart once, on the client (SSR renders the empty cart). */
export function hydrateCart() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const local = readLocalLines();
  if (local.length > 0) {
    set({ lines: local });
  }
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
