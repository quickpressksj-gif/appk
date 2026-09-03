/**
 * Google Translate Integration Helper for QuickPress Captain Panel
 * Handles dynamic script injection, cookie synchronization and DOM event triggering.
 */

export type SupportedLanguage = {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
};

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
];

const STORAGE_KEY = "qp_captain_language";

export function getActiveLanguage(): string {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    const match = document.cookie.match(/googtrans=\/en\/([a-zA-Z-]+)/);
    if (match && match[1]) return match[1];
  } catch {
    /* ignore */
  }
  return "en";
}

export function initGoogleTranslateScript() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // Initialize callback
  (window as any).googleTranslateElementInit = () => {
    try {
      if ((window as any).google?.translate?.TranslateElement) {
        new (window as any).google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi,mr,gu,bn,pa,ur,te,ta,kn",
            autoDisplay: false,
          },
          "google_translate_element"
        );
      }
    } catch (err) {
      console.warn("Google translate initialization error:", err);
    }
  };

  // Inject script once
  if (!document.getElementById("google-translate-script")) {
    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }
}

export function switchGoogleLanguage(langCode: string) {
  if (typeof document === "undefined") return;
  const target = langCode.toLowerCase();
  const cookieVal = `/en/${target}`;

  try {
    localStorage.setItem(STORAGE_KEY, target);
    document.documentElement.lang = target;

    // Set cookie on root and host domain
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    if (typeof window !== "undefined" && window.location.hostname) {
      const host = window.location.hostname;
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${host};`;
      const parts = host.split(".");
      if (parts.length > 2) {
        document.cookie = `googtrans=${cookieVal}; path=/; domain=.${parts.slice(-2).join(".")};`;
      }
    }

    // Trigger select element if loaded in DOM
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (select) {
      select.value = target;
      select.dispatchEvent(new Event("change"));
    } else {
      // Reload page to let Google Translate apply translation from cookie
      window.location.reload();
    }
  } catch (err) {
    console.warn("Language switch error:", err);
  }
}
