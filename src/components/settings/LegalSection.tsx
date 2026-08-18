import { BookOpen, FileSignature, Headphones, LifeBuoy, Scale, ShieldQuestion } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

import { LEGAL_LINKS, type LegalLinkId } from "../../data/partner-settings-mock";
import { SettingsSheet } from "./SettingsSheet";
import { SettingsCard, SettingsNavRow, SettingsSection } from "./SettingsPrimitives";

const LEGAL_ICONS: Record<LegalLinkId, LucideIcon> = {
  privacy: ShieldQuestion,
  terms: Scale,
  agreement: FileSignature,
  help: BookOpen,
  support: Headphones,
};

/** Sprint 3.10 — Legal documents and support entry points. */
export function LegalSection({ delay = 0 }: { delay?: number }) {
  const [openId, setOpenId] = useState<LegalLinkId | null>(null);
  const active = LEGAL_LINKS.find((item) => item.id === openId) ?? null;

  return (
    <SettingsSection
      id="legal"
      icon={LifeBuoy}
      title="Legal & Support"
      description="Policies, agreement and help"
      delay={delay}
    >
      <SettingsCard>
        {LEGAL_LINKS.map((link) => (
          <SettingsNavRow
            key={link.id}
            icon={LEGAL_ICONS[link.id]}
            label={link.label}
            value={link.summary}
            onClick={() => setOpenId(link.id)}
          />
        ))}
      </SettingsCard>

      <SettingsSheet
        open={active !== null}
        title={active?.label ?? ""}
        subtitle={active?.summary}
        onClose={() => setOpenId(null)}
      >
        <p className="text-sm font-medium leading-relaxed text-muted-foreground">{active?.body}</p>
      </SettingsSheet>
    </SettingsSection>
  );
}
