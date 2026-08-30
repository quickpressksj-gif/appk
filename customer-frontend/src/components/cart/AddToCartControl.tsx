import { Minus, Plus, ShoppingBag } from "lucide-react";
import { memo } from "react";

import { useCart } from "@/hooks/useCart";
import type { CartLine } from "@/api/customer/cart-store";

type Props = {
  item: Omit<CartLine, "qty">;
  disabled?: boolean;
  /** "sm" matches list rows, "md" matches the price-list rows. */
  size?: "sm" | "md";
};

/**
 * Instant add-to-cart control. The first tap adds the item and immediately
 * swaps to a quantity stepper — no page reload, no waiting on the network.
 */
export const AddToCartControl = memo(function AddToCartControl({
  item,
  disabled = false,
  size = "sm",
}: Props) {
  const { qtyOf, add, step } = useCart();
  const qty = qtyOf(item.id);
  const height = size === "sm" ? "h-9" : "h-10";
  const text = size === "sm" ? "text-[11px]" : "text-xs";

  if (qty > 0) {
    return (
      <div
        className={`animate-pop flex ${height} w-28 items-center justify-between rounded-2xl bg-emerald-600 text-white px-1.5 shadow-md`}
      >
        <button
          type="button"
          aria-label={`Remove one ${item.name}`}
          onClick={() => step(item.id, -1)}
          className="flex size-7 items-center justify-center rounded-xl text-white transition-transform duration-200 active:scale-90 cursor-pointer"
        >
          <Minus className="size-3.5" />
        </button>
        <span className={`${text} font-black text-white`}>{qty}</span>
        <button
          type="button"
          aria-label={`Add one ${item.name}`}
          onClick={() => step(item.id, 1)}
          className="flex size-7 items-center justify-center rounded-xl text-white transition-transform duration-200 active:scale-90 cursor-pointer"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => add(item)}
      className={`flex ${height} items-center gap-1 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-4 ${text} font-black text-white shadow-md transition-all duration-300 active:scale-[0.96] disabled:opacity-50 cursor-pointer`}
    >
      <ShoppingBag className="size-3.5" /> Add
    </button>
  );
});
