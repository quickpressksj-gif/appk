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
import { SwipeActionButton } from "../common/SwipeActionButton";
import { DualSwipeActionButton } from "../common/DualSwipeActionButton";

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
 * Status-aware action bar with Swipe to Confirm & Dual-Direction Swipe for Rider.
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

  // Swipe-to-confirm for full delivery screens & key transitions
  if (!compact) {
    if (delivery.status === "new") {
      return (
        <div className="mt-3 w-full">
          <DualSwipeActionButton
            acceptLabel="Swipe Right to Accept"
            rejectLabel="Swipe Left to Reject"
            onAccept={() => onAdvance(delivery)}
            onReject={() => onReject(delivery)}
          />
        </div>
      );
    }

    if (delivery.status === "reached-partner") {
      return (
        <div className="mt-3">
          <SwipeActionButton
            label="Swipe to Confirm Arrival / Pickup"
            onConfirm={() => onAdvance(delivery)}
            color="blue"
          />
        </div>
      );
    }

    if (delivery.status === "picked-up") {
      return (
        <div className="mt-3">
          <SwipeActionButton
            label="Swipe to Start Delivery / Transit"
            onConfirm={() => onAdvance(delivery)}
            color="emerald"
          />
        </div>
      );
    }

    if (delivery.status === "on-the-way") {
      return (
        <div className="mt-3 space-y-2.5">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => toast("Calling customer")}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-2.5 text-xs font-bold text-foreground active:scale-95"
            >
              <Phone className="size-3.5 text-brand-green" />
              <span>Call</span>
            </button>
            <button
              type="button"
              onClick={() => toast("Chat opens")}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-2.5 text-xs font-bold text-foreground active:scale-95"
            >
              <MessageCircle className="size-3.5 text-blue-500" />
              <span>Chat</span>
            </button>
            <button
              type="button"
              onClick={openNavigation}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-2.5 text-xs font-bold text-foreground active:scale-95"
            >
              <Navigation2 className="size-3.5 text-amber-500" />
              <span>Maps</span>
            </button>
          </div>
          <SwipeActionButton
            label="Swipe to Confirm Delivery"
            onConfirm={() => onAdvance(delivery)}
            color="emerald"
          />
        </div>
      );
    }
  }

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
            onPress: () => toast("Calling customer"),
          },
          {
            id: "chat",
            label: "Chat Customer",
            icon: MessageCircle,
            tone: "outline",
            onPress: () => toast("Chat opens"),
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
            onPress: () => (onProof ? onProof() : toast("Delivery proof capture")),
          },
          {
            id: "otp",
            label: "OTP Verification",
            icon: ShieldCheck,
            tone: "outline",
            onPress: () => (onOtp ? onOtp() : toast("OTP verification")),
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
