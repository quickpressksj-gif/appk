/**
 * QuickPress Internationalization (i18n) runtime.
 *
 * Supports:
 *   • "en-IN" — English (India) [Default]
 *   • "hi-IN" — हिन्दी (Hindi)
 *
 * Centralized, reactive translation resources with automatic English fallback.
 */

import { useEffect, useState } from "react";

export type LanguageCode = "en-IN" | "hi-IN";

export const SUPPORTED_LANGUAGES: { id: LanguageCode; label: string; nativeName: string }[] = [
  { id: "en-IN", label: "English (India)", nativeName: "English" },
  { id: "hi-IN", label: "हिन्दी", nativeName: "हिन्दी" },
];

export const DEFAULT_LANGUAGE: LanguageCode = "en-IN";

const LANGUAGE_STORAGE_KEY = "quickpress:language";

const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  "en-IN": {
    // General
    "app.name": "QuickPress",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.retry": "Try again",
    "common.offline": "You're offline",
    "common.soon": "Coming soon",
    "common.close": "Close",

    // Profile & Settings Headers
    "profile.title": "My Profile",
    "settings.title": "Settings",
    "settings.appearance": "Appearance",
    "settings.notifications": "Notifications",
    "settings.language": "Language",
    "settings.syncing": "Syncing your preferences…",

    // Themes
    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.system": "System",

    // Notification Rows
    "notify.orderUpdates.label": "Order updates",
    "notify.orderUpdates.note": "Pickup, wash and delivery status",
    "notify.deliveryAlerts.label": "Delivery alerts",
    "notify.deliveryAlerts.note": "When your rider is on the way",
    "notify.promotions.label": "Offers & promotions",
    "notify.promotions.note": "Discounts and cashback deals",
    "notify.email.label": "Email",
    "notify.email.note": "Invoices and receipts",
    "notify.sms.label": "SMS",
    "notify.sms.note": "Critical updates only",
    "notify.push.label": "Push notifications",
    "notify.push.note": "On this device",

    // Profile Sections
    "profile.edit": "Edit Profile",
    "profile.saveChanges": "Save Changes",
    "profile.account": "Account",
    "profile.support": "Support",
    "profile.logout": "Logout",
    "profile.logoutConfirm": "Logout of QuickPress?",
    "profile.logoutNote": "You'll need to sign in again to book pickups and track your orders.",

    // Account rows
    "account.personal": "Personal Information",
    "account.personalNote": "Name, phone, email",
    "account.addresses": "Manage Addresses",
    "account.payments": "Payment Methods",
    "account.orders": "My Orders",
    "account.history": "Order History",
    "account.invoices": "Invoices",
    "account.services": "Saved Services",
    "account.stores": "Favourite Laundry Stores",

    // Support rows
    "support.help": "Help Center",
    "support.chat": "Live Chat",
    "support.call": "Call Support",
    "support.faq": "FAQ",
    "support.report": "Report an Issue",
  },
  "hi-IN": {
    // General
    "app.name": "क्विकप्रेस",
    "common.save": "सुरक्षित करें",
    "common.cancel": "रद्द करें",
    "common.retry": "पुनः प्रयास करें",
    "common.offline": "आप ऑफ़लाइन हैं",
    "common.soon": "जल्द आ रहा है",
    "common.close": "बंद करें",

    // Profile & Settings Headers
    "profile.title": "मेरी प्रोफाइल",
    "settings.title": "सेटिंग्स",
    "settings.appearance": "थीम एवं रूप",
    "settings.notifications": "सूचनाएं (Notifications)",
    "settings.language": "भाषा (Language)",
    "settings.syncing": "प्राथमिकताएं सिंक हो रही हैं…",

    // Themes
    "theme.light": "लाइट (Light)",
    "theme.dark": "डार्क (Dark)",
    "theme.system": "सिस्टम (System)",

    // Notification Rows
    "notify.orderUpdates.label": "ऑर्डर अपडेट्स",
    "notify.orderUpdates.note": "पिकअप, धुलाई और डिलीवरी की स्थिति",
    "notify.deliveryAlerts.label": "डिलीवरी अलर्ट्स",
    "notify.deliveryAlerts.note": "जब आपका राइडर रास्ते में हो",
    "notify.promotions.label": "ऑफ़र और प्रमोशन",
    "notify.promotions.note": "छूट और कैशबैक सौदे",
    "notify.email.label": "ईमेल",
    "notify.email.note": "चालान और रसीदें",
    "notify.sms.label": "एसएमएस (SMS)",
    "notify.sms.note": "केवल महत्वपूर्ण अपडेट",
    "notify.push.label": "पुश नोटिफिकेशन",
    "notify.push.note": "इस डिवाइस पर",

    // Profile Sections
    "profile.edit": "प्रोफ़ाइल संपादित करें",
    "profile.saveChanges": "परिवर्तन सहेजें",
    "profile.account": "खाता (Account)",
    "profile.support": "सहायता एवं समर्थन",
    "profile.logout": "लॉगआउट",
    "profile.logoutConfirm": "क्विकप्रेस से लॉगआउट करें?",
    "profile.logoutNote": "पिकअप बुक करने और अपने ऑर्डर ट्रैक करने के लिए आपको फिर से साइन इन करना होगा।",

    // Account rows
    "account.personal": "व्यक्तिगत जानकारी",
    "account.personalNote": "नाम, फ़ोन, ईमेल",
    "account.addresses": "पते प्रबंधित करें",
    "account.payments": "भुगतान के तरीके",
    "account.orders": "मेरे ऑर्डर",
    "account.history": "ऑर्डर इतिहास",
    "account.invoices": "बिल और रसीदें",
    "account.services": "सहेजी गई सेवाएं",
    "account.stores": "पसंदीदा लॉन्ड्री स्टोर्स",

    // Support rows
    "support.help": "सहायता केंद्र",
    "support.chat": "लाइव चैट",
    "support.call": "कॉल सपोर्ट",
    "support.faq": "अक्सर पूछे जाने वाले प्रश्न (FAQ)",
    "support.report": "समस्या दर्ज करें",
  },
};

const listeners = new Set<(lang: LanguageCode) => void>();

export function isLanguageCode(value: unknown): value is LanguageCode {
  return value === "en-IN" || value === "hi-IN";
}

export function normalizeLanguage(code: string | null | undefined): LanguageCode {
  if (!code) return DEFAULT_LANGUAGE;
  const clean = code.trim().toLowerCase();
  if (clean === "hi" || clean === "hi-in") return "hi-IN";
  return "en-IN";
}

/** Read stored language code from localStorage, fallback to DEFAULT_LANGUAGE ('en-IN'). */
export function readStoredLanguage(): LanguageCode {
  if (typeof localStorage === "undefined") return DEFAULT_LANGUAGE;
  try {
    const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguageCode(raw) ? raw : normalizeLanguage(raw);
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

/** Store language locally and notify all listeners. */
export function setLanguageLocally(language: string): LanguageCode {
  const code = normalizeLanguage(language);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      if (typeof document !== "undefined") {
        document.documentElement.lang = code.startsWith("hi") ? "hi" : "en";
      }
    } catch {
      /* ignore */
    }
  }
  for (const listener of listeners) {
    listener(code);
  }
  return code;
}

/** Translate key to string in the given or current language with English fallback. */
export function translate(key: string, explicitLang?: LanguageCode): string {
  const lang = explicitLang || readStoredLanguage();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANGUAGE];
  if (dict[key]) return dict[key];
  return TRANSLATIONS[DEFAULT_LANGUAGE][key] || key;
}

export const t = translate;

/** React hook for reactive i18n support in components. */
export function useLanguage(): {
  language: LanguageCode;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
} {
  const [lang, setLang] = useState<LanguageCode>(readStoredLanguage);

  useEffect(() => {
    const handler = (next: LanguageCode) => setLang(next);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return {
    language: lang,
    setLanguage: (next) => setLanguageLocally(next),
    t: (key: string) => translate(key, lang),
  };
}
