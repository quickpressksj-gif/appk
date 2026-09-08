import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GoToPickupHUD, type ActiveOrderData } from "../components/dashboard/GoToPickupHUD";
import { CaptainSidebarDrawer } from "../components/layout/CaptainSidebarDrawer";
import { useRiderContext } from "../context/RiderContext";
import { requireRiderAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/deliveries")({
  beforeLoad: () => {
    requireRiderAuth();
  },
  head: () => ({
    meta: [
      { title: "Active Delivery — QuickPress Captain" },
      {
        name: "description",
        content: "QuickPress Captain Active Pickup & Drop Navigation",
      },
    ],
  }),
  component: CaptainActiveDeliveryRoute,
});

function CaptainActiveDeliveryRoute() {
  const navigate = useNavigate();
  const { session } = useRiderContext();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [activeOrder, setActiveOrder] = useState<ActiveOrderData | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("qp_active_rider_order");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    if (!activeOrder) {
      navigate({ to: "/orders" });
    }
  }, [activeOrder, navigate]);

  const handleTripEnd = () => {
    try {
      localStorage.removeItem("qp_active_rider_order");
    } catch {}
    navigate({ to: "/dashboard" });
  };

  if (!activeOrder) {
    return null;
  }

  return (
    <>
      <CaptainSidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        captainName={session?.fullName || "Captain"}
        captainId={session?.riderId || ""}
        rating={4.94}
      />
      <GoToPickupHUD
        order={activeOrder}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onTripCompleted={handleTripEnd}
        onCancelTrip={handleTripEnd}
      />
    </>
  );
}
