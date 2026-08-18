import { Languages, Monitor, Moon, Palette, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  LANGUAGE_OPTIONS,
  THEME_OPTIONS,
  type LanguageCode,
  type ThemeMode,
} from "../../data/partner-settings-mock";
import { SettingsChoiceChip, SettingsSection } from "./SettingsPrimitives";

const THEME_ICONS: Record<ThemeMode, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

/** Sprint 3.10 — Appearance (light / dark / system) and language selector. */
export function AppearanceSection({
  theme,
  language,
  onThemeChange,
  onLanguageChange,
  delay = 0,
}: {
  theme: ThemeMode;
  language: LanguageCode;
  onThemeChange: (next: ThemeMode) => void;
  onLanguageChange: (next: LanguageCode) => void;
  delay?: number;
}) {
  return (
    <SettingsSection
      id="appearance"
      icon={Palette}
      title="Appearance & Language"
      description="Theme preference and app language"
      delay={delay}
    >
      <div className="card-soft border border-border p-4">
        <p className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
          Theme
        </p>
        <div
          role="radiogroup"
          aria-label="Theme"
          className="mt-3 flex flex-col gap-2 sm:flex-row"
        >
          {THEME_OPTIONS.map((option) => (
            <SettingsChoiceChip
              key={option.id}
              icon={THEME_ICONS[option.id]}
              label={option.label}
              description={option.description}
              selected={theme === option.id}
              onClick={() => onThemeChange(option.id)}
            />
          ))}
        </div>

        <p className="mt-5 text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
          Language
        </p>
        <div role="radiogroup" aria-label="Language" className="mt-3 flex flex-col gap-2 sm:flex-row">
          {LANGUAGE_OPTIONS.map((option) => (
            <SettingsChoiceChip
              key={option.id}
              icon={Languages}
              label={option.label}
              description={option.native}
              selected={language === option.id}
              onClick={() => onLanguageChange(option.id)}
            />
          ))}
        </div>
        <p className="mt-3 text-[0.68rem] font-medium text-muted-foreground">
          More regional languages are on the roadmap — the selector is future-ready.
        </p>
      </div>
    </SettingsSection>
  );
}
