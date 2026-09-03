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

export interface DetailedServiceItem {
  id: string;
  title: string;
  category: string;
  tagline: string;
  desc: string;
  turnaround: string;
  sla: string;
  bestFor: string;
  features: string[];
  accentColor: string;
  bgLight: string;
  iconType: "laundry" | "dryclean" | "steam" | "shoe" | "home" | "courier" | "business";
}

const ALL_SERVICES_CATALOG: DetailedServiceItem[] = [
  // ─── Category: Wash & Fold / Daily Laundry ──────────────────────────────
  {
    id: "laundry-wash-fold",
    title: "Wash, Dry & Crisp Fold",
    category: "Wash & Fold",
    tagline: "Eco-wash, tumble dried & sorted into neat stacks.",
    desc: "Everyday t-shirts, jeans, gym activewear, socks, and home wear cleaned with hypoallergenic botanical detergents.",
    turnaround: "24 Hours Return",
    sla: "99.8% On-Time Delivery",
    bestFor: "Daily casuals, activewear, family clothes & student bundles",
    features: [
      "Color sorting (Whites, darks, and brights separated)",
      "Hypoallergenic & fragrance-free detergent options",
      "Low-heat tumble dry to prevent fabric shrinkage",
      "Crisply folded and sealed in protective eco-covers",
    ],
    accentColor: GREEN,
    bgLight: "#E8F7EE",
    iconType: "laundry",
  },
  {
    id: "laundry-wash-iron",
    title: "Wash & Steam Iron Combo",
    category: "Wash & Fold",
    tagline: "Complete wash, tumble dry & wrinkle-free steam press.",
    desc: "Complete garment care combining gentle machine washing with Italian industrial steam pressing ready to wear.",
    turnaround: "24-48 Hours Return",
    sla: "Guaranteed Zero Wrinkle",
    bestFor: "Office daily wear, casual shirts, trousers & cotton kurtas",
    features: [
      "Deep fiber cleansing & stain pre-spotting",
      "High-pressure steam ironing (Box fold or hanger)",
      "Collar and cuff precision shaping",
      "Ready to hang in your wardrobe",
    ],
    accentColor: GREEN,
    bgLight: "#E8F7EE",
    iconType: "laundry",
  },
  {
    id: "laundry-baby-wear",
    title: "Baby & Kids Sanitized Care",
    category: "Wash & Fold",
    tagline: "0% harsh chemicals, 100% sterilized pediatric care.",
    desc: "Ultra-gentle washing for infant clothes, bibs, swaddles, and toddler wear using organic pediatric-safe formulas.",
    turnaround: "24 Hours Return",
    sla: "100% Skin-Safe & Chemical Free",
    bestFor: "Infants, toddlers, sensitive skin & baby blankets",
    features: [
      "Organic, fragrance-free baby safe liquid soap",
      "Antiseptic thermal rinse cycle",
      "Separate dedicated machine drum cycle",
      "Sanitized packaging in sterile barrier covers",
    ],
    accentColor: "#059669",
    bgLight: "#ECFDF5",
    iconType: "laundry",
  },
  {
    id: "laundry-bed-linens",
    title: "Bed Sheets & Towels Deep Wash",
    category: "Wash & Fold",
    tagline: "High-temperature wash, sanitized & fluffy soft finish.",
    desc: "Heavy cotton bedsheets, pillowcases, duvet covers, and plush bath towels treated for deep hygiene.",
    turnaround: "24-48 Hours Return",
    sla: "Bacteria-Free Thermal Rinse",
    bestFor: "Single & king bedsheets, bath towels & face towels",
    features: [
      "Fabric softening rinse for plush fluffiness",
      "High-temperature sanitization to remove dust mites",
      "Precision flat-fold packaging",
    ],
    accentColor: GREEN,
    bgLight: "#E8F7EE",
    iconType: "laundry",
  },

  // ─── Category: Premium Dry Cleaning ──────────────────────────────────────
  {
    id: "dc-suits-blazers",
    title: "Suits, Blazers & Tuxedos",
    category: "Dry Cleaning",
    tagline: "Hydrocarbon solvent dry clean with structure preservation.",
    desc: "Expert dry cleaning for two-piece suits, blazers, waistcoats, and tuxedos preserving shoulder pads, canvas, and lapels.",
    turnaround: "48 Hours Return",
    sla: "Zero Fabric Stress Guarantee",
    bestFor: "Corporate suits, designer blazers & formal tuxedos",
    features: [
      "Multi-point fabric and lining inspection",
      "Zero-water hydrocarbon solvent extraction",
      "Form-fitting shoulder hanger and breathable suit bag",
      "Free button reinforcement check",
    ],
    accentColor: "#2563EB",
    bgLight: "#EFF6FF",
    iconType: "dryclean",
  },
  {
    id: "dc-silk-sarees",
    title: "Silk Sarees, Zari & Lehengas",
    category: "Dry Cleaning",
    tagline: "Master care for Banarasi, Kanjeevaram & bridal wear.",
    desc: "Hand-finished care for heavy embroidery, stone work, pure silk sarees, bridal lehengas, and ornate dupattas.",
    turnaround: "48-72 Hours Return",
    sla: "100% Embroidery & Zari Safe",
    bestFor: "Bridal lehengas, Banarasi/Kanjeevaram sarees & anarkalis",
    features: [
      "Protective net wrapping during dry cleaning cycle",
      "Specialized gold/silver zari luster preservation",
      "Gentle steam drape finishing without shine marks",
      "Moisture-proof bridal garment packaging",
    ],
    accentColor: "#7C3AED",
    bgLight: "#F5F3FF",
    iconType: "dryclean",
  },
  {
    id: "dc-sherwani-ethnic",
    title: "Sherwanis & Indo-Western",
    category: "Dry Cleaning",
    tagline: "Ornate ethnic garment dry cleaning & preservation.",
    desc: "Royal care for designer sherwanis, bandhgalas, silk kurtas, and velvet jackets with intricate handwork.",
    turnaround: "48 Hours Return",
    sla: "Hand-Inspected Master Care",
    bestFor: "Wedding sherwanis, festive kurtas & bandhgala jackets",
    features: [
      "Pre-cleaning stone and bead protection masking",
      "Deep sweat and stain removal from collar and lining",
      "Custom padded hanger to maintain garment contour",
    ],
    accentColor: "#D97706",
    bgLight: "#FEF3C7",
    iconType: "dryclean",
  },
  {
    id: "dc-winter-woolens",
    title: "Woolens, Overcoats & Jackets",
    category: "Dry Cleaning",
    tagline: "De-pilling, moth-proofing & down jacket revitalization.",
    desc: "Cashmere sweaters, heavy trench coats, leather-trimmed overcoats, and down-filled winter jackets.",
    turnaround: "48 Hours Return",
    sla: "De-Pilling & Loft Restoration",
    bestFor: "Cashmere, tweed coats, leather jackets & puffer coats",
    features: [
      "Motorized de-pilling to remove fabric fuzz and lint",
      "Down feather loft fluffing and thermal refresh",
      "Moth-repellent organic cedar sachet included",
    ],
    accentColor: "#2563EB",
    bgLight: "#EFF6FF",
    iconType: "dryclean",
  },

  // ─── Category: Steam Press & Ironing ────────────────────────────────────
  {
    id: "steam-formal-shirts",
    title: "Formal Shirt & Trouser Steam Press",
    category: "Steam Pressing",
    tagline: "Razor-sharp creases with zero scorch or fabric shine.",
    desc: "Industrial boiler steam finishing for office shirts, pleated trousers, chinos, and formal skirts.",
    turnaround: "Same-Day / 24h",
    sla: "Zero Scorch Guarantee",
    bestFor: "Office executives, daily formals & interview wear",
    features: [
      "Italian vacuum table ironing preventing pocket impressions",
      "Crisp collar and cuff shaping",
      "Choice of Hanger packaging or Folded bundle",
    ],
    accentColor: "#059669",
    bgLight: "#ECFDF5",
    iconType: "steam",
  },
  {
    id: "steam-ethnic-kurta",
    title: "Kurta, Pyjama & Saree Steam Press",
    category: "Steam Pressing",
    tagline: "Gentle vertical steam ironing for flowing ethnic garments.",
    desc: "High-volume steam finishing for cotton kurtas, linen pyjamas, dhoti pants, and pure cotton sarees with custom starch.",
    turnaround: "Same-Day / 24h",
    sla: "Light, Medium or Heavy Starch Options",
    bestFor: "Cotton sarees, festive kurtas, linen shirts & dhotis",
    features: [
      "Natural rice starch application upon request",
      "Non-contact vertical steam formers for delicate silks",
      "Wrinkle-resistant protective garment sleeve",
    ],
    accentColor: "#D97706",
    bgLight: "#FEF3C7",
    iconType: "steam",
  },

  // ─── Category: Shoe Care & Leather Spa ───────────────────────────────────
  {
    id: "shoe-sneaker-spa",
    title: "Sneaker Deep Clean & Restoration",
    category: "Shoe & Leather Spa",
    tagline: "Midsole whitening, upper deep scrub & odor removal.",
    desc: "Specialized hand restoration for Jordans, Yeezys, white sneakers, running shoes, and knit canvas footwear.",
    turnaround: "48-72 Hours Return",
    sla: "100% Material-Safe Scrub",
    bestFor: "Luxury sneakers, white leather shoes & running trainers",
    features: [
      "Separate sole, insole, upper & lace deep scrub",
      "Midsole un-yellowing & whitening treatment",
      "UV ozone sterilization chamber for 99.9% odor removal",
      "Water-repellent nano-coating shield applied",
    ],
    accentColor: "#2563EB",
    bgLight: "#EFF6FF",
    iconType: "shoe",
  },
  {
    id: "shoe-leather-boot",
    title: "Leather Shoe Polish & Suede Care",
    category: "Shoe & Leather Spa",
    tagline: "Beeswax buffing, sole conditioning & suede nap revival.",
    desc: "Premium treatment for Oxford shoes, Brogues, Chelsea boots, suede loafers, and leather handbags.",
    turnaround: "48-72 Hours Return",
    sla: "Premium Wax & Suede Brush Finish",
    bestFor: "Formal leather shoes, suede boots, leather jackets & bags",
    features: [
      "Premium carnauba & beeswax nourishing cream polish",
      "Brass brush restoration for suede and nubuck nap",
      "Edge dressing & heel sole scuff repair",
      "Custom wooden shoe tree shaping during drying",
    ],
    accentColor: "#7C3AED",
    bgLight: "#F5F3FF",
    iconType: "shoe",
  },

  // ─── Category: Home & Bulky Linens ───────────────────────────────────────
  {
    id: "home-blanket-quilt",
    title: "Quilts, Comforters & Blankets",
    category: "Home & Bulky Linens",
    tagline: "Deep wash & anti-allergen thermal drying for heavy bedding.",
    desc: "Single/Double mink blankets, feather down duvets, Jaipuri razai, and heavy winter comforters.",
    turnaround: "48 Hours Return",
    sla: "Dust-Mite Free Thermal Dry",
    bestFor: "Heavy winter blankets, down comforters & quilted bedspreads",
    features: [
      "Commercial 25kg washer drum with anti-tangling action",
      "High-power hot air tumbling to restore duvet fluffiness",
      "Sealed in heavy-gauge zippered storage bags",
    ],
    accentColor: GREEN,
    bgLight: "#E8F7EE",
    iconType: "home",
  },
  {
    id: "home-curtains-drapes",
    title: "Curtains & Blackout Drapes",
    category: "Home & Bulky Linens",
    tagline: "Dust extraction, pleat alignment & steam refresh.",
    desc: "Floor-length window curtains, sheer drapes, velvet drapes, and blackout curtains with hook safety care.",
    turnaround: "48 Hours Return",
    sla: "Zero Shrinkage & Exact Length Guarantee",
    bestFor: "Living room drapes, sheer curtains & blackout blinds",
    features: [
      "Ultrasonic dust and soot extraction",
      "Ring/Eyelet protection masking before cleaning",
      "Vertical steam pleat alignment ready to re-hang",
    ],
    accentColor: "#059669",
    bgLight: "#ECFDF5",
    iconType: "home",
  },
  {
    id: "home-sofa-carpets",
    title: "Sofa Covers & Rug Sanitization",
    category: "Home & Bulky Linens",
    tagline: "Deep stain extraction and odor neutralizing wash.",
    desc: "Removable sofa cushion covers, mattress protectors, dining chair slips, and bedside rugs.",
    turnaround: "48-72 Hours Return",
    sla: "Deep Stain & Pet Odor Removal",
    bestFor: "Sofa slipcovers, cushion covers & Persian/acrylic rugs",
    features: [
      "Enzyme-based food stain and pet odor neutralizer",
      "Color-safe fabric brightening rinse",
      "Moisture-sealed clean delivery pack",
    ],
    accentColor: "#D97706",
    bgLight: "#FEF3C7",
    iconType: "home",
  },

  // ─── Category: Express Courier & Doorstep Delivery ──────────────────────
  {
    id: "courier-instant-point",
    title: "Instant Point-to-Point Delivery",
    category: "Express Logistics",
    tagline: "Direct point-to-point courier across your entire city.",
    desc: "Convenient movement of parcels, documents, gifts, forgotten keys, and retail inventory with live GPS tracking.",
    turnaround: "Under 45 Mins",
    sla: "< 12m Driver Dispatch",
    bestFor: "Urgent package dispatch, forgotten keys, retail returns & gifts",
    features: [
      "Instant courier dispatch & direct transit without batch delays",
      "Real-time GPS parcel live tracking on map",
      "Photo proof of pickup & contactless doorstep drop",
      "Insured protection up to ₹5,000 included",
    ],
    accentColor: "#2563EB",
    bgLight: "#EFF6FF",
    iconType: "courier",
  },
  {
    id: "courier-secure-docs",
    title: "Secure Document & Contract Courier",
    category: "Express Logistics",
    tagline: "Tamper-proof sealed envelope transit with OTP verification.",
    desc: "Confidential legal documents, passports, bank cheques, and business contracts delivered with OTP confirmation.",
    turnaround: "Under 60 Mins",
    sla: "100% OTP Handoff Security",
    bestFor: "Legal papers, office contracts, passports & corporate deeds",
    features: [
      "Tamper-evident waterproof security envelope provided",
      "Receiver OTP verification before delivery handoff",
      "Real-time SMS status updates to sender & recipient",
    ],
    accentColor: "#7C3AED",
    bgLight: "#F5F3FF",
    iconType: "courier",
  },

  // ─── Category: Commercial & Enterprise Logistics ────────────────────────
  {
    id: "biz-hotel-hospitality",
    title: "Hotel & Salon Bulk Linen Fulfillment",
    category: "Enterprise B2B",
    tagline: "Dedicated scheduled pickup & high-volume processing.",
    desc: "Bulk laundry management for boutique hotels, serviced apartments, luxury salons, and gym chains.",
    turnaround: "Daily Scheduled Slots",
    sla: "Dedicated Account SLA",
    bestFor: "Hotels, Airbnb chains, salons, spas & fitness clubs",
    features: [
      "Daily scheduled morning pickup & evening return cycles",
      "Consolidated monthly invoicing & multi-property dashboard",
      "Whiteness index & fiber longevity monitoring",
    ],
    accentColor: "#7C3AED",
    bgLight: "#F5F3FF",
    iconType: "business",
  },
  {
    id: "biz-corporate-uniforms",
    title: "Corporate Uniforms & Retail Care",
    category: "Enterprise B2B",
    tagline: "Volume dry cleaning for corporate staff & retail fashion.",
    desc: "Scheduled uniform dry cleaning for airlines, security staff, hospital healthcare coats, and retail fashion store steam pressing.",
    turnaround: "Scheduled & On-Demand",
    sla: "Guaranteed Commercial Turnaround",
    bestFor: "Corporate offices, retail boutiques & healthcare facilities",
    features: [
      "Individual employee barcoded garment tracking",
      "Custom branding packaging options",
      "Priority fleet allocation during peak hours",
    ],
    accentColor: GREEN,
    bgLight: "#E8F7EE",
    iconType: "business",
  },
];

const CATEGORIES = [
  "All Services",
  "Wash & Fold",
  "Dry Cleaning",
  "Steam Pressing",
  "Shoe & Leather Spa",
  "Home & Bulky Linens",
  "Express Logistics",
  "Enterprise B2B",
];

const PROCESSING_STEPS = [
  {
    step: "01",
    title: "1-Click App Booking",
    subtitle: "Customize Preferences",
    desc: "Select service on the QuickPress app, customize detergent & ironing options, and choose your preferred 1-hour collection window.",
    icon: IconSmartphone,
    accent: GREEN,
    bg: "#E8F7EE",
    telemetry: "Order registered in <30 seconds with instant booking ID",
  },
  {
    step: "02",
    title: "Smart Courier Dispatch",
    subtitle: "Sub-12 Min Arrival",
    desc: "Our geospatial algorithm assigns the nearest verified rider. Live GPS tracking shows courier ETA directly on your mobile screen.",
    icon: IconVan,
    accent: "#2563EB",
    bg: "#EFF6FF",
    telemetry: "Live GPS telemetry synced with recipient app",
  },
  {
    step: "03",
    title: "Barcode Tagging & Bag Seal",
    subtitle: "Digital Itemized Receipt",
    desc: "Items are placed inside weather-resistant QuickPress bags sealed with serialized QR barcodes to eliminate lost garments.",
    icon: IconShield,
    accent: "#7C3AED",
    bg: "#F5F3FF",
    telemetry: "Serialized barcode scanned at collection handoff",
  },
  {
    step: "04",
    title: "Inspection & Fabric Sorting",
    subtitle: "Color & Care Profiles",
    desc: "At the partner facility, garments undergo pocket checks, color segregation (whites, darks, delicates), and pre-wash stain treatment.",
    icon: IconCpu,
    accent: "#D97706",
    bg: "#FEF3C7",
    telemetry: "Automated weight check & digital garment audit logged",
  },
  {
    step: "05",
    title: "Eco-Care Wash & Steam Press",
    subtitle: "Hypoallergenic Formula",
    desc: "Treated with botanical eco-detergents, sanitized at optimized temperatures, and finished with crisp steam ironing on eco-hangers or box fold.",
    icon: IconSparkle,
    accent: GREEN,
    bg: "#E8F7EE",
    telemetry: "Zero harsh chemicals • Gentle garment cycle",
  },
  {
    step: "06",
    title: "White-Glove QA & Return",
    subtitle: "On-Time Doorstep Delivery",
    desc: "Final QA inspection, packaged in 100% recyclable protective covers, and delivered back to your doorstep on schedule with photo proof.",
    icon: IconCheck,
    accent: "#059669",
    bg: "#ECFDF5",
    telemetry: "Delivered & verified with contactless photo proof",
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
      item.bestFor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const currentFlow = PROCESSING_STEPS[activeFlowStep];

  return (
    <div className="pt-24 sm:pt-32 pb-24 space-y-24 bg-white">
      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-widest uppercase mb-4 border border-emerald-100">
          Our Complete Services Directory
        </span>
        <h1 className="text-4xl sm:text-6xl font-black text-gray-950 leading-tight max-w-4xl mx-auto">
          Every garment, shoe & courier service, <br />
          <span style={{ color: GREEN }}>at your fingertips on the app.</span>
        </h1>
        <p className="text-gray-600 text-base sm:text-xl max-w-2xl mx-auto mt-6 leading-relaxed">
          From daily laundry and steam pressing to luxury silk dry cleaning, shoe spas, and express courier dispatch. Tap <strong>"Book Now"</strong> to install the QuickPress app and schedule in seconds.
        </p>

        {/* Search & Direct App Store Triggers */}
        <div className="max-w-xl mx-auto mt-8 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search any service (e.g. Saree, Suit, Sneaker, Steam Press, Curtain)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-5 py-3.5 rounded-full border border-gray-300 text-sm focus:outline-none focus:border-emerald-600 shadow-xs"
          />
          <button
            onClick={() => handleBookNowClick()}
            className="px-7 py-3.5 rounded-full font-black text-white text-xs sm:text-sm shadow-md hover:scale-105 transition-all cursor-pointer flex items-center justify-center gap-2"
            style={{ background: GREEN }}
          >
            <IconGooglePlay className="w-4 h-4 text-emerald-300" />
            <span>Open Play Store →</span>
          </button>
        </div>

        {/* Category Filters Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-emerald-800 text-white shadow-md shadow-emerald-900/10 scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Comprehensive Services Grid (Zero Pricing Display, Direct Play Store Redirect) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <p className="text-xs sm:text-sm font-bold text-gray-500">
            Showing <span className="text-gray-900 font-black">{filteredServices.length}</span> verified services across <span className="text-emerald-800 font-bold">{selectedCategory}</span>
          </p>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            ✓ Available on Play Store App
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                className="bg-white rounded-3xl p-7 border border-gray-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs"
                      style={{ background: s.bgLight }}
                    >
                      <IconComponent className="w-6 h-6" style={{ color: s.accentColor }} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                      {s.category}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-gray-950 mb-1 group-hover:text-emerald-800 transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-emerald-700 text-xs font-bold mb-3">
                    {s.tagline}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed mb-5">
                    {s.desc}
                  </p>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 mb-5 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-0.5">
                      Recommended For:
                    </span>
                    <p className="font-semibold text-gray-800 text-[11px] leading-snug">{s.bestFor}</p>
                  </div>

                  <div className="space-y-2 mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                      Key Highlights:
                    </span>
                    <ul className="space-y-1.5 text-xs text-gray-600">
                      {s.features.slice(0, 3).map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5"
                            style={{ background: s.accentColor }}
                          >
                            <IconCheck className="w-2.5 h-2.5" />
                          </span>
                          <span className="text-[11px] leading-tight">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">
                      Turnaround
                    </span>
                    <span className="text-xs font-black text-gray-900 block">
                      {s.turnaround}
                    </span>
                  </div>

                  {/* Direct Play Store Redirect Button */}
                  <button
                    onClick={() => handleBookNowClick(s.title)}
                    className="px-5 py-2.5 rounded-full font-black text-white text-xs shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                    style={{ background: s.accentColor }}
                  >
                    <span>Book Now</span>
                    <IconArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── End-to-End Processing Flow Section ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-50 rounded-3xl p-8 sm:p-14 border border-gray-200/80 shadow-md">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
              Operational Pipeline
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-950 mt-3">
              How Your Order Is Processed
            </h2>
            <p className="text-gray-500 text-sm sm:text-base mt-2">
              From doorstep collection to eco-processing and live tracked return, explore our complete 6-stage lifecycle.
            </p>
          </div>

          {/* 6-Step Horizontal Progress Bar & Switcher */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-10">
            {PROCESSING_STEPS.map((stg, idx) => {
              const isSelected = idx === activeFlowStep;
              return (
                <button
                  key={stg.step}
                  onClick={() => setActiveFlowStep(idx)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-white border-emerald-600 shadow-md ring-2 ring-emerald-600/20 scale-[1.03]"
                      : "bg-white/70 border-gray-200 text-gray-500 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-emerald-800 text-white" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {stg.step}
                    </span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-live-dot" />}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">
                      Stage {stg.step}
                    </span>
                    <span
                      className={`text-xs font-bold truncate block ${
                        isSelected ? "text-gray-900 font-black" : "text-gray-600"
                      }`}
                    >
                      {stg.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Flow Detailed Card */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200/90 shadow-lg grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: currentFlow.bg }}
                >
                  <currentFlow.icon className="w-6 h-6" style={{ color: currentFlow.accent }} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                    Stage {currentFlow.step} • {currentFlow.subtitle}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mt-0.5">
                    {currentFlow.title}
                  </h3>
                </div>
              </div>

              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                {currentFlow.desc}
              </p>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2.5 text-xs text-emerald-900 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-live-dot shrink-0" />
                <span><strong>Live Operational Telemetry:</strong> {currentFlow.telemetry}</span>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center space-y-3">
              <span className="text-xs font-bold text-gray-400 uppercase">Ready to experience this?</span>
              <p className="text-sm font-black text-gray-900">Book in under 60 seconds on the app</p>
              <button
                onClick={() => handleBookNowClick()}
                className="w-full py-3 rounded-full font-bold text-white text-xs shadow-md hover:scale-105 transition-all cursor-pointer flex items-center justify-center gap-2"
                style={{ background: GREEN }}
              >
                <IconGooglePlay className="w-4 h-4 text-emerald-300" />
                <span>Open Play Store & Book →</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Download Application Showcase Banner (Play Store & Apple Store) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#07160D] via-[#0F2819] to-[#081F13] text-white rounded-3xl p-8 sm:p-14 border border-emerald-800/60 shadow-2xl grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-600/40 text-emerald-400 text-xs font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-live-dot" />
              Available for iOS & Android
            </span>
            <h2 className="text-3xl sm:text-5xl font-black leading-tight text-white">
              Get the QuickPress App <br />
              <span style={{ color: "#34D399" }}>for 1-Click Doorstep Service.</span>
            </h2>
            <p className="text-emerald-100/80 text-sm sm:text-base leading-relaxed">
              Order fresh eco-laundry, schedule express package couriers, track your driver live on GPS maps, and manage digital invoices seamlessly from your smartphone.
            </p>

            {/* App Store & Play Store Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => handleBookNowClick()}
                className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-white text-gray-950 hover:bg-gray-100 transition-all shadow-xl hover:scale-105 cursor-pointer"
              >
                <IconGooglePlay className="w-7 h-7 text-emerald-600" />
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block leading-tight">
                    GET IT ON
                  </span>
                  <span className="text-sm font-black text-gray-950 block">
                    Google Play Store
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  window.open("https://apps.apple.com", "_blank");
                  onOpenModal("download_app");
                }}
                className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-white text-gray-950 hover:bg-gray-100 transition-all shadow-xl hover:scale-105 cursor-pointer"
              >
                <IconApple className="w-7 h-7 text-gray-950" />
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block leading-tight">
                    Download on the
                  </span>
                  <span className="text-sm font-black text-gray-950 block">
                    Apple App Store
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* QR Code Quick Scan Preview Box */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="bg-[#0A2414] rounded-3xl p-7 border border-emerald-700/60 text-center shadow-xl max-w-xs w-full space-y-4">
              <div className="w-36 h-36 bg-white rounded-2xl mx-auto p-3 shadow-md flex items-center justify-center">
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
                <h4 className="font-black text-white text-base">Scan to Install</h4>
                <p className="text-xs text-emerald-200/80 mt-1">
                  Point your phone camera to download instantly
                </p>
              </div>

              <button
                onClick={() => handleBookNowClick()}
                className="w-full py-3 rounded-full bg-emerald-400 text-gray-950 font-black text-xs hover:bg-emerald-300 transition-all cursor-pointer shadow-md"
              >
                Open Play Store App →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Quality Guarantee ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-50 rounded-3xl p-8 sm:p-14 border border-gray-200/80 text-center max-w-4xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
            <IconShield className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-black text-gray-950">
            The QuickPress 100% Quality & Care Guarantee
          </h2>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            If you are not completely delighted with the freshness, cleanliness, or transit condition of your order, we will rewash, redeliver, or refund your entire order with zero hassle.
          </p>
          <div className="pt-4">
            <button
              onClick={() => handleBookNowClick()}
              className="px-8 py-3.5 rounded-full font-bold text-white text-sm shadow-md hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-2"
              style={{ background: GREEN }}
            >
              <IconGooglePlay className="w-4 h-4 text-emerald-300" />
              <span>Install on Play Store & Book Now</span>
              <IconArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
