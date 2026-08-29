import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

export type LanguageCode = "en" | "hi" | "mr" | "bn" | "ta" | "te" | "kn" | "ml" | "gu" | "pa";

export interface LanguageOption {
  code: LanguageCode;
  nativeName: string;
  englishName: string;
  subtext: string;
  scriptBadge: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", subtext: "हिन्दी में जारी रखें", scriptBadge: "आ" },
  { code: "en", nativeName: "English", englishName: "English", subtext: "Continue in English", scriptBadge: "A" },
  { code: "mr", nativeName: "मराठी", englishName: "Marathi", subtext: "मराठी मध्ये सुरू ठेवा", scriptBadge: "म" },
  { code: "ml", nativeName: "മലയാളം", englishName: "Malayalam", subtext: "മലയാളത്തിൽ തുടരുക", scriptBadge: "മ" },
  { code: "kn", nativeName: "ಕನ್ನಡ", englishName: "Kannada", subtext: "ಕನ್ನಡದಲ್ಲಿ ಮುಂದುವರಿಯಿರಿ", scriptBadge: "ಕ" },
  { code: "te", nativeName: "తెలుగు", englishName: "Telugu", subtext: "తెలుగులో కొనసాగించండి", scriptBadge: "తె" },
  { code: "bn", nativeName: "বাংলা", englishName: "Bangla", subtext: "বাংলায় চালিয়ে যান", scriptBadge: "বা" },
  { code: "ta", nativeName: "தமிழ்", englishName: "Tamil", subtext: "தமிழில் தொடரவும்", scriptBadge: "த" },
  { code: "gu", nativeName: "ગુજરાતી", englishName: "Gujarati", subtext: "ગુજરાતીમાં આગળ વધો", scriptBadge: "ગ" },
  { code: "pa", nativeName: "ਪੰਜਾਬੀ", englishName: "Punjabi", subtext: "ਪੰਜਾਬੀ ਵਿੱਚ ਜਾਰੀ ਰੱਖੋ", scriptBadge: "ਪ" },
];

const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    "app.name": "QuickPress Captain",
    "common.confirm": "Confirm",
    "common.continue": "Continue",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.back": "Back",
    "common.next": "Next",
    "common.submit": "Submit",
    "common.close": "Close",
    "common.online": "Online",
    "common.offline": "Offline",
    "common.help": "Help",
    "common.language": "Language",
    "common.selectLanguage": "Select App Language",
    "common.changeLanguage": "Change Language",

    // Dashboard
    "rider.dashboard": "Captain Dashboard",
    "rider.todayEarnings": "Today's Earnings",
    "rider.completedTrips": "Completed Trips",
    "rider.activeDeliveries": "Active Deliveries",
    "rider.goOnline": "GO ONLINE",
    "rider.goOffline": "GO OFFLINE",
    "rider.youAreOnline": "You are Online & Ready for Trips",
    "rider.youAreOffline": "You are Offline",
    "rider.incomingTrip": "New Delivery Task!",
    "rider.acceptTrip": "ACCEPT TRIP",
    "rider.rejectTrip": "DECLINE",
    "rider.startPickup": "Start Pickup Trip",
    "rider.reachStore": "Reached Store",
    "rider.reachCustomer": "Reached Customer Doorstep",
    "rider.confirmDelivery": "Confirm Delivery (Verify OTP)",
    "rider.wallet": "Wallet & Payouts",
    "rider.withdraw": "Withdraw Cash",

    // Tabs
    "nav.home": "Home",
    "nav.orders": "Tasks",
    "nav.wallet": "Wallet",
    "nav.history": "History",
    "nav.profile": "Profile",
  },

  hi: {
    "app.name": "क्विकप्रेस कैप्टन",
    "common.confirm": "पुष्टि करें",
    "common.continue": "आगे बढ़ें",
    "common.save": "सुरक्षित करें",
    "common.cancel": "रद्द करें",
    "common.back": "पीछे जाएं",
    "common.next": "आगे बढ़ें",
    "common.submit": "जमा करें",
    "common.close": "बंद करें",
    "common.online": "ऑनलाइन",
    "common.offline": "ऑफ़लाइन",
    "common.help": "सहायता (Help)",
    "common.language": "भाषा (Language)",
    "common.selectLanguage": "ऐप की भाषा चुनें",
    "common.changeLanguage": "भाषा बदलें",

    // Dashboard
    "rider.dashboard": "कैप्टन डैशबोर्ड",
    "rider.todayEarnings": "आज की कमाई",
    "rider.completedTrips": "पूर्ण ट्रिप्स",
    "rider.activeDeliveries": "सक्रिय डिलीवरी",
    "rider.goOnline": "ऑनलाइन जाएं (GO ONLINE)",
    "rider.goOffline": "ऑफ़लाइन जाएं (GO OFFLINE)",
    "rider.youAreOnline": "आप ऑनलाइन हैं और ऑर्डर लेने के लिए तैयार हैं",
    "rider.youAreOffline": "आप ऑफ़लाइन हैं",
    "rider.incomingTrip": "नया डिलीवरी टास्क आया है!",
    "rider.acceptTrip": "टास्क स्वीकार करें",
    "rider.rejectTrip": "अस्वीकार करें",
    "rider.startPickup": "पिकअप यात्रा शुरू करें",
    "rider.reachStore": "दुकान / हब पर पहुंचे",
    "rider.reachCustomer": "ग्राहक के पते पर पहुंचे",
    "rider.confirmDelivery": "डिलीवरी पूर्ण करें (OTP सत्यापन)",
    "rider.wallet": "वॉलेट व निकासी",
    "rider.withdraw": "बैंक खाते में ट्रांसफर करें",

    // Tabs
    "nav.home": "होम",
    "nav.orders": "टास्क",
    "nav.wallet": "वॉलेट",
    "nav.history": "इतिहास",
    "nav.profile": "प्रोफ़ाइल",
  },

  mr: {
    "app.name": "क्विकप्रेस कॅप्टन",
    "common.confirm": "पुष्टी करा",
    "common.continue": "पुढे सुरू ठेवा",
    "common.save": "जतन करा",
    "common.cancel": "रद्द करा",
    "common.back": "मागे जा",
    "common.next": "पुढे जा",
    "common.submit": "सादर करा",
    "common.close": "बंद करा",
    "common.online": "ऑनलाइन",
    "common.offline": "ऑफलाइन",
    "common.help": "मदत",
    "common.language": "भाषा",
    "common.selectLanguage": "अ‍ॅप भाषा निवडा",
    "rider.dashboard": "कॅप्टन डॅशबोर्ड",
    "rider.todayEarnings": "आजची कमाई",
    "rider.completedTrips": "पूर्ण फेऱ्या",
    "rider.goOnline": "ऑनलाइन व्हा",
    "rider.goOffline": "ऑफलाइन व्हा",
    "rider.incomingTrip": "नवीन डिलिव्हरी टास्क!",
    "rider.acceptTrip": "स्वीकारा",
    "rider.rejectTrip": "नाकारा",
    "rider.wallet": "वॉलेट",
    "nav.home": "मुख्यपृष्ठ",
    "nav.orders": "टास्क",
    "nav.wallet": "वॉलेट",
    "nav.profile": "प्रोफाइल",
  },

  bn: {
    "app.name": "কুইকপ্রেস ক্যাপ্টেন",
    "common.confirm": "নিশ্চিত করুন",
    "common.continue": "এগিয়ে যান",
    "common.save": "সংরক্ষণ",
    "common.cancel": "বাতিল",
    "common.online": "অনলাইন",
    "common.offline": "অফলাইন",
    "common.help": "সহায়তা",
    "common.language": "ভাষা",
    "common.selectLanguage": "অ্যাপের ভাষা নির্বাচন করুন",
    "rider.dashboard": "ক্যাপ্টেন ড্যাশবোর্ড",
    "rider.todayEarnings": "আজকের আয়",
    "rider.completedTrips": "সম্পন্ন ট্রিপ",
    "rider.goOnline": "অনলাইন যান",
    "rider.goOffline": "অফলাইন যান",
    "rider.incomingTrip": "নতুন ডেলিভারি টাস্ক!",
    "rider.acceptTrip": "গ্রহণ করুন",
    "rider.rejectTrip": "প্রত্যাখ্যান করুন",
    "rider.wallet": "ওয়ালেট",
    "nav.home": "হোম",
    "nav.orders": "টাস্ক",
    "nav.wallet": "ওয়ালেট",
    "nav.profile": "প্রোফাইল",
  },

  ta: {
    "app.name": "குவிக்பிரஸ் கேப்டன்",
    "common.confirm": "உறுதிப்படுத்துக",
    "common.continue": "தொடரவும்",
    "common.online": "ஆன்லைன்",
    "common.offline": "ஆஃப்லைன்",
    "common.help": "உதவி",
    "common.language": "மொழி",
    "common.selectLanguage": "பயன்பாட்டு மொழியைத் தேர்வுசெய்க",
    "rider.dashboard": "கேப்டன் டாஷ்போர்டு",
    "rider.todayEarnings": "இன்றைய வருமானம்",
    "rider.completedTrips": "முடிக்கப்பட்ட பயணங்கள்",
    "rider.goOnline": "ஆன்லைனில் செல்க",
    "rider.goOffline": "ஆஃப்லைனில் செல்க",
    "rider.incomingTrip": "புதிய டெலிவரி பணி!",
    "rider.acceptTrip": "ஏற்றுக்கொள்க",
    "rider.rejectTrip": "நிராகரி",
    "rider.wallet": "வாலட்",
    "nav.home": "முகப்பு",
    "nav.orders": "பணிகள்",
    "nav.wallet": "வாலட்",
    "nav.profile": "சுயவிவரம்",
  },

  te: {
    "app.name": "క్విక్‌ప్రెస్ కెప్టెన్",
    "common.confirm": "నిర్ధారించండి",
    "common.continue": "కొనసాగించండి",
    "common.online": "ఆన్‌లైన్",
    "common.offline": "ఆఫ్‌లైన్",
    "common.help": "సహాయం",
    "common.language": "భాష",
    "common.selectLanguage": "యాప్ భాషను ఎంచుకోండి",
    "rider.dashboard": "కెప్టెన్ డ్యాష్‌బోర్డ్",
    "rider.todayEarnings": "నేటి ఆదాయం",
    "rider.completedTrips": "పూర్తయిన ట్రిప్పులు",
    "rider.goOnline": "ఆన్‌లైన్‌కి వెళ్లండి",
    "rider.goOffline": "ఆఫ్‌లైన్‌కి వెళ్లండి",
    "rider.incomingTrip": "కొత్త డెలివరీ టాస్క్!",
    "rider.acceptTrip": "అంగీకరించండి",
    "rider.rejectTrip": "తిరస్కరించండి",
    "rider.wallet": "వాలెట్",
    "nav.home": "హోమ్",
    "nav.orders": "టాస్కులు",
    "nav.wallet": "వాలెట్",
    "nav.profile": "ప్రొఫైల్",
  },

  kn: {
    "app.name": "ಕ್ವಿಕ್‌ಪ್ರೆಸ್ ಕ್ಯಾಪ್ಟನ್",
    "common.confirm": "ದೃಢೀಕರಿಸಿ",
    "common.continue": "ಮುಂದುವರಿಯಿರಿ",
    "common.online": "ಆನ್‌ಲೈನ್",
    "common.offline": "ಆಫ್‌ಲೈನ್",
    "common.help": "ಸಹಾಯ",
    "common.language": "ಭಾಷೆ",
    "common.selectLanguage": "ಅಪ್ಲಿಕೇಶನ್ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "rider.dashboard": "ಕ್ಯಾಪ್ಟನ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "rider.todayEarnings": "ಇಂದಿನ ಗಳಿಕೆ",
    "rider.completedTrips": "ಪೂರ್ಣಗೊಂಡ ಟ್ರಿಪ್‌ಗಳು",
    "rider.goOnline": "ಆನ್‌ಲೈನ್‌ಗೆ ಹೋಗಿ",
    "rider.goOffline": "ಆಫ್‌ಲೈನ್‌ಗೆ ಹೋಗಿ",
    "rider.incomingTrip": "ಹೊಸ ವಿತರಣಾ ಕಾರ್ಯ!",
    "rider.acceptTrip": "ಸ್ವೀಕರಿಸಿ",
    "rider.rejectTrip": "ತಿರಸ್ಕರಿಸಿ",
    "rider.wallet": "ವ್ಯಾಲೆಟ್",
    "nav.home": "ಮುಖಪುಟ",
    "nav.orders": "ಕಾರ್ಯಗಳು",
    "nav.wallet": "ವ್ಯಾಲೆಟ್",
    "nav.profile": "ಪ್ರೊಫೈಲ್",
  },

  ml: {
    "app.name": "ക്വിക്ക്പ്രസ്സ് ക്യാപ്റ്റൻ",
    "common.confirm": "സ്ഥിരീകരിക്കുക",
    "common.continue": "തുടരുക",
    "common.online": "ഓൺലൈൻ",
    "common.offline": "ഓഫ്‌ലൈൻ",
    "common.help": "സഹായം",
    "common.language": "ഭാഷ",
    "common.selectLanguage": "ആപ്പ് ഭാഷ തിരഞ്ഞെടുക്കുക",
    "rider.dashboard": "ക്യാപ്റ്റൻ ഡാഷ്‌ബോർഡ്",
    "rider.todayEarnings": "ഇന്നത്തെ വരുമാനം",
    "rider.completedTrips": "പൂർത്തിയായ ട്രിപ്പുകൾ",
    "rider.goOnline": "ഓൺലൈനിൽ പോകുക",
    "rider.goOffline": "ഓഫ്‌ലൈനിൽ പോകുക",
    "rider.incomingTrip": "പുതിയ ഡെലിവറി ടാസ്ക്!",
    "rider.acceptTrip": "സ്വീകരിക്കുക",
    "rider.rejectTrip": "നിരസിക്കുക",
    "rider.wallet": "വാലറ്റ്",
    "nav.home": "ഹോം",
    "nav.orders": "ടാസ്ക്കുകൾ",
    "nav.wallet": "വാലറ്റ്",
    "nav.profile": "പ്രൊഫൈൽ",
  },

  gu: {
    "app.name": "ક્વિકપ્રેસ કેપ્ટન",
    "common.confirm": "પુષ્ટિ કરો",
    "common.continue": "આગળ વધો",
    "common.online": "ઓનલાઇન",
    "common.offline": "ઑફલાઇન",
    "common.help": "મદદ",
    "common.language": "ભાષા",
    "common.selectLanguage": "એપ્લિકેશન ભાષા પસંદ કરો",
    "rider.dashboard": "કેપ્ટન ડેશબોર્ડ",
    "rider.todayEarnings": "આજની કમાણી",
    "rider.completedTrips": "પૂર્ણ કરેલ ટ્રિપ્સ",
    "rider.goOnline": "ઓનલાઇન જાઓ",
    "rider.goOffline": "ઑફલાઇન જાઓ",
    "rider.incomingTrip": "નવું ડિલિવરી કાર્ય!",
    "rider.acceptTrip": "સ્વીકારો",
    "rider.rejectTrip": "નકારો",
    "rider.wallet": "વોલેટ",
    "nav.home": "હોમ",
    "nav.orders": "ટાસ્ક",
    "nav.wallet": "વોલેટ",
    "nav.profile": "પ્રોફાઇલ",
  },

  pa: {
    "app.name": "ਕਵਿੱਕਪ੍ਰੈਸ ਕੈਪਟਨ",
    "common.confirm": "ਪੁਸ਼ਟੀ ਕਰੋ",
    "common.continue": "ਅੱਗੇ ਵਧੋ",
    "common.online": "ਆਨਲਾਈਨ",
    "common.offline": "ਆਫਲਾਈਨ",
    "common.help": "ਮਦਦ",
    "common.language": "ਭਾਸ਼ਾ",
    "common.selectLanguage": "ਐਪ ਭਾਸ਼ਾ ਚੁਣੋ",
    "rider.dashboard": "ਕੈਪਟਨ ਡੈਸ਼ਬੋਰਡ",
    "rider.todayEarnings": "ਅੱਜ ਦੀ ਕਮਾਈ",
    "rider.completedTrips": "ਮੁਕੰਮਲ ਯਾਤਰਾਵਾਂ",
    "rider.goOnline": "ਆਨਲਾਈਨ ਜਾਓ",
    "rider.goOffline": "ਆਫਲਾਈਨ ਜਾਓ",
    "rider.incomingTrip": "ਨਵਾਂ ਡਿਲੀਵਰੀ ਕੰਮ!",
    "rider.acceptTrip": "ਸਵੀਕਾਰ ਕਰੋ",
    "rider.rejectTrip": "ਰੱਦ ਕਰੋ",
    "rider.wallet": "ਵਾਲਿਟ",
    "nav.home": "ਹੋਮ",
    "nav.orders": "ਕੰਮ",
    "nav.wallet": "ਵਾਲਿਟ",
    "nav.profile": "ਪ੍ਰੋਫਾਈਲ",
  },
};

const STORAGE_KEY = "quickpress_rider_lang_v1";
const FIRST_TIME_KEY = "quickpress_rider_lang_chosen_v1";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  isLanguageModalOpen: boolean;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
  isLanguageModalOpen: false,
  openLanguageModal: () => {},
  closeLanguageModal: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_KEY) as LanguageCode;
      if (saved && TRANSLATIONS[saved]) return saved;
    }
    return "en";
  });

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const alreadyChosen = window.localStorage.getItem(FIRST_TIME_KEY);
      return !alreadyChosen;
    }
    return false;
  });

  const setLanguage = (newLang: LanguageCode) => {
    if (TRANSLATIONS[newLang]) {
      setLangState(newLang);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, newLang);
        window.localStorage.setItem(FIRST_TIME_KEY, "true");
      }
    }
  };

  const openLanguageModal = () => setIsLanguageModalOpen(true);
  const closeLanguageModal = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FIRST_TIME_KEY, "true");
    }
    setIsLanguageModalOpen(false);
  };

  const t = useMemo(() => {
    return (key: string, fallback?: string): string => {
      const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
      if (dict[key]) return dict[key];
      if (TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
      return fallback || key;
    };
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isLanguageModalOpen,
        openLanguageModal,
        closeLanguageModal,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
