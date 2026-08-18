import { useNavigate } from "@tanstack/react-router";
import { Truck } from "lucide-react";

import { Toaster } from "@/shared/ui/sonner";

import { RiderBottomNav } from "../components/RiderBottomNav";
import { RiderEmptyState, RiderPrimaryButton } from "../components/RiderPrimitives";
import { RiderBellAction, RiderTopBar } from "../components/RiderTopBar";
import { riderRoutes } from "../navigation/rider-routes";

/**
 * Legacy Delivery Management screen.
 *
 * This screen was built as a UI-only prototype on top of `rider-delivery-mock`
 * (fabricated orders, customers, addresses, payouts and status transitions that
 * were never sent to the backend). Those fixtures must not ship to riders.
 *
 * The real, backend-backed delivery queue is `/orders` (AssignedOrdersScreen),
 * which uses `GET /api/rider/orders` and the real accept / pickup / drop /
 * deliver endpoints. This route is preserved and forwards riders there.
 */
export function DeliveryManagementScreen() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Delivery Management"
          subtitle="Your live delivery queue"
          action={<RiderBellAction count={0} />}
        />

        <div className="px-5 pb-32 pt-4">
          <RiderEmptyState
            icon={Truck}
            title="Moved to Orders"
            body="Your live assignments, pickups and drops are managed in Orders, which is connected to the QuickPress backend."
          />
          <div className="mt-4">
            <RiderPrimaryButton onClick={() => navigate({ to: riderRoutes.orders })}>
              Go to Orders
            </RiderPrimaryButton>
          </div>
        </div>
      </div>
      <RiderBottomNav active="orders" />
      <Toaster />
    </main>
  );
}
