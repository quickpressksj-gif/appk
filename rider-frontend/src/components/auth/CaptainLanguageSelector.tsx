import React from "react";
import { ArrowLeft } from "lucide-react";
import { useLanguage, SUPPORTED_LANGUAGES, type LanguageCode } from "../../lib/i18n";

interface CaptainLanguageSelectorProps {
  onProceed?: () => void;
  onBack?: () => void;
}

export const CaptainLanguageSelector: React.FC<CaptainLanguageSelectorProps> = ({
  onProceed,
  onBack,
}) => {
  const { language, setLanguage, t } = useLanguage();

  const handleSelect = (langCode: LanguageCode) => {
    setLanguage(langCode);
  };

  const handleProceedClick = () => {
    if (onProceed) {
      onProceed();
    }
  };

  return (
    <div
      className="relative flex flex-col flex-1 w-full min-h-[100dvh] max-w-md mx-auto bg-white text-neutral-900 select-none justify-between px-5 overflow-y-auto"
      style={{
        paddingTop: "max(env(safe-area-inset-top, 0px) + 12px, 20px)",
        paddingBottom: "max(env(safe-area-inset-bottom, 0px) + 12px, 20px)",
      }}
    >
      {/* 1. Header with Back Arrow (Screenshot 1) */}
      <div>
        <div className="flex items-center justify-between pb-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-900 active:scale-95 transition-transform"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
            </button>
          ) : (
            <div className="w-10 h-10" />
          )}
        </div>

        {/* Title & Subtitle (Screenshot 1) */}
        <div className="text-center pb-6">
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
            {t("lang.selectTitle", "Select language")}
          </h1>
          <p className="text-xs font-semibold text-neutral-500 mt-1">
            {t("lang.selectSub", "Select one from below")}
          </p>
        </div>

        {/* 2. 2-Column Grid of 8 Languages (Screenshot 1) */}
        <div className="grid grid-cols-2 gap-3 pb-6">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;

            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`relative flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all duration-200 active:scale-98 ${
                  isSelected
                    ? "bg-[#E6F8EE] border-[#00C853] shadow-xs"
                    : "bg-white border-neutral-200 hover:border-neutral-300"
                }`}
              >
                {/* Language Labels */}
                <div>
                  <h3
                    className={`text-base font-black leading-snug ${
                      isSelected ? "text-neutral-950" : "text-neutral-900"
                    }`}
                  >
                    {lang.nativeName}
                  </h3>
                  {lang.code !== "en" && (
                    <p
                      className={`text-xs font-medium mt-0.5 ${
                        isSelected ? "text-neutral-700 font-bold" : "text-neutral-500"
                      }`}
                    >
                      {lang.englishName}
                    </p>
                  )}
                </div>

                {/* Custom Radio Button Indicator */}
                <div
                  className={`flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all ${
                    isSelected
                      ? "border-[#00C853] bg-white"
                      : "border-neutral-300 bg-white"
                  }`}
                >
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00C853]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Green Action Button: Proceed (Screenshot 1) */}
      <div className="pt-4 pb-2">
        <button
          type="button"
          onClick={handleProceedClick}
          className="w-full h-13.5 flex items-center justify-center bg-[#00C853] hover:bg-[#00B248] active:bg-[#009624] text-white font-black text-sm tracking-wide rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-98 transition-all"
        >
          {t("lang.proceed", "Proceed")}
        </button>
      </div>
    </div>
  );
};
