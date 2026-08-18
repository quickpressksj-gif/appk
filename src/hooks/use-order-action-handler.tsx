import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
  AssignRiderSheet,
  CancelReasonSheet,
  InvoiceSheet,
  RejectOrderSheet,
} from "../components/orders/OrderSheets";
import { OrderSuccessOverlay } from "../components/orders/OrderSuccessOverlay";
import { getOrderActions, type OrderActionId } from "../components/orders/order-actions";
import { usePartnerOrders } from "../context/PartnerOrdersContext";
import type { ManagedOrder } from "../data/partner-orders-mock";

type SheetState =
  | { kind: "reject" | "rider" | "invoice" | "reason"; order: ManagedOrder }
  | null;

/**
 * Central handler for every stage action. UI only — each branch marks the
 * future API call it will delegate to.
 */
export function useOrderActionHandler() {
  const { advanceStage } = usePartnerOrders();
  const [sheet, setSheet] = useState<SheetState>(null);
  const [busy, setBusy] = useState<{ orderId: string; actionId: OrderActionId } | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const applyStage = useCallback(
    async (order: ManagedOrder, actionId: OrderActionId, message: string, extra = {}) => {
      const isDryClean = order.services.some((s) => s.toLowerCase().includes("dry"));
      const action = getOrderActions(order.stage, isDryClean).find((a) => a.id === actionId);
      if (!action?.nextStage) return;
      setBusy({ orderId: order.id, actionId });
      // TODO(api): POST /api/partner/orders/{id}/{action}
      await new Promise((resolve) => setTimeout(resolve, 450));
      advanceStage(order.id, action.nextStage, {
        ...(action.timelineLabel ? { timelineLabel: action.timelineLabel } : {}),
        ...extra,
      });
      setBusy(null);
      setSuccess(message);
    },
    [advanceStage],
  );

  const handleAction = useCallback(
    (order: ManagedOrder, actionId: OrderActionId) => {
      switch (actionId) {
        case "accept":
          void applyStage(order, actionId, "Order accepted");
          break;
        case "reject":
          setSheet({ kind: "reject", order });
          break;
        case "start_pickup":
          void applyStage(order, actionId, "Pickup started");
          break;
        case "picked_up":
          void applyStage(order, actionId, "Marked picked up");
          break;
        case "washing_complete":
          void applyStage(order, actionId, "Moved to ironing");
          break;
        case "mark_ready":
          void applyStage(order, actionId, "Ready for delivery");
          break;
        case "assign_rider":
          setSheet({ kind: "rider", order });
          break;
        case "mark_delivered":
          void applyStage(order, actionId, "Order delivered");
          break;
        case "view_invoice":
          setSheet({ kind: "invoice", order });
          break;
        case "view_reason":
          setSheet({ kind: "reason", order });
          break;
        default:
          break;
      }
    },
    [applyStage],
  );

  const overlay = <OrderSuccessOverlay message={success} onDone={() => setSuccess(null)} />;

  const sheetNode = (() => {
    if (!sheet) return null;
    if (sheet.kind === "reject") {
      return (
        <RejectOrderSheet
          order={sheet.order}
          onClose={() => setSheet(null)}
          onConfirm={(reason) => {
            setSheet(null);
            // TODO(api): POST /api/partner/orders/{id}/reject { reason }
            advanceStage(sheet.order.id, "cancelled", {
              timelineLabel: "Rejected by store",
              cancelReason: `Rejected by store — ${reason.toLowerCase()}.`,
            });
            setSuccess("Order rejected");
          }}
        />
      );
    }
    if (sheet.kind === "rider") {
      return (
        <AssignRiderSheet
          order={sheet.order}
          onClose={() => setSheet(null)}
          onAssign={(riderName) => {
            setSheet(null);
            // TODO(api): POST /api/partner/orders/{id}/assign-rider { riderId }
            advanceStage(sheet.order.id, "ready", {
              timelineLabel: `Rider assigned · ${riderName}`,
              assignedRider: riderName,
            });
            toast.success(`${riderName} assigned for pickup`);
          }}
        />
      );
    }
    if (sheet.kind === "invoice") {
      return <InvoiceSheet order={sheet.order} onClose={() => setSheet(null)} />;
    }
    return <CancelReasonSheet order={sheet.order} onClose={() => setSheet(null)} />;
  })();

  return { handleAction, sheetNode, overlay, busy };
}
