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
        className={`animate-pop flex ${height} w-28 items-center justify-between rounded-2xl bg-primary px-1.5 shadow-cta`}
      >
        <button
          type="button"
          aria-label={`Remove one ${item.name}`}
          onClick={() => step(item.id, -1)}
          className="ripple flex size-7 items-center justify-center rounded-xl text-primary-foreground transition-transform duration-200 active:scale-90"
        >
          <Minus className="size-3.5" />
        </button>
        <span className={`${text} font-bold text-primary-foreground`}>{qty}</span>
        <button
          type="button"
          aria-label={`Add one ${item.name}`}
          onClick={() => step(item.id, 1)}
          className="ripple flex size-7 items-center justify-center rounded-xl text-primary-foreground transition-transform duration-200 active:scale-90"
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
      className={`ripple flex ${height} items-center gap-1 rounded-2xl bg-primary px-4 ${text} font-bold text-primary-foreground shadow-cta transition-all duration-300 hover:brightness-[1.03] active:scale-[0.96] disabled:opacity-50`}
    >
      <ShoppingBag className="size-3.5" /> Add
    </button>
  );
});
