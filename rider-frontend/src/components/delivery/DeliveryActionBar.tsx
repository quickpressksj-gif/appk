import { useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  Camera,
  Check,
  Info,
  MessageCircle,
  Navigation2,
  PackageCheck,
  Phone,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import type { DeliveryOrder } from "../../data/rider-delivery-mock";
import { riderRoutes } from "../../navigation/rider-routes";

type ActionTone = "primary" | "outline" | "danger" | "green";

type Action = {
  id: string;
  label: string;
  icon: LucideIcon;
  tone: ActionTone;
  onPress: () => void;
};

const TONE: Record<ActionTone, string> = {
  primary: "bg-primary text-primary-foreground shadow-cta",
  green: "bg-secondary/12 text-brand-green border border-secondary/30",
  outline: "border border-border bg-card text-foreground",
  danger: "border border-destructive/30 bg-destructive/10 text-destructive",
};

/**
 * Status-aware action bar. Rendered compactly inside delivery cards and
 * full-width inside the Delivery Details screen.
 */
export function DeliveryActionBar({
  delivery,
  onAdvance,
  onReject,
  onViewReason,
  onProof,
  onOtp,
  compact = false,
}: {
  delivery: DeliveryOrder;
  onAdvance: (delivery: DeliveryOrder) => void;
  onReject: (delivery: DeliveryOrder) => void;
  onViewReason: (delivery: DeliveryOrder) => void;
  onProof?: () => void;
  onOtp?: () => void;
  compact?: boolean;
}) {
  const navigate = useNavigate();

  const openNavigation = () =>
    navigate({ to: riderRoutes.liveNavigation, params: { deliveryId: delivery.id } });

  const actions: Action[] = (() => {
    switch (delivery.status) {
      case "new":
        return [
          {
            id: "reject",
            label: "Reject",
            icon: X,
            tone: "outline",
            onPress: () => onReject(delivery),
          },
          {
            id: "accept",
            label: "Accept",
            icon: Check,
            tone: "primary",
            onPress: () => onAdvance(delivery),
          },
        ];
      case "accepted":
        return [
          {
            id: "navigate-partner",
            label: "Navigate to Partner",
            icon: Navigation2,
            tone: "primary",
            onPress: openNavigation,
          },
          {
            id: "reached",
            label: "Reached",
            icon: Truck,
            tone: "outline",
            onPress: () => onAdvance(delivery),
          },
        ];
      case "reached-partner":
        return [
          {
            id: "confirm-arrival",
            label: "Confirm Arrival",
            icon: BadgeCheck,
            tone: "primary",
            onPress: () => onAdvance(delivery),
          },
        ];
      case "picked-up":
        return [
          {
            id: "start-delivery",
            label: "Start Delivery",
            icon: Truck,
            tone: "primary",
            onPress: () => onAdvance(delivery),
          },
        ];
      case "on-the-way":
        return [
          {
            id: "call",
            label: "Call Customer",
            icon: Phone,
            tone: "green",
            onPress: () => toast("Calling customer (mock)"),
          },
          {
            id: "chat",
            label: "Chat Customer",
            icon: MessageCircle,
            tone: "outline",
            onPress: () => toast("Chat opens with the messaging sprint"),
          },
          {
            id: "navigation",
            label: "View Navigation",
            icon: Navigation2,
            tone: "primary",
            onPress: openNavigation,
          },
          {
            id: "deliver",
            label: "Mark Delivered",
            icon: PackageCheck,
            tone: "primary",
            onPress: () => onAdvance(delivery),
          },
        ];
      case "delivered":
        return [
          {
            id: "proof",
            label: "Delivery Proof",
            icon: Camera,
            tone: "outline",
            onPress: () => (onProof ? onProof() : toast("Delivery proof capture — coming soon")),
          },
          {
            id: "otp",
            label: "OTP Verification",
            icon: ShieldCheck,
            tone: "outline",
            onPress: () => (onOtp ? onOtp() : toast("OTP verification — coming soon")),
          },
        ];
      case "cancelled":
        return [
          {
            id: "reason",
            label: "View Cancellation Reason",
            icon: Info,
            tone: "outline",
            onPress: () => onViewReason(delivery),
          },
        ];
      default:
        return [];
    }
  })();

  if (actions.length === 0) return null;

  return (
    <div
      className={`mt-3 grid gap-2 ${
        actions.length === 1
          ? "grid-cols-1"
          : actions.length === 2
            ? "grid-cols-2"
            : "grid-cols-2 sm:grid-cols-4"
      }`}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={action.onPress}
          className={`ripple flex min-h-11 items-center justify-center gap-1.5 rounded-2xl px-3 ${
            compact ? "py-3 text-xs" : "py-4 text-sm"
          } font-black tracking-tight transition-all duration-300 active:scale-[0.97] ${TONE[action.tone]}`}
        >
          <action.icon className="size-4 shrink-0" strokeWidth={2.2} />
          <span className="truncate">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
