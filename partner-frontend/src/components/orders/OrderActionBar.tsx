import { Loader2 } from "lucide-react";

import type { ManagedOrder } from "../../data/partner-orders-mock";
import { ACTION_INTENT_CLASS, getOrderActions, type OrderActionId } from "./order-actions";

/** Stage-aware action buttons, shared by the order card and details screen. */
export function OrderActionBar({
  order,
  onAction,
  size = "compact",
  busyAction = null,
}: {
  order: ManagedOrder;
  onAction: (actionId: OrderActionId) => void;
  size?: "compact" | "full";
  busyAction?: OrderActionId | null;
}) {
  const isDryClean = order.services.some((service) => service.toLowerCase().includes("dry"));
  const actions = getOrderActions(order.stage, isDryClean);

  if (!actions.length) return null;

  const sizeClass =
    size === "full" ? "py-3.5 text-sm" : "py-2.5 text-xs";

  return (
    <div className="flex w-full flex-wrap gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        const busy = busyAction === action.id;
        return (
          <button
            key={action.id}
            type="button"
            disabled={busy}
            onClick={() => onAction(action.id)}
            className={`ripple flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 font-black tracking-tight transition-all duration-300 active:scale-[0.97] ${sizeClass} ${ACTION_INTENT_CLASS[action.intent]}`}
          >
            {busy ? (
              <Loader2 className="size-4 shrink-0 animate-spin" />
            ) : (
              <Icon className="size-4 shrink-0" />
            )}
            <span className="truncate">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
