import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, FileText, HelpCircle, Scale, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Toaster } from "@/shared/ui/sonner";

import { RiderTopBar } from "../../components/RiderTopBar";
import { SettingsCard } from "../../components/settings/SettingsPrimitives";
import { LEGAL_DOCUMENTS } from "../../data/rider-settings-mock";
import { riderRoutes } from "../../navigation/rider-routes";

const ICONS = {
  privacy: ShieldCheck,
  terms: FileText,
  agreement: Scale,
  help: HelpCircle,
} as const;

/** Legal — privacy policy, terms, rider agreement and help center. */
export function LegalScreen() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<string | null>("privacy");

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Legal"
          subtitle="Policies, terms and support"
          onBack={() => void navigate({ to: riderRoutes.settings })}
        />

        <div className="space-y-3 px-5 pb-32 pt-4">
          {LEGAL_DOCUMENTS.map((doc, index) => {
            const Icon = ICONS[doc.id];
            const expanded = open === doc.id;
            return (
              <section
                key={doc.id}
                className="card-soft animate-rise overflow-hidden border border-border p-0"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : doc.id)}
                  className="ripple flex w-full items-center gap-3 p-5 text-left transition-all duration-300 active:scale-[0.99]"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-brand-dark">
                    <Icon className="size-4" strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.82rem] font-black tracking-tight text-foreground">
                      {doc.title}
                    </span>
                    <span className="block text-[0.66rem] font-semibold text-muted-foreground">
                      Updated {doc.updatedOn}
                    </span>
                  </span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-muted-foreground transition-transform duration-300 ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expanded ? (
                  <div className="animate-expand space-y-3 border-t border-border px-5 py-4">
                    {doc.body.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 24)}
                        className="text-[0.76rem] font-medium leading-relaxed text-muted-foreground"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}

          <SettingsCard title="Still need help?" caption="Rider support is available 24×7" delay={260}>
            <a
              href="tel:18002004411"
              className="ripple flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97]"
            >
              Call 1800 200 4411
            </a>
          </SettingsCard>
        </div>
      </div>
      <Toaster />
    </main>
  );
}