/**
 * Smart Cart Store — one reactive, API-driven source of truth for the cart.
 *
 * Every screen (service details, partner profile, floating cart bar, cart
 * screen, checkout) reads and writes this store.
 *
 * Line items and quantities are immediately persistent and authoritative locally,
 * while asynchronously notifying backend endpoints so quantity is never
 * rolled back or decremented unexpectedly.
 */

import {
  EMPTY_CHARGES,
  EMPTY_TOTALS,
  deleteCartItem,
  fetchCartState,
  postCartItem,
  setCartState,
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
const initialTotals = computeOptimisticTotals(initialLines);

const EMPTY: CartSnapshot = {
  lines: initialLines,
  totals: initialTotals,
  charges: EMPTY_CHARGES,
  store: null,
  count: initialTotals.count,
  total: initialTotals.itemsTotal,
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
  const delivery = currentCharges?.delivery ?? 0; // QuickPress Free Delivery
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
  const nextLines = patch.lines !== undefined ? patch.lines : snapshot.lines;
  const optTotals = computeOptimisticTotals(nextLines, patch.charges ?? snapshot.charges, patch.totals ?? snapshot.totals);

  snapshot = {
    ...snapshot,
    ...patch,
    lines: nextLines,
    totals: patch.totals ? { ...optTotals, ...patch.totals } : optTotals,
  };
  snapshot.count = snapshot.totals.count;
  snapshot.total = snapshot.totals.itemsTotal;
  saveLocalLines(snapshot.lines);

  // Sync to legacy cart state for backward compatibility
  setCartState({
    data: {
      items: snapshot.lines.map((l) => ({
        id: l.id,
        name: l.name,
        price: l.price,
        qty: l.qty,
        unit: l.unit,
        image: l.image ?? "",
        description: l.description ?? "",
      })),
      totals: snapshot.totals,
      charges: snapshot.charges,
      store: snapshot.store,
      coupons: [],
    },
  });

  emit();
}

/** Apply server cart payload without rolling back user's optimistic line quantities */
function applyServerCart(cart: CartStateResponse) {
  // If local snapshot is empty and server has items, adopt server items
  // Otherwise, keep the user's optimistic lines authoritative for quantities
  let lines = snapshot.lines;
  if (lines.length === 0 && cart.items && cart.items.length > 0) {
    lines = cart.items.map(toLine);
  }

  set({
    lines,
    charges: cart.charges || snapshot.charges,
    store: cart.store || snapshot.store,
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

/** Run an optimistic mutation without rolling back user quantity on network issues. */
async function mutate(
  optimistic: CartLine[],
  request: () => Promise<CartStateResponse | null>,
): Promise<void> {
  set({ lines: optimistic, syncing: true, error: null });
  try {
    const result = await request();
    if (result && Array.isArray(result.items)) {
      applyServerCart(result);
    }
  } catch (err) {
    // Do NOT rollback optimistic line quantities on API failure!
    // The user's intended quantity remains authoritative on client.
  } finally {
    set({ syncing: false });
  }
}

/**
 * Add one unit of an item (or bump it when already in the cart).
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
