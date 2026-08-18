import { useNavigate } from "@tanstack/react-router";
import { Bike, FileText } from "lucide-react";

import { Toaster } from "@/shared/ui/sonner";

import { InfoRow } from "../../components/RiderPrimitives";
import { RiderTopBar } from "../../components/RiderTopBar";
import {
  SettingsBadge,
  SettingsCard,
  SettingsSkeleton,
} from "../../components/settings/SettingsPrimitives";
import { useRiderSettings } from "../../context/RiderSettingsContext";
import { useRiderResource } from "../../hooks/use-rider-resource";
import { fetchRiderProfile } from "@/api/rider/rider-profile-api";
import { riderRoutes } from "../../navigation/rider-routes";

const DOC_TONE = {
  verified: "success",
  pending: "warning",
  rejected: "danger",
} as const;

const NOT_AVAILABLE = "Not available";

/**
 * Account → Vehicle information & Documents.
 *
 * Documents come from the real `GET /api/rider/profile` payload. The previous
 * hard-coded licence/Aadhaar/PAN numbers and expiry dates were fabricated and
 * have been removed. There is no document upload endpoint on the backend, so
 * the old "Re-upload document" button (which only mutated local state) is gone
 * rather than pretending an upload happened.
 */
export function DocumentsScreen() {
  const navigate = useNavigate();
  const { vehicle } = useRiderSettings();
  const { data, isLoading } = useRiderResource(fetchRiderProfile);
  const documents = data?.documents ?? [];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Vehicle & Documents"
          subtitle="Keep your paperwork valid"
          onBack={() => void navigate({ to: riderRoutes.settingsAccount })}
        />

        {isLoading ? (
          <SettingsSkeleton rows={2} />
        ) : (
          <div className="space-y-4 px-5 pb-32 pt-4">
            <SettingsCard title="Vehicle information">
              <div>
                <InfoRow
                  icon={Bike}
                  label="Vehicle type"
                  value={vehicle.vehicleType || NOT_AVAILABLE}
                />
                <InfoRow icon={Bike} label="Model" value={vehicle.model || NOT_AVAILABLE} />
                <InfoRow
                  icon={Bike}
                  label="Vehicle number"
                  value={vehicle.vehicleNumber || NOT_AVAILABLE}
                />
              </div>
            </SettingsCard>

            <SettingsCard
              title="Documents"
              caption="KYC files reviewed by the QuickPress team"
              delay={60}
            >
              {documents.length === 0 ? (
                <p className="text-[0.72rem] font-semibold text-muted-foreground">
                  No documents on record. Contact rider support if you believe this is wrong.
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <div
                      key={doc.id}
                      className="animate-rise rounded-2xl border border-border bg-muted/50 p-3"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-card text-muted-foreground">
                          <FileText className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.8rem] font-bold tracking-tight text-foreground">
                            {doc.label}
                          </p>
                          <p className="truncate text-[0.66rem] font-semibold text-muted-foreground">
                            Reviewed by QuickPress
                          </p>
                        </div>
                        <SettingsBadge label={doc.status} tone={DOC_TONE[doc.status]} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[0.66rem] font-semibold text-muted-foreground">
                Document re-upload is not available in the app yet. Email riders@quickpress.in to
                update a document.
              </p>
            </SettingsCard>
          </div>
        )}
      </div>

      <Toaster />
    </main>
  );
}
