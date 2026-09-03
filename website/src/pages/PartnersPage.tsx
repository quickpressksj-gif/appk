import React, { useState } from "react";
import { PageType, ModalType, PartnerCaseStudy } from "@/types";
import {
  IconCheck,
  IconHandshake,
  IconShield,
  IconBolt,
  IconAward,
  IconArrowRight,
  IconStar,
  IconBriefcase,
  IconCpu,
  IconVan,
  IconSparkle,
} from "@/components/Icons";

const GREEN = "#1A7A3C";
const YELLOW = "#F59E0B";

const FRANCHISE_MODELS = [
  {
    id: "15lakh",
    badge: "Most Popular FOFO Model",
    title: "QuickPress Express Hub Franchise",
    investment: "₹15 Lakhs",
    investmentNum: 1500000,
    areaRequired: "250 – 450 sq.ft.",
    locationType: "High-density residential society / retail high-street",
    targetBreakEven: "9 to 14 Months",
    monthlyRevenue: "₹2,50,000 – ₹4,50,000 / mo",
    netProfitMargin: "35% – 42% Net Margin",
    monthlyNetProfit: "₹90,000 – ₹1,65,000 / mo",
    description:
      "A high-footfall collection, customer intake, and express garment steaming hub. Built for fast turnaround, seamless app order routing, and localized neighborhood pickups.",
    capitalAllocation: [
      { item: "Turnkey Store Interior & Signage Branding", amount: "₹4,00,000" },
      { item: "Smart POS Counter, Barcode Hardware & Tablet OS", amount: "₹1,50,000" },
      { item: "Commercial Boiler Steam Finishing Stations (2 Units)", amount: "₹3,50,000" },
      { item: "Brand Franchise License & Tech Onboarding", amount: "₹3,00,000" },
      { item: "Initial Eco-Packaging, Chemicals & Marketing Launch", amount: "₹2,00,000" },
      { item: "Working Capital Reserve", amount: "₹1,00,000" },
    ],
    inclusions: [
      "100% Demand Generation from QuickPress Consumer App",
      "Exclusive 2 km Geofenced Pincode Neighborhood Rights",
      "Turnkey Store Layout, Signboards & Interior Design Blueprint",
      "Staff Recruitment Assistance & 14-Day SOP Training",
      "QuickPress Cloud POS, Barcode Scanner & Digital Billing System",
      "Direct Logistics Route Linkage with QuickPress Fleet",
    ],
    accentColor: GREEN,
    bgHeader: "bg-emerald-900",
  },
  {
    id: "25lakh",
    badge: "Master Processing Facility",
    title: "QuickPress Master Processing Hub Franchise",
    investment: "₹25 Lakhs",
    investmentNum: 2500000,
    areaRequired: "600 – 1,200 sq.ft.",
    locationType: "Commercial / Industrial hub / Central city logistics zone",
    targetBreakEven: "12 to 18 Months",
    monthlyRevenue: "₹6,00,000 – ₹10,50,000 / mo",
    netProfitMargin: "38% – 46% Net Margin",
    monthlyNetProfit: "₹2,40,000 – ₹4,20,000 / mo",
    description:
      "A high-capacity industrial garment processing, ozone dry-cleaning, and centralized multi-rider fleet dispatch center capable of servicing 150+ orders per day across an entire municipal territory.",
    capitalAllocation: [
      { item: "Commercial Heavy-Duty Eco-Washers & Extractors (15kg+)", amount: "₹7,50,000" },
      { item: "Italian Steam Formers, Vacuum Tables & Ironing Stations", amount: "₹4,50,000" },
      { item: "Ozone Sanitization & Eco-Dry Cleaning System", amount: "₹3,00,000" },
      { item: "Facility Architecture, 3-Phase Wiring & Plumbing Fit-out", amount: "₹4,00,000" },
      { item: "Master Franchise License, Territory Lock & Software Suite", amount: "₹4,00,000" },
      { item: "Automated Garment Packing Sealer & Raw Chemicals Stock", amount: "₹2,00,000" },
    ],
    inclusions: [
      "Guaranteed High-Volume City Order Routing from Mobile App",
      "Exclusive City Territory / Multi-Pincode Protection (5 km+ radius)",
      "Automated Packing Machine & Serialized Barcode Tracking",
      "Dedicated Enterprise Account Manager & Daily Fleet Coordination",
      "Full Chemical Engineering & Eco-Detergent Supply Chain",
      "B2B Corporate Client Onboarding (Hotels, Salons, Corporates)",
    ],
    accentColor: "#D97706",
    bgHeader: "bg-[#78350F]",
  },
];

const CASE_STUDIES: PartnerCaseStudy[] = [
  {
    name: "Apex Eco Laundromat (Noida Hub)",
    business: "Commercial Laundry & Dry Cleaner",
    location: "Sector 76, Noida",
    category: "Franchise Partner",
    growth: "+185% Monthly Orders",
    monthlyRevenue: "₹3,40,000 / mo",
    quote:
      "Opening the QuickPress Express Hub solved our customer acquisition completely. The mobile app routes orders directly to our POS counter every single morning without any local ad spend.",
    duration: "Franchisee since 2024",
  },
  {
    name: "NCR Master Processing Facility",
    business: "Central Industrial Processing Hub",
    location: "Sector 62, Noida / Ghaziabad Border",
    category: "Master Processing Hub",
    growth: "+220% Capacity Utilization",
    monthlyRevenue: "₹8,20,000 / mo",
    quote:
      "The ₹25 Lakh Master Hub model allowed us to process bulk commercial linen and consumer garments simultaneously. The ROI was hit in just 13 months.",
    duration: "Franchisee since 2024",
  },
  {
    name: "Express Delivery Fleet Partner",
    business: "Independent 2-Wheeler & Van Logistics",
    location: "Noida / Greater Noida West",
    category: "Fleet Logistics Partner",
    growth: "+140% Driver Utilization",
    monthlyRevenue: "₹1,85,000 / mo",
    quote:
      "QuickPress route batching software eliminated empty return trips for our riders. Our delivery team completes 40+ scheduled pickups daily with consistent weekly payouts.",
    duration: "Partner since 2025",
  },
];

export function PartnersPage({
  onNavigate,
  onOpenModal,
}: {
  onNavigate: (page: PageType) => void;
  onOpenModal: (type: ModalType) => void;
}) {
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<"15lakh" | "25lakh">("15lakh");
  const selectedModel = FRANCHISE_MODELS.find((m) => m.id === selectedFranchiseId) || FRANCHISE_MODELS[0];

  // Partner Earnings Calculator State (in ₹)
  const [partnerType, setPartnerType] = useState<"laundromat" | "courier" | "specialist">("laundromat");
  const [dailyOrders, setDailyOrders] = useState(30);

  const avgOrderValue = partnerType === "laundromat" ? 280 : partnerType === "courier" ? 120 : 450;
  const grossMonthly = Math.round(dailyOrders * avgOrderValue * 26 * 0.85).toLocaleString("en-IN");

  return (
    <div className="pt-24 sm:pt-32 pb-24 space-y-24 bg-white">
      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-yellow-100 text-yellow-900 text-xs font-bold tracking-widest uppercase mb-4 border border-yellow-200">
          QuickPress Franchise & Partner Network
        </span>
        <h1 className="text-4xl sm:text-6xl font-black text-gray-950 leading-tight max-w-4xl mx-auto">
          Own a high-return franchise powered by <br />
          <span style={{ color: GREEN }}>automated digital demand.</span>
        </h1>
        <p className="text-gray-600 text-base sm:text-xl max-w-3xl mx-auto mt-6 leading-relaxed">
          Partner with India's fastest-growing on-demand laundry and express delivery platform. Choose between our <strong>₹15 Lakh Express Hub</strong> or <strong>₹25 Lakh Master Processing Hub</strong> franchise models.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <button
            onClick={() => onOpenModal("partner")}
            className="px-8 py-4 rounded-full font-black text-gray-950 text-sm shadow-xl hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
            style={{ background: YELLOW }}
          >
            <IconBriefcase className="w-4 h-4" />
            <span>Apply for Franchise Ownership →</span>
          </button>
          <a
            href="#franchise-models"
            className="px-7 py-4 rounded-full font-bold text-gray-800 text-sm bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer"
          >
            Compare ₹15L & ₹25L Models
          </a>
        </div>
      </section>

      {/* ─── Franchise Models Showcase (₹15 Lakh vs ₹25 Lakh) ──────────────────── */}
      <section id="franchise-models" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            Franchise Models
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-950 mt-3">
            Choose Your Investment Model
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mt-2">
            Turnkey operational setups with complete tech, machinery, training, and customer order pipeline.
          </p>

          {/* Model Switcher Tabs */}
          <div className="flex justify-center gap-3 mt-8">
            <button
              onClick={() => setSelectedFranchiseId("15lakh")}
              className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                selectedFranchiseId === "15lakh"
                  ? "bg-emerald-800 text-white shadow-lg scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <IconSparkle className="w-4 h-4 text-yellow-400" />
              <span>₹15 Lakh Express Hub Model</span>
            </button>
            <button
              onClick={() => setSelectedFranchiseId("25lakh")}
              className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                selectedFranchiseId === "25lakh"
                  ? "bg-amber-700 text-white shadow-lg scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <IconCpu className="w-4 h-4 text-yellow-300" />
              <span>₹25 Lakh Master Processing Hub</span>
            </button>
          </div>
        </div>

        {/* Selected Model Detailed View */}
        <div className="bg-white rounded-3xl border-2 border-gray-200/90 shadow-2xl overflow-hidden animate-fade-in">
          {/* Header Banner */}
          <div className={`p-8 sm:p-12 text-white ${selectedFranchiseId === "15lakh" ? "bg-gradient-to-r from-emerald-950 via-emerald-900 to-[#0A2414]" : "bg-gradient-to-r from-[#78350F] via-amber-950 to-[#451A03]"} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-yellow-400 text-gray-950 uppercase tracking-wider">
                {selectedModel.badge}
              </span>
              <h3 className="text-2xl sm:text-4xl font-black">{selectedModel.title}</h3>
              <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl leading-relaxed">
                {selectedModel.description}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center shrink-0 min-w-[220px]">
              <span className="text-[10px] uppercase font-bold text-yellow-300 block">
                Total Turnkey Investment
              </span>
              <span className="text-3xl sm:text-4xl font-black text-white block mt-0.5">
                {selectedModel.investment}
              </span>
              <span className="text-[11px] text-emerald-200 font-semibold block mt-1">
                ROI: {selectedModel.targetBreakEven}
              </span>
            </div>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 border-b border-gray-200">
            <div className="bg-white p-6 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Space Required</span>
              <span className="text-lg font-black text-gray-900 block mt-1">{selectedModel.areaRequired}</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">{selectedModel.locationType}</span>
            </div>
            <div className="bg-white p-6 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Projected Monthly Revenue</span>
              <span className="text-lg font-black text-emerald-700 block mt-1">{selectedModel.monthlyRevenue}</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">From app demand & retail walk-ins</span>
            </div>
            <div className="bg-white p-6 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Estimated Net Profit</span>
              <span className="text-lg font-black text-yellow-600 block mt-1">{selectedModel.monthlyNetProfit}</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">{selectedModel.netProfitMargin}</span>
            </div>
            <div className="bg-white p-6 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Break-even Period</span>
              <span className="text-lg font-black text-gray-900 block mt-1">{selectedModel.targetBreakEven}</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Fast payback timeline</span>
            </div>
          </div>

          {/* Capital Allocation & Franchise Inclusions Grid */}
          <div className="p-8 sm:p-12 grid lg:grid-cols-12 gap-10">
            {/* Capital Allocation Breakdown */}
            <div className="lg:col-span-6 space-y-4">
              <h4 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                Capital Investment Breakdown ({selectedModel.investment})
              </h4>
              <p className="text-xs text-gray-500">
                Transparent itemized allocation of your turnkey franchise setup budget:
              </p>
              <div className="space-y-2.5 pt-2">
                {selectedModel.capitalAllocation.map((cap) => (
                  <div
                    key={cap.item}
                    className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-gray-800">{cap.item}</span>
                    <span className="font-black text-gray-950 shrink-0">{cap.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Franchise Inclusions & QuickPress Support */}
            <div className="lg:col-span-6 space-y-4">
              <h4 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                What QuickPress Provides
              </h4>
              <p className="text-xs text-gray-500">
                End-to-end operational, technological, and supply support from Day 1:
              </p>
              <ul className="space-y-3 pt-2">
                {selectedModel.inclusions.map((inc) => (
                  <li key={inc} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      ✓
                    </span>
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>

              {/* Action Callout */}
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-black text-emerald-950 block">
                    Ready to launch your {selectedModel.investment} Franchise?
                  </span>
                  <span className="text-[11px] text-emerald-700 block">
                    Territory lock available on first-come-first-serve basis.
                  </span>
                </div>
                <button
                  onClick={() => onOpenModal("partner")}
                  className="w-full sm:w-auto px-6 py-3 rounded-full font-black text-gray-950 text-xs shadow-md hover:scale-105 transition-all cursor-pointer shrink-0"
                  style={{ background: YELLOW }}
                >
                  Apply for {selectedModel.investment} Franchise →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6-Step Franchise Launch Roadmap ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            Onboarding Journey
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-950 mt-3">
            How You Launch Your QuickPress Franchise
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mt-2">
            From initial application to grand opening in 21 to 30 days.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Application & Territory Review",
              desc: "Submit your preferred city/pincode. Our team conducts demographic and demand feasibility analysis within 48 hours.",
              icon: IconBriefcase,
            },
            {
              step: "02",
              title: "Agreement & Pincode Lock",
              desc: "Sign the franchise agreement and secure exclusive territorial rights to protect your neighborhood customer base.",
              icon: IconShield,
            },
            {
              step: "03",
              title: "Store Setup & Machine Delivery",
              desc: "QuickPress engineering team oversees interior fit-out, machine installation, plumbing, electricals, and branding.",
              icon: IconCpu,
            },
            {
              step: "04",
              title: "Staff Training & Chemical SOPs",
              desc: "Comprehensive 14-day training covering fabric chemistry, delicate pressing, POS software, and customer service.",
              icon: IconAward,
            },
            {
              step: "05",
              title: "App Integration & Route Sync",
              desc: "Your hub is connected to the QuickPress cloud engine, enabling automated dispatch routing and driver fleet sync.",
              icon: IconVan,
            },
            {
              step: "06",
              title: "Grand Launch & App Order Blitz",
              desc: "Official store opening backed by localized digital ads, neighborhood flyer drops, and guaranteed Day 1 app orders.",
              icon: IconSparkle,
            },
          ].map((road) => (
            <div
              key={road.step}
              className="bg-white rounded-3xl p-7 border border-gray-200/80 shadow-xs hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <road.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                  STEP {road.step}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{road.title}</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{road.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Interactive Partner Earnings Calculator (in ₹) ────────────────────── */}
      <section id="calculator" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-emerald-950 via-[#0A2414] to-[#06180E] text-white rounded-3xl p-8 sm:p-14 border border-emerald-800/60 grid lg:grid-cols-12 gap-10 items-center shadow-xl">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-700">
              Partner & Franchise ROI Estimator
            </span>
            <h2 className="text-3xl sm:text-4xl font-black">
              Calculate your projected monthly net revenue.
            </h2>
            <p className="text-emerald-100/80 text-sm sm:text-base leading-relaxed">
              Adjust your target daily capacity to preview monthly gross and net earnings across our dispatch ecosystem.
            </p>

            <div className="flex flex-wrap gap-2">
              {[
                { id: "laundromat", label: "Express Laundromat Hub" },
                { id: "courier", label: "Fleet Logistics Partner" },
                { id: "specialist", label: "Master Processing Hub" },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setPartnerType(type.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    partnerType === type.id
                      ? "bg-yellow-400 text-gray-950 font-black shadow-md"
                      : "bg-emerald-900/50 text-emerald-200 hover:bg-emerald-900"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 bg-[#0B2414] rounded-2xl p-6 sm:p-8 border border-emerald-800/80 space-y-6">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span>Daily Order Capacity</span>
                <span className="text-yellow-400 font-black">{dailyOrders} Orders / Day</span>
              </div>
              <input
                type="range"
                min={10}
                max={120}
                step={5}
                value={dailyOrders}
                onChange={(e) => setDailyOrders(Number(e.target.value))}
                className="w-full accent-yellow-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-emerald-400/60 mt-1">
                <span>10 / day (Part-Time)</span>
                <span>50 / day (₹15L Hub Target)</span>
                <span>120+ / day (₹25L Master Hub)</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#071B0E] border border-emerald-900/80 space-y-2">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                Estimated Monthly Net Payout
              </span>
              <p className="text-4xl font-black text-yellow-400">₹{grossMonthly}</p>
              <p className="text-xs text-emerald-200/70">
                Calculated at 26 operating days/mo with 85% average net partner payout rate.
              </p>
            </div>

            <button
              onClick={() => onOpenModal("partner")}
              className="w-full py-4 rounded-full font-black text-gray-950 text-sm shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
              style={{ background: YELLOW }}
            >
              Start Franchise Application Now →
            </button>
          </div>
        </div>
      </section>

      {/* ─── Case Studies ─────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            Real Partner Stories
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-950 mt-3">
            Proven growth from day one
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {CASE_STUDIES.map((cs) => (
            <div
              key={cs.name}
              className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
                    {cs.category}
                  </span>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <IconStar key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>

                <h3 className="text-xl font-black text-gray-900 mb-1">{cs.name}</h3>
                <p className="text-xs text-gray-400 mb-4">{cs.location} • {cs.duration}</p>

                <p className="text-xs sm:text-sm text-gray-600 italic leading-relaxed mb-6">
                  "{cs.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Growth</span>
                  <span className="text-sm font-black text-emerald-700">{cs.growth}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Monthly Vol</span>
                  <span className="text-sm font-black text-gray-900">{cs.monthlyRevenue}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
