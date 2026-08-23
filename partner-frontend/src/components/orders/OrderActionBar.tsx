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
  const isDryClean = order.services?.some((service) => service.toLowerCase().includes("dry"));
  const actions = getOrderActions(order.stage, isDryClean);

  if (!actions.length) return null;

  const sizeClass =
    size === "full" ? "h-12 text-sm shadow-md" : "py-2.5 text-xs shadow-xs";

  return (
    <div className="flex w-full items-center gap-2.5">
      {actions.map((action) => {
        const Icon = action.icon;
        const busy = busyAction === action.id;
        const isPrimary = action.intent === "primary";
        return (
          <button
            key={action.id}
            type="button"
            disabled={busy}
            onClick={() => onAction(action.id)}
            className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl font-black tracking-tight transition-all duration-200 active:scale-[0.98] ${sizeClass} ${
              isPrimary
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25"
                : action.intent === "danger"
                ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                : "bg-zinc-900 hover:bg-black text-white"
            }`}
          >
            {busy ? (
              <Loader2 className="size-4 shrink-0 animate-spin" />
            ) : (
              <Icon className="size-4.5 shrink-0" />
            )}
            <span className="truncate">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
