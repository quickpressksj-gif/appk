import React, { useState } from "react";
import { PageType, ModalType } from "@/types";
import {
  IconCheck,
  IconMapPin,
  IconArrowRight,
  IconSmartphone,
  IconHandshake,
  IconVan,
  IconChevronDown,
} from "@/components/Icons";
import customerLogo from "@/assets/quickpress-customer-logo.jpg";
import partnerLogo from "@/assets/quickpress-partner-logo.png";
import captainLogo from "@/assets/quickpress-captain-logo.jpg";

const GREEN = "#1A7A3C";
const YELLOW = "#F59E0B";

const PANELS_DATA = [
  {
    id: "customer",
    name: "QuickPress",
    badgeLabel: "QuickPress Customer Panel",
    badge: "Consumer Mobile App & Web",
    tagline: "Effortless 1-Click Ordering, Live GPS Tracking & Transparent Fabric Care",
    target: "Consumers, Families & Working Professionals",
    accentColor: GREEN,
    bgLight: "#FEF9C3",
    borderColor: "border-yellow-400",
    icon: IconSmartphone,
    logoImg: customerLogo,
    logoBg: "bg-[#FBBF24]",
    description:
      "Designed for seamless customer experience, allowing consumers to schedule doorstep laundry, track pickup captains in real-time, customize washing preferences, and pay securely with digital receipts.",
    capabilities: [
      "1-Click Doorstep Pickup Scheduling with 1-hour preferred slots",
      "Real-Time Geospatial Captain Map Tracking with live countdown ETA",
      "Custom Fabric Care Profiles (Hypoallergenic, Starch intensity, Fold vs Hanger)",
      "Itemized Digital Invoices & Weight Validation before payment",
      "Seamless UPI, Credit/Debit Card & Cash on Delivery payment options",
      "Exclusive App-Only Loyalty Points, Repeat Subscriptions & Special Offers",
    ],
    mockPreview: {
      screenTitle: "QuickPress Customer App",
      orderId: "Order #QP-94820 (Live Tracking)",
      status: "Captain is 0.3 km away • ETA 3 Mins",
      items: "5x Formal Shirts, 2x Trousers, 1x Silk Saree",
      actionText: "Get QuickPress Customer App",
    },
  },
  {
    id: "partner",
    name: "QuickPress Partner",
    badgeLabel: "QuickPress Partner Panel",
    badge: "Partner Onboarding & Facility Tablet OS",
    tagline: "Turnkey Order Intake, Capacity Optimization & Direct Weekly Settlements",
    target: "Commercial Laundromats, Dry Cleaners & Franchise Hubs",
    accentColor: "#059669",
    bgLight: "#ECFDF5",
    borderColor: "border-emerald-500",
    icon: IconHandshake,
    logoImg: partnerLogo,
    logoBg: "bg-white",
    description:
      "A complete cloud-based operating system designed for laundromats, dry-cleaners, and franchise owners to manage daily batch queues, print barcode tags, track fabric chemistry, and receive weekly payouts.",
    capabilities: [
      "Automated Order Inflow directly dispatched from QuickPress consumer app",
      "Turnkey Cloud POS with Serialized Barcode Label Printer integration",
      "Dynamic Station Queue Management (Washing, Steam Pressing, QA Audit)",
      "Pre-wash Garment Inspection & In-App Customer Note Alerts",
      "Automated Weekly Direct Bank Settlement Ledger & Volume P&L Reports",
      "B2B Corporate Batch Invoicing & Multi-Facility Management Support",
    ],
    mockPreview: {
      screenTitle: "QuickPress Partner Onboarding",
      orderId: "Facility Batch #42 (Sector 90 Hub)",
      status: "38 Orders In Processing • 92% Machine Load",
      items: "Today's Gross Settled: ₹38,400",
      actionText: "Apply for Partner Panel",
    },
  },
  {
    id: "captain",
    name: "QuickPress Captain",
    badgeLabel: "QuickPress Captain Panel",
    badge: "Captain Rider Fleet & Logistics App",
    tagline: "Smart Batched Routes, Zero Empty Returns & Maximum Rider Payouts",
    target: "Independent Delivery Riders, Couriers & 2-Wheeler Fleet",
    accentColor: "#D97706",
    bgLight: "#FFFBEB",
    borderColor: "border-yellow-500",
    icon: IconVan,
    logoImg: captainLogo,
    logoBg: "bg-white",
    description:
      "A dedicated navigation and delivery execution tool for our fleet captains. Smart clustering algorithms batch multiple nearby pickups and dropoffs together to maximize captain earnings per hour.",
    capabilities: [
      "Smart Multi-Stop Route Clustering (Zero unutilized empty return trips)",
      "Geofenced Doorstep Arrival & Tamper-Evident Bag Barcode Scanning",
      "Contactless Photo Proof of Delivery & Digital Signature capture",
      "Real-Time Daily Earnings, Bonus Incentives & Instant Withdrawal Ledger",
      "In-App Turn-by-Turn GPS Navigation avoiding peak traffic choke points",
      "Direct In-App Customer Communication with number masking for privacy",
    ],
    mockPreview: {
      screenTitle: "QuickPress Captain Console",
      orderId: "Active Route #R-104 (Sector 62 -> 90)",
      status: "4 Pickups • 3 Scheduled Dropoffs",
      items: "Today's Captain Earnings: ₹1,850 + ₹250 Bonus",
      actionText: "Join as QuickPress Captain",
    },
  },
];

interface LiveSector {
  name: string;
  pincode: string;
  eta: string;
}

interface CityCoverageCard {
  id: string;
  zone: string;
  status: string;
  areas: string;
  avgPickup: string;
  hubs: string;
  captains: string;
  color: string;
  sectors: LiveSector[];
}

const LIVE_COVERAGE_ZONES: CityCoverageCard[] = [
  {
    id: "noida",
    zone: "Noida & Greater Noida",
    status: "100% Operational (HQ Hub)",
    areas: "Sector 90 (Alphathum), 137, 128, 142, 150, 76, 75, 78, 18, 62, Gaur City 1 & 2, TechZone 4",
    avgPickup: "9 – 12 Mins",
    hubs: "56 Active Hubs",
    captains: "140+ Captains",
    color: "border-emerald-200 bg-emerald-50/40",
    sectors: [
      { name: "Sector 90 (Bhutani Alphathum HQ)", pincode: "201305", eta: "8 Mins" },
      { name: "Sector 137 (Paras Tierea / Exotica)", pincode: "201305", eta: "9 Mins" },
      { name: "Sector 128 (Jaypee Greens / Wish Town)", pincode: "201304", eta: "10 Mins" },
      { name: "Sector 142 & 143 (Advant Navis / Gulshan)", pincode: "201305", eta: "10 Mins" },
      { name: "Sector 150 (Sports City / ATS)", pincode: "201310", eta: "12 Mins" },
      { name: "Sector 76 (Amrapali Silicon City)", pincode: "201301", eta: "8 Mins" },
      { name: "Sector 75 (Golf City / Apex Athena)", pincode: "201301", eta: "9 Mins" },
      { name: "Sector 78 (Antriksh Golf / Hyde Park)", pincode: "201301", eta: "8 Mins" },
      { name: "Sector 74 & 77 (Supertech Capetown)", pincode: "201301", eta: "10 Mins" },
      { name: "Sector 18 & 27 (Atta Market / Mall of India)", pincode: "201301", eta: "9 Mins" },
      { name: "Sector 50 & 51 (Alok Vihar / Sagar)", pincode: "201301", eta: "10 Mins" },
      { name: "Sector 62 (Logix Cyber Park / IT Zone)", pincode: "201309", eta: "8 Mins" },
      { name: "Gaur City 1 & 2 (1st to 16th Avenue)", pincode: "201318", eta: "11 Mins" },
      { name: "TechZone 4 (Cherry County / Nirala)", pincode: "201306", eta: "12 Mins" },
      { name: "Pari Chowk & Alpha 1 / 2 Commercial", pincode: "201308", eta: "13 Mins" },
      { name: "Knowledge Park 1, 2, 3 (University Hub)", pincode: "201310", eta: "12 Mins" },
    ],
  },
  {
    id: "delhi",
    zone: "Delhi (NCR)",
    status: "100% Operational",
    areas: "Greater Kailash, Hauz Khas, Saket, Vasant Kunj, Defense Colony, Dwarka, Punjabi Bagh, Mayur Vihar",
    avgPickup: "12 – 15 Mins",
    hubs: "48 Active Hubs",
    captains: "125+ Captains",
    color: "border-emerald-200 bg-emerald-50/40",
    sectors: [
      { name: "Greater Kailash (GK 1 & GK 2)", pincode: "110048", eta: "10 Mins" },
      { name: "Hauz Khas & Green Park", pincode: "110016", eta: "11 Mins" },
      { name: "Saket & Sainik Farm (Select Citywalk)", pincode: "110017", eta: "12 Mins" },
      { name: "Vasant Kunj (Sectors A to D)", pincode: "110070", eta: "12 Mins" },
      { name: "Defense Colony & South Extension", pincode: "110024", eta: "10 Mins" },
      { name: "Dwarka Sector 6 & 10", pincode: "110075", eta: "11 Mins" },
      { name: "Dwarka Sector 12 & 21", pincode: "110078", eta: "12 Mins" },
      { name: "Punjabi Bagh & Rajouri Garden", pincode: "110026", eta: "13 Mins" },
      { name: "Janakpuri & Tilak Nagar", pincode: "110058", eta: "12 Mins" },
      { name: "Mayur Vihar (Phase 1, 2, 3)", pincode: "110091", eta: "10 Mins" },
      { name: "Preet Vihar & Laxmi Nagar", pincode: "110092", eta: "11 Mins" },
      { name: "Vasundhara Enclave & IP Extension", pincode: "110096", eta: "10 Mins" },
    ],
  },
  {
    id: "gurugram",
    zone: "Gurugram (Gurgaon)",
    status: "100% Operational",
    areas: "DLF Phase 1–5, Cyber City, Golf Course Road, Sohna Road, Nirvana Country, South City",
    avgPickup: "10 – 14 Mins",
    hubs: "38 Active Hubs",
    captains: "95+ Captains",
    color: "border-emerald-200 bg-emerald-50/40",
    sectors: [
      { name: "DLF Phase 1 & 2 (MG Road)", pincode: "122002", eta: "9 Mins" },
      { name: "DLF Phase 3 & Cyber Hub IT Zone", pincode: "122002", eta: "8 Mins" },
      { name: "DLF Phase 4 & 5 (Galleria Market)", pincode: "122009", eta: "9 Mins" },
      { name: "Sector 42 & 43 (One Horizon)", pincode: "122002", eta: "10 Mins" },
      { name: "Sector 53, 54 & 56 (Golf Course)", pincode: "122011", eta: "11 Mins" },
      { name: "Sector 57 & 65 (Golf Course Ext)", pincode: "122018", eta: "12 Mins" },
      { name: "Sector 47, 48 & 49 (Sohna Road)", pincode: "122018", eta: "11 Mins" },
      { name: "Nirvana Country & Sector 50", pincode: "122018", eta: "10 Mins" },
      { name: "South City 1 & 2 (Uniworld City)", pincode: "122001", eta: "12 Mins" },
    ],
  },
  {
    id: "bengaluru",
    zone: "Bengaluru (Bangalore)",
    status: "100% Operational",
    areas: "Koramangala, Indiranagar, HSR Layout, Whitefield, Electronic City, Bellandur, Sarjapur Road",
    avgPickup: "11 – 14 Mins",
    hubs: "42 Active Hubs",
    captains: "110+ Captains",
    color: "border-emerald-200 bg-emerald-50/40",
    sectors: [
      { name: "Koramangala (Blocks 1 to 8)", pincode: "560034", eta: "9 Mins" },
      { name: "Indiranagar (100ft / CMH Road)", pincode: "560038", eta: "8 Mins" },
      { name: "HSR Layout (Sectors 1 to 7)", pincode: "560102", eta: "9 Mins" },
      { name: "Bellandur & Green Glen Layout", pincode: "560103", eta: "11 Mins" },
      { name: "Whitefield (ITPL / EPIP / Prestige)", pincode: "560066", eta: "12 Mins" },
      { name: "Electronic City (Phase 1 & 2)", pincode: "560100", eta: "13 Mins" },
      { name: "Sarjapur Road (Rainbow Drive)", pincode: "560035", eta: "11 Mins" },
      { name: "Marathahalli & Kadubeesanahalli", pincode: "560037", eta: "10 Mins" },
      { name: "Jayanagar & JP Nagar (Phases 1-7)", pincode: "560078", eta: "11 Mins" },
      { name: "BTM Layout (1st & 2nd Stage)", pincode: "560076", eta: "10 Mins" },
    ],
  },
  {
    id: "mumbai",
    zone: "Mumbai (MMR)",
    status: "100% Operational",
    areas: "Bandra West, Juhu, Andheri West, Powai Hiranandani, BKC Financial Center, Lower Parel, Worli",
    avgPickup: "12 – 16 Mins",
    hubs: "36 Active Hubs",
    captains: "90+ Captains",
    color: "border-emerald-200 bg-emerald-50/40",
    sectors: [
      { name: "Bandra West (Pali Hill / Carter Road)", pincode: "400050", eta: "10 Mins" },
      { name: "Juhu & Khar West (Tara Road)", pincode: "400049", eta: "11 Mins" },
      { name: "Andheri West (Lokhandwala / Oshiwara)", pincode: "400053", eta: "10 Mins" },
      { name: "Andheri East (MIDC / Marol)", pincode: "400093", eta: "11 Mins" },
      { name: "Powai (Hiranandani Gardens)", pincode: "400076", eta: "11 Mins" },
      { name: "BKC (Bandra Kurla Complex)", pincode: "400051", eta: "9 Mins" },
      { name: "Lower Parel & Worli (Phoenix)", pincode: "400013", eta: "10 Mins" },
      { name: "Goregaon & Malad West (Mindspace)", pincode: "400064", eta: "12 Mins" },
      { name: "Dadar & Prabhadevi (Shivaji Park)", pincode: "400028", eta: "11 Mins" },
    ],
  },
];

export function EcosystemPage({
  onNavigate,
  onOpenModal,
}: {
  onNavigate: (page: PageType) => void;
  onOpenModal: (type: ModalType) => void;
}) {
  const [activePanelTab, setActivePanelTab] = useState<"customer" | "partner" | "captain">("customer");
  const [expandedZoneIds, setExpandedZoneIds] = useState<string[]>(["noida"]);

  const currentPanel = PANELS_DATA.find((p) => p.id === activePanelTab) || PANELS_DATA[0];

  const toggleZone = (zoneId: string) => {
    if (expandedZoneIds.includes(zoneId)) {
      setExpandedZoneIds(expandedZoneIds.filter((id) => id !== zoneId));
    } else {
      setExpandedZoneIds([...expandedZoneIds, zoneId]);
    }
  };

  const handlePanelAction = (panelId: string) => {
    if (panelId === "customer") {
      window.open("https://play.google.com/store/apps", "_blank");
      onOpenModal("download_app");
    } else {
      onOpenModal("partner");
    }
  };

  return (
    <div className="pt-24 sm:pt-32 pb-24 space-y-24 bg-white text-gray-900">
      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-widest uppercase mb-4 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-live-dot" />
          <span>QUICKPRESS 3-PANEL ECOSYSTEM • LIVE IN NOIDA & NCR</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-gray-950 leading-tight max-w-4xl mx-auto">
          One Connected Engine. <br />
          <span style={{ color: GREEN }}>Three Specialized Panels.</span>
        </h1>
        <p className="text-gray-600 text-base sm:text-xl max-w-3xl mx-auto mt-6 leading-relaxed">
          QuickPress brings together <strong>QuickPress (Customer)</strong>, <strong>QuickPress Partner</strong>, and <strong>QuickPress Captain</strong> in a unified, synchronized platform.
        </p>

        {/* 3 Authentic Panels Switcher Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-10">
          {PANELS_DATA.map((p) => {
            const isSelected = activePanelTab === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePanelTab(p.id as any)}
                className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 text-left ${
                  isSelected
                    ? "bg-white border-gray-900 shadow-2xl scale-105 ring-4 ring-emerald-500/10"
                    : "bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300"
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl p-1.5 flex items-center justify-center shrink-0 border border-gray-100 shadow-xs ${p.logoBg}`}>
                  <img src={p.logoImg} alt={p.name} className="w-full h-full object-contain rounded-xl" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                    {p.badge}
                  </span>
                  <span className="text-base font-black text-gray-950 block">
                    {p.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Active Panel Interactive Showcase ───────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-2xl p-8 sm:p-14 animate-fade-in grid lg:grid-cols-12 gap-10 items-center">
          {/* Left Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-2xl p-2 flex items-center justify-center shrink-0 border border-gray-200 shadow-md ${currentPanel.logoBg}`}>
                <img src={currentPanel.logoImg} alt={currentPanel.name} className="w-full h-full object-contain rounded-xl" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-800">
                  {currentPanel.badgeLabel}
                </span>
                <h3 className="text-2xl sm:text-4xl font-black text-gray-950 mt-0.5">
                  {currentPanel.name}
                </h3>
              </div>
            </div>

            <p className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
              {currentPanel.tagline}
            </p>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {currentPanel.description}
            </p>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                Core Capabilities & Workflow:
              </span>
              <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700">
                {currentPanel.capabilities.map((cap) => (
                  <li key={cap} className="flex items-start gap-2.5">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5"
                      style={{ background: currentPanel.accentColor }}
                    >
                      <IconCheck className="w-3 h-3" />
                    </span>
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={() => handlePanelAction(currentPanel.id)}
                className="px-8 py-3.5 rounded-full font-black text-white text-xs sm:text-sm shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
                style={{ background: currentPanel.accentColor }}
              >
                <span>{currentPanel.mockPreview.actionText} →</span>
              </button>
            </div>
          </div>

          {/* Right Simulated Panel Live Console */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm bg-gray-950 text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-800 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-live-dot" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    Live Panel Telemetry
                  </span>
                </div>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300">
                  Sub-100ms Sync
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="w-12 h-12 rounded-xl p-1 bg-white flex items-center justify-center">
                  <img src={currentPanel.logoImg} alt={currentPanel.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                    {currentPanel.mockPreview.screenTitle}
                  </span>
                  <h4 className="text-base font-black text-white">
                    {currentPanel.mockPreview.orderId}
                  </h4>
                  <p className="text-xs text-emerald-200/90 font-medium">
                    {currentPanel.mockPreview.status}
                  </p>
                </div>
                <div className="pt-2 border-t border-white/10 text-[11px] text-gray-400 font-semibold">
                  {currentPanel.mockPreview.items}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-between text-xs">
                <span className="text-emerald-300 font-bold">Network State:</span>
                <span className="text-white font-black flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  100% Operational
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── "WE ARE LIVE!" Original Cards Grid with Tap to Open Sectors List ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-live-dot" />
            Live Network Status
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-950 mt-3">
            We Are Live Across Your City
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mt-2">
            Tap on any city card below to open its complete list of active sectors, average pickup ETAs, and verified hubs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {LIVE_COVERAGE_ZONES.map((zone) => {
            const isExpanded = expandedZoneIds.includes(zone.id);
            return (
              <div
                key={zone.id}
                className={`rounded-3xl p-7 border transition-all duration-300 shadow-xs hover:shadow-xl bg-white ${zone.color} flex flex-col justify-between`}
              >
                <div>
                  {/* Top Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <IconMapPin className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white border border-emerald-200 text-emerald-800 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-live-dot" />
                      {zone.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-gray-950 mb-1">{zone.zone}</h3>
                  <p className="text-xs font-semibold text-gray-600 mb-4">{zone.areas}</p>

                  <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Avg Pickup ETA</span>
                      <span className="text-sm font-black text-emerald-700">{zone.avgPickup}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Active Fleet</span>
                      <span className="text-sm font-black text-gray-900">{zone.hubs}</span>
                    </div>
                  </div>
                </div>

                {/* Tap to Open Sectors List Accordion Trigger */}
                <button
                  onClick={() => toggleZone(zone.id)}
                  className="mt-5 pt-3 border-t border-gray-200/80 w-full flex items-center justify-between text-xs font-black text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {isExpanded ? "Hide Live Sectors List" : `Tap to view ${zone.sectors.length} Live Sectors`}
                  </span>
                  <IconChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Expanded Sectors List */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 animate-fade-in">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      Live Active Sectors ({zone.sectors.length}):
                    </p>
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {zone.sectors.map((sec) => (
                        <div
                          key={sec.name}
                          className="p-2.5 rounded-xl bg-white border border-gray-200/80 flex items-center justify-between text-xs shadow-2xs hover:border-emerald-500 transition-colors"
                        >
                          <div>
                            <span className="font-bold text-gray-950 block text-[11px]">
                              {sec.name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              Pin: {sec.pincode}
                            </span>
                          </div>
                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shrink-0">
                            {sec.eta}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Simulated Telemetry Dashboard Strip ───────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { value: "1,248", label: "Active Orders in Transit", sub: "Live geospatial tracking" },
            { value: "11.4 Min", label: "Avg Partner Match Latency", sub: "Dynamic automated routing" },
            { value: "99.8%", label: "Route Optimization Adherence", sub: "Zero lost packages" },
            { value: "100%", label: "System Operational Health", sub: "All regional hubs active" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-xs text-center"
            >
              <p className="text-3xl sm:text-4xl font-black" style={{ color: GREEN }}>
                {stat.value}
              </p>
              <p className="text-xs font-bold text-gray-900 mt-2">{stat.label}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Action Banner ────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 rounded-3xl p-8 sm:p-14 border border-emerald-200 shadow-md space-y-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-live-dot" />
            Connect With The Network
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-950">
            Experience the Live QuickPress Platform Today.
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Download our consumer mobile app for doorstep pickup, join our delivery fleet as a Captain, or apply to launch your exclusive franchise hub.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => {
                window.open("https://play.google.com/store/apps", "_blank");
                onOpenModal("download_app");
              }}
              className="px-8 py-3.5 rounded-full font-bold text-white text-sm shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
              style={{ background: GREEN }}
            >
              <IconSmartphone className="w-4 h-4" />
              <span>Get QuickPress App →</span>
            </button>
            <button
              onClick={() => onNavigate("partners")}
              className="px-8 py-3.5 rounded-full font-bold text-gray-950 text-sm shadow-md hover:scale-105 transition-all cursor-pointer"
              style={{ background: YELLOW }}
            >
              Launch a Partner Hub →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
