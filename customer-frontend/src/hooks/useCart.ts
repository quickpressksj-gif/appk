import { useEffect, useSyncExternalStore } from "react";

import {
  addCartLine,
  clearCartLines,
  getCartServerSnapshot,
  getCartSnapshot,
  hydrateCart,
  removeCartLine,
  stepCartLine,
  subscribeCartLines,
  type CartLine,
} from "@/api/customer/cart-store";

/** Live cart snapshot shared by every screen. */
export function useCart() {
  const snapshot = useSyncExternalStore(
    subscribeCartLines,
    getCartSnapshot,
    getCartServerSnapshot,
  );

  useEffect(() => {
    hydrateCart();
  }, []);

  return {
    ...snapshot,
    qtyOf: (id: string) => snapshot.lines.find((line) => line.id === id)?.qty ?? 0,
    add: addCartLine,
    step: stepCartLine,
    remove: removeCartLine,
    clear: clearCartLines,
  };
}

export type { CartLine };
