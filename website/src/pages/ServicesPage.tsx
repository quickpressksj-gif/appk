import React, { useState } from "react";
import { PageType, ModalType } from "@/types";
import {
  IconCheck,
  IconLaundry,
  IconBox,
  IconBriefcase,
  IconMapPin,
  IconShield,
  IconArrowRight,
  IconApple,
  IconGooglePlay,
  IconSmartphone,
  IconSparkle,
  IconCpu,
  IconVan,
  IconStar,
  IconBolt,
} from "@/components/Icons";

const GREEN = "#1A7A3C";

export interface CompactServiceItem {
  id: string;
  title: string;
  category: string;
  categoryPill: string;
  tagline: string;
  desc: string;
  turnaround: string;
  sla: string;
  bestFor: string;
  badges: string[];
  accentColor: string;
  bgLight: string;
  iconType: "laundry" | "dryclean" | "steam" | "shoe" | "home" | "courier" | "business";
}

const ALL_SERVICES_CATALOG: CompactServiceItem[] = [
  // ─── Category: Wash & Fold ──────────────────────────────────────────────
  {
    id: "laundry-wash-fold",
    title: "Wash, Dry & Crisp Fold",
    category: "Wash & Fold",
    categoryPill: "🧺 Wash & Fold",
    tagline: "Eco-wash, tumble dried & sorted into neat bundles.",
    desc: "Casuals, gym activewear, t-shirts & jeans washed with hypoallergenic botanical detergents.",
    turnaround: "⚡ 24h Return",
    sla: "99.8% On-Time",
    bestFor: "Daily casuals, activewear & family bundles",
    badges: ["Color Sorting", "Low-Heat Dry", "Eco Sealed"],
    accentColor: GREEN,
    bgLight: "#E8F7EE",
    iconType: "laundry",
  },
  {
    id: "laundry-wash-iron",
    title: "Wash & Steam Iron Combo",
    category: "Wash & Fold",
    categoryPill: "🧺 Wash & Fold",
    tagline: "Deep wash + Italian vacuum steam press.",
    desc: "Complete garment care combining gentle drum washing with wrinkle-free industrial steam pressing.",
    turnaround: "⚡ 24-48h Return",
    sla: "Zero Wrinkle",
    bestFor: "Office daily wear, shirts, trousers & kurtas",
    badges: ["Stain Pre-Spot", "Vacuum Steam", "Hanger / Fold"],
    accentColor: GREEN,
    bgLight: "#E8F7EE",
    iconType: "laundry",
  },
  {
    id: "laundry-baby-wear",
    title: "Baby & Kids Sanitized Care",
    category: "Wash & Fold",
    categoryPill: "🧺 Wash & Fold",
    tagline: "0% harsh chemicals, 100% pediatric-safe formula.",
    desc: "Ultra-gentle washing for infant clothes, swaddles, bibs, and toddler wear in dedicated drum cycles.",
    turnaround: "⚡ 24h Return",
    sla: "100% Skin Safe",
    bestFor: "Infants, toddlers & sensitive skin",
    badges: ["Organic Soap", "Thermal Rinse", "Sterile Cover"],
    accentColor: "#059669",
    bgLight: "#ECFDF5",
    iconType: "laundry",
  },
  {
    id: "laundry-bed-linens",
    title: "Bed Sheets & Towels Wash",
    category: "Wash & Fold",
    categoryPill: "🧺 Wash & Fold",
    tagline: "High-temp sanitization & plush fluffy finish.",
    desc: "Heavy cotton bedsheets, pillowcases, duvet covers, and bath towels treated for deep hygiene.",
    turnaround: "⚡ 24-48h Return",
    sla: "Bacteria-Free",
    bestFor: "Single/king bedsheets & plush towels",
    badges: ["Fabric Softener", "Anti-Dustmite", "Flat-Folded"],
    accentColor: GREEN,
    bgLight: "#E8F7EE",
    iconType: "laundry",
  },

  // ─── Category: Dry Cleaning ──────────────────────────────────────────────
  {
    id: "dc-suits-blazers",
    title: "Suits, Blazers & Tuxedos",
    category: "Dry Cleaning",
    categoryPill: "👔 Dry Clean",
    tagline: "Hydrocarbon solvent dry clean with structure preservation.",
    desc: "Expert dry cleaning preserving canvas, shoulder pads, and lapel curvature with zero fabric stress.",
    turnaround: "⚡ 48h Return",
    sla: "Zero Fabric Stress",
    bestFor: "Corporate suits, designer blazers & tuxedos",
    badges: ["Hydrocarbon Clean", "Form Hanger", "Button QA"],
    accentColor: "#2563EB",
    bgLight: "#EFF6FF",
    iconType: "dryclean",
  },
  {
    id: "dc-silk-sarees",
    title: "Silk Sarees & Lehengas",
    category: "Dry Cleaning",
    categoryPill: "👔 Dry Clean",
    tagline: "Master care for Banarasi, Kanjeevaram & bridal wear.",
    desc: "Hand-finished care for heavy zari, embroidery, pure silk sarees, and ornate designer lehengas.",
    turnaround: "⚡ 48-72h Return",
    sla: "100% Zari Safe",
    bestFor: "Bridal lehengas, Banarasi & Kanjeevaram",
    badges: ["Net Wrapped", "Zari Luster Safe", "Moisture Barrier"],
    accentColor: "#7C3AED",
    bgLight: "#F5F3FF",
    iconType: "dryclean",
  },
  {
    id: "dc-sherwani-ethnic",
    title: "Sherwanis & Indo-Western",
    category: "Dry Cleaning",
    categoryPill: "👔 Dry Clean",
    tagline: "Royal ethnic garment dry cleaning & preservation.",
    desc: "Hand-inspected dry clean for designer sherwanis, bandhgalas, silk kurtas, and velvet jackets.",
    turnaround: "⚡ 48h Return",
    sla: "Master Hand Care",
    bestFor: "Wedding sherwanis & bandhgala jackets",
    badges: ["Stone Masking", "Collar Sweat Clean", "Padded Hanger"],
    accentColor: "#D97706",
    bgLight: "#FEF3C7",
    iconType: "dryclean",
  },
  {
    id: "dc-winter-woolens",
    title: "Woolens & Overcoats",
    category: "Dry Cleaning",
    categoryPill: "👔 Dry Clean",
    tagline: "De-pilling, moth-proofing & down revitalization.",
    desc: "Cashmere sweaters, heavy trench coats, leather jackets, and down-filled winter puffer coats.",
    turnaround: "⚡ 48h Return",
    sla: "De-Pilling Finish",
    bestFor: "Cashmere, tweed coats & puffer jackets",
    badges: ["Motor De-Pill", "Down Fluffing", "Cedar Sachet"],
    accentColor: "#2563EB",
    bgLight: "#EFF6FF",
    iconType: "dryclean",
  },

  // ─── Category: Steam Pressing ───────────────────────────────────────────
  {
    id: "steam-formal-shirts",
    title: "Formal Shirts & Trousers Press",
    category: "Steam Pressing",
    categoryPill: "⚡ Steam Press",
    tagline: "Razor-sharp creases with zero scorch or fabric shine.",
    desc: "Italian vacuum steam finishing for office shirts, pleated trousers, chinos, and formal skirts.",
    turnaround: "⚡ Same-Day / 24h",
    sla: "Zero Scorch",
    bestFor: "Daily formals & corporate executives",
    badges: ["Italian Steam", "Collar Shaping", "Hanger / Box"],
    accentColor: "#059669",
    bgLight: "#ECFDF5",
    iconType: "steam",
  },
  {
    id: "steam-ethnic-kurta",
    title: "Kurta, Pyjama & Saree Steam",
    category: "Steam Pressing",
    categoryPill: "⚡ Steam Press",
    tagline: "Gentle vertical steam for flowing ethnic garments.",
    desc: "High-volume steam finishing for cotton kurtas, linen pyjamas, dhoti pants, and pure cotton sarees.",
    turnaround: "⚡ Same-Day / 24h",
    sla: "Crisp Starch Finish",
    bestFor: "Cotton sarees, festive kurtas & linens",
    badges: ["Custom Starch", "Vertical Former", "Anti-Wrinkle"],
    accentColor: "#D97706",
    bgLight: "#FEF3C7",
    iconType: "steam",
  },

  // ─── Category: Shoe & Leather Spa ────────────────────────────────────────
  {
    id: "shoe-sneaker-spa",
    title: "Sneaker Deep Clean Spa",
    category: "Shoe & Leather Spa",
    categoryPill: "👟 Shoe Spa",
    tagline: "Midsole whitening, upper scrub & ozone odor removal.",
    desc: "Specialized hand restoration for Jordans, Yeezys, running shoes, and white leather sneakers.",
    turnaround: "⚡ 48-72h Return",
    sla: "100% Material Safe",
    bestFor: "Luxury sneakers & white leather shoes",
    badges: ["Midsole Whitening", "UV Ozone Sterilize", "Nano Coating"],
    accentColor: "#2563EB",
    bgLight: "#EFF6FF",
    iconType: "shoe",
  },
  {
    id: "shoe-leather-boot",
    title: "Leather Boots & Bag Spa",
    category: "Shoe & Leather Spa",
    categoryPill: "👟 Shoe Spa",
    tagline: "Beeswax buffing, sole conditioning & suede nap revival.",
    desc: "Deep restoration for Oxford shoes, Chelsea boots, suede loafers, and luxury leather handbags.",
    turnaround: "⚡ 48-72h Return",
    sla: "Carnauba Wax Finish",
    bestFor: "Formal shoes, boots & leather bags",
    badges: ["Beeswax Polish", "Suede Brush", "Edge Dressing"],
    accentColor: "#7C3AED",
    bgLight: "#F5F3FF",
    iconType: "shoe",
  },

  // ─── Category: Home & Bulky Linens ───────────────────────────────────────
  {
    id: "home-blanket-quilt",
    title: "Quilts, Comforters & Blankets",
    category: "Home & Bulky Linens",
    categoryPill: "🏠 Home Linens",
    tagline: "Deep wash & anti-allergen thermal drying.",
    desc: "Single/Double mink blankets, feather down duvets, Jaipuri razai, and heavy winter comforters.",
    turnaround: "⚡ 48h Return",
    sla: "Anti-Dustmite",
    bestFor: "Heavy winter blankets & down duvets",
    badges: ["25kg Drum Wash", "Hot Air Tumbling", "Zipper Storage"],
    accentColor: GREEN,
    bgLight: "#E8F7EE",
    iconType: "home",
  },
  {
    id: "home-curtains-drapes",
    title: "Curtains & Blackout Drapes",
    category: "Home & Bulky Linens",
    categoryPill: "🏠 Home Linens",
    tagline: "Ultrasonic dust extraction & steam pleat alignment.",
    desc: "Floor-length window curtains, sheer drapes, velvet drapes, and blackout curtains with ring care.",
    turnaround: "⚡ 48h Return",
    sla: "Zero Shrinkage",
    bestFor: "Living room drapes & blackout curtains",
    badges: ["Dust Extraction", "Ring Protection", "Pleat Aligned"],
    accentColor: "#059669",
    bgLight: "#ECFDF5",
    iconType: "home",
  },
  {
    id: "home-sofa-carpets",
    title: "Sofa Covers & Rug Spa",
    category: "Home & Bulky Linens",
    categoryPill: "🏠 Home Linens",
    tagline: "Deep stain extraction and odor neutralizing wash.",
    desc: "Removable sofa cushion covers, mattress protectors, dining chair slips, and bedside rugs.",
    turnaround: "⚡ 48-72h Return",
    sla: "Pet Odor Neutralized",
    bestFor: "Sofa covers, cushions & bedside rugs",
    badges: ["Enzyme Treatment", "Color Brightener", "Moisture Sealed"],
    accentColor: "#D97706",
    bgLight: "#FEF3C7",
    iconType: "home",
  },

  // ─── Category: Express Logistics ─────────────────────────────────────────
  {
    id: "courier-instant-point",
    title: "Instant Point-to-Point Courier",
    category: "Express Logistics",
    categoryPill: "🛵 Express Courier",
    tagline: "Direct point-to-point courier across Noida & NCR.",
    desc: "Movement of urgent parcels, documents, gifts, keys, and retail deliveries with live GPS tracking.",
    turnaround: "⚡ Under 45 Mins",
    sla: "< 12m Dispatch",
    bestFor: "Urgent packages, forgotten keys & gifts",
    badges: ["Live GPS Map", "Photo Proof Drop", "₹5,000 Insured"],
    accentColor: "#2563EB",
    bgLight: "#EFF6FF",
    iconType: "courier",
  },
  {
    id: "courier-secure-docs",
    title: "Secure Document & Contract Courier",
    category: "Express Logistics",
    categoryPill: "🛵 Express Courier",
    tagline: "Tamper-proof sealed envelope transit with OTP.",
    desc: "Confidential legal documents, bank cheques, passports, and business contracts delivered with OTP.",
    turnaround: "⚡ Under 60 Mins",
    sla: "100% OTP Security",
    bestFor: "Legal papers, contracts & bank cheques",
    badges: ["Tamper-Proof Seal", "Receiver OTP", "SMS Realtime"],
    accentColor: "#7C3AED",
    bgLight: "#F5F3FF",
    iconType: "courier",
  },

  // ─── Category: Enterprise B2B ───────────────────────────────────────────
  {
    id: "biz-hotel-hospitality",
    title: "Hotels & Salons Bulk Linen",
    category: "Enterprise B2B",
    categoryPill: "🏢 Enterprise B2B",
    tagline: "Scheduled pickup & high-volume processing for businesses.",
    desc: "Bulk laundry management for boutique hotels, serviced apartments, luxury salons, and gyms.",
    turnaround: "⚡ Daily Slots",
    sla: "Dedicated Account",
    bestFor: "Hotels, Airbnbs, salons, spas & gyms",
    badges: ["Morning/Eve Cycles", "Monthly Invoicing", "Whiteness Audit"],
    accentColor: "#7C3AED",
    bgLight: "#F5F3FF",
    iconType: "business",
  },
  {
    id: "biz-corporate-uniforms",
    title: "Corporate Uniforms & Retail Care",
    category: "Enterprise B2B",
    categoryPill: "🏢 Enterprise B2B",
    tagline: "Volume dry cleaning for corporate staff & retail fashion.",
    desc: "Scheduled uniform dry cleaning for airlines, security staff, hospital coats, and retail fashion.",
    turnaround: "⚡ Scheduled",
    sla: "Commercial SLA",
    bestFor: "Offices, retail boutiques & hospitals",
    badges: ["Barcoded Garments", "Priority Fleet", "Custom Branding"],
    accentColor: GREEN,
    bgLight: "#E8F7EE",
    iconType: "business",
  },
];

const CATEGORIES = [
  { label: "All Services", icon: "✨" },
  { label: "Wash & Fold", icon: "🧺" },
  { label: "Dry Cleaning", icon: "👔" },
  { label: "Steam Pressing", icon: "⚡" },
  { label: "Shoe & Leather Spa", icon: "👟" },
  { label: "Home & Bulky Linens", icon: "🏠" },
  { label: "Express Logistics", icon: "🛵" },
  { label: "Enterprise B2B", icon: "🏢" },
];

const QUICK_TAGS = [
  "🧺 Wash & Fold",
  "👔 Suits & Blazers",
  "✨ Silk Sarees",
  "⚡ Steam Press",
  "👟 Sneaker Spa",
  "🏠 Blankets & Quilts",
  "🛵 45m Courier",
];

const PROCESSING_STEPS = [
  {
    step: "01",
    title: "1-Click App Booking",
    subtitle: "Instant schedule",
    desc: "Choose your service, custom detergent & ironing preferences on the QuickPress app with a 1-hour collection window.",
    icon: IconSmartphone,
    accent: GREEN,
    bg: "#E8F7EE",
    tag: "<30s Booking ID",
  },
  {
    step: "02",
    title: "Smart Rider Dispatch",
    subtitle: "Sub-12m arrival",
    desc: "Geospatial algorithm assigns the nearest verified rider. Live GPS tracking shows courier ETA directly on your screen.",
    icon: IconVan,
    accent: "#2563EB",
    bg: "#EFF6FF",
    tag: "Live GPS Telemetry",
  },
  {
    step: "03",
    title: "Barcode Tag & Bag Seal",
    subtitle: "Anti-loss security",
    desc: "Items placed in weather-resistant QuickPress bags sealed with serialized QR barcodes to eliminate lost garments.",
    icon: IconShield,
    accent: "#7C3AED",
    bg: "#F5F3FF",
    tag: "100% Bag QR Sealed",
  },
  {
    step: "04",
    title: "Inspection & Color Sort",
    subtitle: "Fabric safety",
    desc: "Pocket check, fabric segregation (whites, darks, delicates) and stain pre-spotting at verified partner facility.",
    icon: IconCpu,
    accent: "#D97706",
    bg: "#FEF3C7",
    tag: "Pre-Wash Stain Audit",
  },
  {
    step: "05",
    title: "Eco-Wash & Steam Press",
    subtitle: "Hypoallergenic",
    desc: "Cleaned with botanical eco-detergents, sanitized at optimized temperatures, and finished with vacuum steam press.",
    icon: IconSparkle,
    accent: GREEN,
    bg: "#E8F7EE",
    tag: "Zero Harsh Chemicals",
  },
  {
    step: "06",
    title: "QA & Doorstep Return",
    subtitle: "Photo verified",
    desc: "White-glove QA check, sealed in recyclable protective covers, and delivered back on time with contactless photo proof.",
    icon: IconCheck,
    accent: "#059669",
    bg: "#ECFDF5",
    tag: "Verified Photo Drop",
  },
];

export function ServicesPage({
  onNavigate,
  onOpenModal,
  onSelectService,
}: {
  onNavigate: (page: PageType) => void;
  onOpenModal: (type: ModalType) => void;
  onSelectService: (s: any) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState("All Services");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFlowStep, setActiveFlowStep] = useState(0);

  const PLAY_STORE_URL = "https://play.google.com/store/apps";

  // Direct Book Now action: Redirects directly to Play Store + opens download modal
  const handleBookNowClick = (serviceTitle?: string) => {
    window.open(PLAY_STORE_URL, "_blank");
    onOpenModal("download_app");
  };

  // Filtered Services
  const filteredServices = ALL_SERVICES_CATALOG.filter((item) => {
    const matchesCategory =
      selectedCategory === "All Services" || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bestFor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const currentFlow = PROCESSING_STEPS[activeFlowStep];

  return (
    <div className="pt-24 sm:pt-28 pb-20 bg-slate-50/60 min-h-screen space-y-16 sm:space-y-20">
      {/* ─── Compact Hero Header ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-black uppercase tracking-wider mb-3 border border-emerald-200/80 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          Full Service Catalog & Pricing on App
        </div>
        
        <h1 className="text-3xl sm:text-5xl font-black text-gray-950 tracking-tight leading-tight max-w-3xl mx-auto">
          Premium Care For Everything You Wear & Use. <br />
          <span style={{ color: GREEN }}>1-Click Booking On App.</span>
        </h1>
        
        <p className="text-gray-600 text-xs sm:text-base max-w-2xl mx-auto mt-3 leading-relaxed">
          From daily wash & fold and designer dry cleaning to sneaker spa and express 45-min courier across Noida & NCR.
        </p>

        {/* Sleek Search Bar */}
        <div className="max-w-xl mx-auto mt-6 flex flex-col sm:flex-row gap-2.5 items-center">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search services (e.g. Saree, Suit, Sneaker, Curtain, 45m Courier)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white border border-gray-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/10 shadow-xs transition-all"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => handleBookNowClick()}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-white text-xs sm:text-sm shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
            style={{ background: GREEN }}
          >
            <IconGooglePlay className="w-4 h-4 text-emerald-300" />
            <span>Open Play Store →</span>
          </button>
        </div>

        {/* Quick Shortcut Tags */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3.5 max-w-2xl mx-auto">
          <span className="text-[11px] font-bold text-gray-400 uppercase mr-1">Popular:</span>
          {QUICK_TAGS.map((tag) => {
            const cleanTag = tag.replace(/^[^\s]+\s/, "");
            return (
              <button
                key={tag}
                onClick={() => setSearchQuery(cleanTag)}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 text-[11px] font-semibold text-gray-600 hover:text-emerald-800 border border-gray-200/80 transition-all cursor-pointer shadow-2xs"
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Category Pill Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6 max-w-4xl mx-auto">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => {
                  setSelectedCategory(cat.label);
                  setSearchQuery("");
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-gray-950 text-white shadow-md shadow-gray-950/20 scale-[1.04]"
                    : "bg-white text-gray-700 border border-gray-200/80 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Compact & Attractive Services Grid ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Showing <strong className="text-gray-900 font-black">{filteredServices.length}</strong> Services
            </span>
            {selectedCategory !== "All Services" && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                {selectedCategory}
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 hidden sm:inline-flex items-center gap-1">
            <IconCheck className="w-3.5 h-3.5 text-emerald-700" />
            100% Verified Quality Care
          </span>
        </div>

        {filteredServices.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 max-w-md mx-auto">
            <p className="text-gray-500 text-sm font-semibold mb-3">No services found for "{searchQuery}"</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All Services");
              }}
              className="px-4 py-2 rounded-full bg-gray-900 text-white text-xs font-bold hover:bg-gray-800"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredServices.map((s) => {
              const IconComponent =
                s.iconType === "laundry"
                  ? IconLaundry
                  : s.iconType === "dryclean"
                  ? IconSparkle
                  : s.iconType === "steam"
                  ? IconBolt
                  : s.iconType === "shoe"
                  ? IconShield
                  : s.iconType === "home"
                  ? IconBox
                  : s.iconType === "courier"
                  ? IconVan
                  : IconBriefcase;

              return (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-2xs hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Subtle top ambient accent line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 opacity-80 group-hover:opacity-100 transition-opacity"
                    style={{ background: s.accentColor }}
                  />

                  <div>
                    {/* Top Row: Icon + Turnaround Pill */}
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                        style={{ background: s.bgLight }}
                      >
                        <IconComponent className="w-5 h-5" style={{ color: s.accentColor }} />
                      </div>
                      <span className="text-[10px] font-black text-emerald-900 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full shrink-0">
                        {s.turnaround}
                      </span>
                    </div>

                    {/* Service Title & Category Sub-label */}
                    <div className="mb-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        {s.category}
                      </span>
                      <h3 className="text-base font-black text-gray-950 leading-snug group-hover:text-emerald-800 transition-colors">
                        {s.title}
                      </h3>
                    </div>

                    {/* Snappy Description */}
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                      {s.desc}
                    </p>

                    {/* Micro Feature Badges */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {s.badges.map((b) => (
                        <span
                          key={b}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: s.accentColor }}
                          />
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom: Best for + Action CTA */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div className="min-w-0 pr-1">
                      <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-tight">
                        Best For
                      </span>
                      <span className="text-[11px] font-semibold text-gray-800 truncate block">
                        {s.bestFor}
                      </span>
                    </div>

                    <button
                      onClick={() => handleBookNowClick(s.title)}
                      className="px-3.5 py-1.5 rounded-xl font-black text-white text-xs shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      style={{ background: s.accentColor }}
                    >
                      <span>Book</span>
                      <IconArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Compact Operational Pipeline (How It Works) ────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200/90 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200/80">
                Operational Pipeline
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-950 mt-2">
                How Your Garments & Orders Are Processed
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm">
              6-stage seamless lifecycle from 1-click doorstep pickup to white-glove return.
            </p>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
            {PROCESSING_STEPS.map((stg, idx) => {
              const isSelected = idx === activeFlowStep;
              return (
                <button
                  key={stg.step}
                  onClick={() => setActiveFlowStep(idx)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-emerald-50/80 border-emerald-600 shadow-xs ring-1 ring-emerald-600"
                      : "bg-white border-gray-200/80 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-emerald-800 text-white" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {stg.step}
                    </span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />}
                  </div>
                  <div>
                    <span
                      className={`text-xs font-bold leading-tight line-clamp-1 ${
                        isSelected ? "text-gray-950 font-black" : "text-gray-600"
                      }`}
                    >
                      {stg.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Flow Box */}
          <div className="bg-slate-50 rounded-2xl p-5 sm:p-7 border border-gray-200/80 grid md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-8 space-y-2.5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                  style={{ background: currentFlow.bg }}
                >
                  <currentFlow.icon className="w-5 h-5" style={{ color: currentFlow.accent }} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                    Stage {currentFlow.step} • {currentFlow.subtitle}
                  </span>
                  <h4 className="text-lg sm:text-xl font-black text-gray-900 leading-snug">
                    {currentFlow.title}
                  </h4>
                </div>
              </div>

              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                {currentFlow.desc}
              </p>

              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-900 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Telemetry: <strong>{currentFlow.tag}</strong></span>
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200/80 text-center space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Ready in 60 seconds?</span>
              <p className="text-xs font-black text-gray-900">Schedule pickup on Play Store App</p>
              <button
                onClick={() => handleBookNowClick()}
                className="w-full py-2.5 rounded-xl font-bold text-white text-xs shadow-xs hover:scale-105 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                style={{ background: GREEN }}
              >
                <IconGooglePlay className="w-3.5 h-3.5 text-emerald-300" />
                <span>Book on App →</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Compact Dark Mode App Download Banner ──────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#07160D] via-[#0F2819] to-[#081F13] text-white rounded-3xl p-6 sm:p-10 border border-emerald-800/60 shadow-xl grid lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-600/40 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Available on iOS & Android
            </span>
            <h2 className="text-2xl sm:text-4xl font-black leading-tight text-white">
              Get the QuickPress App <br />
              <span style={{ color: "#34D399" }}>for 1-Click Doorstep Service.</span>
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed max-w-xl">
              Order fresh eco-laundry, schedule express package couriers, track your rider live on GPS maps, and manage digital invoices seamlessly from your smartphone.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={() => handleBookNowClick()}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white text-gray-950 hover:bg-gray-100 transition-all shadow-md hover:scale-105 cursor-pointer"
              >
                <IconGooglePlay className="w-6 h-6 text-emerald-600" />
                <div className="text-left">
                  <span className="text-[9px] uppercase font-bold text-gray-500 block leading-none">
                    GET IT ON
                  </span>
                  <span className="text-xs font-black text-gray-950 block">
                    Google Play Store
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  window.open("https://apps.apple.com", "_blank");
                  onOpenModal("download_app");
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white text-gray-950 hover:bg-gray-100 transition-all shadow-md hover:scale-105 cursor-pointer"
              >
                <IconApple className="w-6 h-6 text-gray-950" />
                <div className="text-left">
                  <span className="text-[9px] uppercase font-bold text-gray-500 block leading-none">
                    Download on
                  </span>
                  <span className="text-xs font-black text-gray-950 block">
                    Apple App Store
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* QR Code Quick Scan Preview Box */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="bg-[#0A2414] rounded-2xl p-5 border border-emerald-700/60 text-center shadow-lg max-w-xs w-full space-y-3">
              <div className="w-28 h-28 bg-white rounded-xl mx-auto p-2.5 shadow-xs flex items-center justify-center">
                <svg className="w-full h-full text-gray-950" viewBox="0 0 100 100" fill="currentColor">
                  <rect x="5" y="5" width="30" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="13" y="13" width="14" height="14" rx="2" />
                  <rect x="65" y="5" width="30" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="73" y="13" width="14" height="14" rx="2" />
                  <rect x="5" y="65" width="30" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="13" y="73" width="14" height="14" rx="2" />
                  <rect x="42" y="10" width="6" height="6" />
                  <rect x="52" y="10" width="6" height="6" />
                  <rect x="42" y="24" width="6" height="6" />
                  <rect x="10" y="45" width="6" height="6" />
                  <rect x="25" y="45" width="6" height="6" />
                  <rect x="40" y="40" width="20" height="20" rx="3" fill="#1A7A3C" />
                  <rect x="70" y="45" width="6" height="6" />
                  <rect x="85" y="45" width="6" height="6" />
                  <rect x="42" y="70" width="6" height="6" />
                  <rect x="52" y="80" width="6" height="6" />
                  <rect x="70" y="70" width="10" height="10" rx="2" />
                  <rect x="85" y="85" width="10" height="10" rx="2" />
                </svg>
              </div>

              <div>
                <h4 className="font-black text-white text-sm">Scan to Install</h4>
                <p className="text-[11px] text-emerald-200/80 mt-0.5">
                  Point camera to open Play Store
                </p>
              </div>

              <button
                onClick={() => handleBookNowClick()}
                className="w-full py-2 rounded-xl bg-emerald-400 text-gray-950 font-black text-xs hover:bg-emerald-300 transition-all cursor-pointer shadow-xs"
              >
                Open Play Store App →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Compact Quality Guarantee ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 text-center max-w-3xl mx-auto space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-2xs">
            <IconShield className="w-5 h-5" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-gray-950">
            The QuickPress 100% Quality & Freshness Guarantee
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
            If you are not completely delighted with the freshness, cleanliness, or transit condition of your items, we will re-clean or refund your entire order with zero hassle.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleBookNowClick()}
              className="px-6 py-2.5 rounded-full font-bold text-white text-xs shadow-xs hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-1.5"
              style={{ background: GREEN }}
            >
              <IconGooglePlay className="w-3.5 h-3.5 text-emerald-300" />
              <span>Install QuickPress App & Book</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
