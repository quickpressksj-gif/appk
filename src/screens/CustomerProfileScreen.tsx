import { useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";

import { Toaster } from "@shared/ui/sonner";

import { PartnerTopBar } from "../components/PartnerTopBar";
import { PartnerBottomNav } from "../components/PartnerBottomNav";
import { CustomerEmptyState } from "../components/customers/CustomerEmptyState";
import { CustomerProfileSkeleton } from "../components/customers/CustomerSkeletons";
import { CustomerSuccessOverlay } from "../components/customers/CustomerSuccessOverlay";
import {
  CustomerAddressesCard,
  CustomerFavouriteServices,
  CustomerMembershipCard,
  CustomerNotesCard,
  CustomerOrderHistory,
  CustomerPersonalInfo,
  CustomerProfileHeader,
  CustomerReferralCard,
} from "../components/customers/CustomerProfileSections";
import { usePartnerResource } from "../hooks/use-partner-resource";
import { partnerRoutes } from "../navigation/partner-routes";
import { fetchPartnerCustomersData } from "../data/partner-customers-mock";

/**
 * Sprint 3.7 — Customer profile detail (UI only, mock data).
 */
export function CustomerProfileScreen() {
  const navigate = useNavigate();
  const { customerId } = useParams({ from: "/customers/$customerId" });
  const { data } = usePartnerResource(fetchPartnerCustomersData);
  const [success, setSuccess] = useState<string | null>(null);

  const customer = data?.customers.find((item) => item.id === customerId) ?? null;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md md:max-w-3xl lg:max-w-5xl">
        <PartnerTopBar
          title={customer?.name ?? "Customer Profile"}
          subtitle={customer ? customer.id : "Loading profile"}
          onBack={() => navigate({ to: partnerRoutes.customers })}
        />

        {!data ? (
          <CustomerProfileSkeleton />
        ) : !customer ? (
          <div className="px-5 pb-32 pt-4">
            <CustomerEmptyState
              variant="no-results"
              onAction={() => navigate({ to: partnerRoutes.customers })}
            />
          </div>
        ) : (
          <div className="animate-fade-in space-y-3 px-5 pb-32 pt-4 md:grid md:grid-cols-2 md:items-start md:gap-3 md:space-y-0">
            <div className="md:col-span-2">
              <CustomerProfileHeader customer={customer} />
            </div>
            <CustomerPersonalInfo customer={customer} />
            <CustomerOrderHistory customer={customer} />
            <CustomerFavouriteServices customer={customer} />
            <CustomerMembershipCard customer={customer} />
            <CustomerReferralCard customer={customer} />
            <CustomerAddressesCard customer={customer} />
            <div className="md:col-span-2">
              <CustomerNotesCard onSaved={setSuccess} />
            </div>
          </div>
        )}

        <PartnerBottomNav active="dashboard" />
      </div>

      <CustomerSuccessOverlay message={success} onDone={() => setSuccess(null)} />
      <Toaster />
    </main>
  );
}
