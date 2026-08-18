import {
  BadgeCheck,
  Bike,
  CheckCircle2,
  FileText,
  Info,
  PackageCheck,
  Shirt,
  Truck,
  WashingMachine,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { OrderStage } from "../../data/partner-orders-mock";

export type OrderActionId =
  | "accept"
  | "reject"
  | "start_pickup"
  | "picked_up"
  | "start_washing"
  | "washing_complete"
  | "start_ironing"
  | "mark_ready"
  | "assign_rider"
  | "mark_delivered"
  | "view_invoice"
  | "view_reason";

export type OrderAction = {
  id: OrderActionId;
  label: string;
  icon: LucideIcon;
  intent: "primary" | "secondary" | "danger";
  /** Stage the order moves to when the action succeeds (null = UI only). */
  nextStage: OrderStage | null;
  timelineLabel?: string;
};

/**
 * Stage → available partner actions. Pure data so the same map drives both
 * the compact card actions and the full order details action bar.
 */
export function getOrderActions(stage: OrderStage, isDryClean = false): OrderAction[] {
  switch (stage) {
    case "new":
      return [
        {
          id: "accept",
          label: "Accept",
          icon: CheckCircle2,
          intent: "primary",
          nextStage: "accepted",
          timelineLabel: "Accepted by store",
        },
        { id: "reject", label: "Reject", icon: X, intent: "danger", nextStage: "cancelled" },
      ];
    case "accepted":
      return [
        {
          id: "start_pickup",
          label: "Start Pickup",
          icon: Truck,
          intent: "primary",
          nextStage: "pickup_pending",
          timelineLabel: "Pickup started",
        },
      ];
    case "pickup_pending":
      return [
        {
          id: "picked_up",
          label: "Picked Up",
          icon: PackageCheck,
          intent: "primary",
          nextStage: isDryClean ? "dry_cleaning" : "washing",
          timelineLabel: "Picked up",
        },
      ];
    case "washing":
      return [
        {
          id: "washing_complete",
          label: "Mark Washing Complete",
          icon: WashingMachine,
          intent: "primary",
          nextStage: "ironing",
          timelineLabel: "Washing complete",
        },
      ];
    case "dry_cleaning":
      return [
        {
          id: "washing_complete",
          label: "Mark Dry Clean Complete",
          icon: Shirt,
          intent: "primary",
          nextStage: "ironing",
          timelineLabel: "Dry cleaning complete",
        },
      ];
    case "ironing":
      return [
        {
          id: "mark_ready",
          label: "Mark Ready",
          icon: BadgeCheck,
          intent: "primary",
          nextStage: "ready",
          timelineLabel: "Ready for delivery",
        },
      ];
    case "ready":
      return [
        { id: "assign_rider", label: "Assign Rider", icon: Bike, intent: "primary", nextStage: null },
        {
          id: "mark_delivered",
          label: "Mark Delivered",
          icon: CheckCircle2,
          intent: "secondary",
          nextStage: "completed",
          timelineLabel: "Delivered",
        },
      ];
    case "completed":
      return [
        { id: "view_invoice", label: "View Invoice", icon: FileText, intent: "secondary", nextStage: null },
      ];
    case "cancelled":
      return [
        { id: "view_reason", label: "View Reason", icon: Info, intent: "secondary", nextStage: null },
      ];
    default:
      return [];
  }
}

export const ACTION_INTENT_CLASS: Record<OrderAction["intent"], string> = {
  primary:
    "bg-primary text-primary-foreground shadow-cta hover:brightness-[1.03] disabled:opacity-70",
  secondary:
    "border border-border bg-card text-foreground hover:border-primary/60 disabled:opacity-70",
  danger:
    "border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 disabled:opacity-70",
};
