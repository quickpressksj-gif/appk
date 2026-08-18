import { useNavigate } from "@tanstack/react-router";
import { Package } from "lucide-react";

import { Toaster } from "@/shared/ui/sonner";

import { RiderEmptyState, RiderPrimaryButton } from "../components/RiderPrimitives";
import { RiderTopBar } from "../components/RiderTopBar";
import { riderRoutes } from "../navigation/rider-routes";

/**
 * Legacy delivery details screen.
 *
 * Previously rendered a fabricated order from `rider-delivery-mock` with fake
 * customers, service lists, COD amounts and status transitions that never
 * reached the backend. Real order details live at `/orders/$orderId`
 * (RiderOrderDetailsScreen), backed by `GET /api/rider/orders/{id}`.
 */
export function DeliveryDetailsScreen() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Delivery Details"
          subtitle="Order information"
          onBack={() => navigate({ to: riderRoutes.orders })}
        />

        <div className="px-5 pb-32 pt-4">
          <RiderEmptyState
            icon={Package}
            title="Open this delivery from Orders"
            body="Live delivery details, OTP verification and proof of delivery are handled in the Orders section, which is connected to the backend."
          />
          <div className="mt-4">
            <RiderPrimaryButton onClick={() => navigate({ to: riderRoutes.orders })}>
              Go to Orders
            </RiderPrimaryButton>
          </div>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
