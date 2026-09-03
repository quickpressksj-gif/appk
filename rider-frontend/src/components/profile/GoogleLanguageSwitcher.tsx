import { useState, useEffect } from "react";
import { Check, Globe, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  SUPPORTED_LANGUAGES,
  getActiveLanguage,
  switchGoogleLanguage,
} from "../../lib/google-translate";

export function GoogleLanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState("en");

  useEffect(() => {
    setCurrentLang(getActiveLanguage());
  }, []);

  const handleSelectLanguage = (code: string, nativeName: string) => {
    setCurrentLang(code);
    toast.success(`Language switching to ${nativeName}...`);
    switchGoogleLanguage(code);
  };

  const activeLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="rounded-3xl border-2 border-emerald-800 bg-white p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-xs">
            <Globe className="size-5" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
              Language Switcher (Google Translate)
            </h3>
            <p className="text-[11px] font-semibold text-emerald-800">
              Official Multi-Language Engine
            </p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-black text-emerald-800">
          Active: {activeLangObj?.nativeName}
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        Select your preferred language. QuickPress Captain interface will translate automatically in real time:
      </p>

      {/* Language Pills Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = currentLang === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelectLanguage(lang.code, lang.nativeName)}
              className={`flex items-center justify-between gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                isSelected
                  ? "bg-emerald-800 text-white font-black shadow-xs"
                  : "border border-emerald-200 bg-emerald-50/40 text-emerald-950 hover:bg-emerald-100/60"
              }`}
            >
              <div className="flex flex-col text-left">
                <span className="text-xs font-black leading-tight">{lang.nativeName}</span>
                <span
                  className={`text-[10px] leading-tight ${
                    isSelected ? "text-emerald-200 font-semibold" : "text-slate-500"
                  }`}
                >
                  {lang.name}
                </span>
              </div>
              {isSelected && <Check className="size-3.5 text-white shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
