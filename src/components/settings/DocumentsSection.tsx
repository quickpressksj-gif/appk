import { Banknote, FileText, IdCard, Landmark, Pencil, ScrollText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

import {
  documentStatusTone,
  type PartnerDocument,
} from "../../data/partner-settings-mock";
import { SettingsEmptyState } from "./SettingsStates";
import { SettingsSheet } from "./SettingsSheet";
import { PrimaryButton, SettingsSection } from "./SettingsPrimitives";

const DOC_ICONS: Record<PartnerDocument["id"], LucideIcon> = {
  gst: ScrollText,
  pan: IdCard,
  aadhaar: FileText,
  bank: Landmark,
};

/** Sprint 3.10 — KYC documents & bank details (edit is a UI placeholder). */
export function DocumentsSection({
  documents,
  onNotify,
  delay = 0,
}: {
  documents: PartnerDocument[];
  onNotify: (message: string) => void;
  delay?: number;
}) {
  const [active, setActive] = useState<PartnerDocument | null>(null);

  return (
    <SettingsSection
      id="documents"
      icon={Banknote}
      title="Documents"
      description="KYC records and payout account"
      delay={delay}
    >
      {documents.length === 0 ? (
        <SettingsEmptyState
          title="No documents on file"
          body="Upload GST, PAN, Aadhaar and bank details to start receiving payouts."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {documents.map((document) => {
            const tone = documentStatusTone(document.status);
            const Icon = DOC_ICONS[document.id];

            return (
              <div key={document.id} className="card-soft border border-border p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                    <Icon className="size-4" strokeWidth={2.1} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold tracking-tight text-foreground">
                      {document.label}
                    </p>
                    <p className="truncate text-[0.7rem] font-semibold text-muted-foreground">
                      {document.value}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider ${tone.className}`}
                  >
                    {tone.label}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="truncate text-[0.66rem] font-medium text-muted-foreground">
                    Updated {document.updatedOn}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActive(document)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-[0.66rem] font-bold tracking-tight text-foreground transition-all duration-300 active:scale-[0.96]"
                  >
                    <Pencil className="size-3" aria-hidden="true" /> Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SettingsSheet
        open={active !== null}
        title={active ? `Update ${active.label}` : "Update document"}
        subtitle={active?.hint}
        onClose={() => setActive(null)}
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="document-value"
              className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground"
            >
              {active?.label ?? "Document"}
            </label>
            <div className="field-focus mt-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
              <input
                id="document-value"
                type="text"
                defaultValue={active?.value ?? ""}
                className="w-full bg-transparent text-sm font-semibold tracking-tight text-foreground outline-none"
              />
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center">
            <p className="text-xs font-bold tracking-tight text-foreground">Upload document</p>
            <p className="mt-1 text-[0.68rem] font-medium text-muted-foreground">
              File uploads arrive with the verification release. This step is UI-only for now.
            </p>
          </div>
          <PrimaryButton
            onClick={() => {
              const label = active?.label ?? "Document";
              setActive(null);
              onNotify(`${label} sent for review`);
            }}
          >
            Submit for review
          </PrimaryButton>
        </div>
      </SettingsSheet>
    </SettingsSection>
  );
}
