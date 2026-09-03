import React, { useState } from "react";
import { PageType, ModalType, JobPosition } from "@/types";
import {
  IconCheck,
  IconBolt,
  IconShield,
  IconSparkle,
  IconGlobe,
  IconArrowRight,
} from "@/components/Icons";

const GREEN = "#1A7A3C";

const OPEN_POSITIONS: JobPosition[] = [
  {
    id: "eng-1",
    title: "Senior Mobile Engineer (React Native)",
    dept: "Engineering",
    type: "Full-Time",
    location: "Remote / Noida HQ",
    salary: "₹18 – ₹26 LPA + ESOPs",
    description: "Lead the development of our consumer mobile and partner dispatch tablet applications, delivering real-time map telemetry and effortless checkout.",
    responsibilities: [
      "Architect and scale our React Native apps across iOS and Android.",
      "Integrate real-time WebSocket telemetry, push notifications, and offline-first dispatch queues.",
      "Collaborate closely with product designers and backend engineers to iterate rapidly.",
    ],
    requirements: [
      "4+ years of professional React Native / TypeScript experience.",
      "Deep understanding of mobile state management, native bridges, and performance profiling.",
      "Experience shipping high-volume consumer or logistics apps.",
    ],
  },
  {
    id: "eng-2",
    title: "Staff Backend & Routing Systems Engineer",
    dept: "Engineering",
    type: "Full-Time",
    location: "Noida Sector 90 / Hybrid",
    salary: "₹22 – ₹32 LPA + ESOPs",
    description: "Design algorithms that match thousands of daily orders with optimal partner facilities and multi-stop courier routes across NCR.",
    responsibilities: [
      "Build distributed, fault-tolerant dispatch microservices using Go, Node.js, and Redis.",
      "Optimize clustering and vehicle routing algorithms to minimize courier idle time.",
      "Maintain 99.99% uptime for mission-critical order pipelines.",
    ],
    requirements: [
      "5+ years building distributed backend systems.",
      "Strong background in geospatial indices (PostGIS, H3) and routing heuristics.",
      "Experience with high-throughput message streaming.",
    ],
  },
  {
    id: "des-1",
    title: "Lead Product Designer (UI/UX)",
    dept: "Product & Design",
    type: "Full-Time",
    location: "Remote / Noida HQ",
    salary: "₹15 – ₹22 LPA + ESOPs",
    description: "Own the end-to-end design system across our consumer booking interface, partner tablet OS, and courier mobile tools.",
    responsibilities: [
      "Design intuitive, agency-grade digital experiences across web and mobile platforms.",
      "Maintain and evolve the QuickPress Figma design system with robust component variants.",
      "Conduct user research and usability testing with consumers and merchant partners.",
    ],
    requirements: [
      "4+ years of product design experience for modern SaaS or marketplace apps.",
      "World-class visual design, micro-interaction craftsmanship, and typography sensibilities.",
      "Strong portfolio demonstrating high-fidelity Figma and interactive prototyping skills.",
    ],
  },
  {
    id: "ops-1",
    title: "City Operations & Dispatch Lead",
    dept: "Operations",
    type: "Full-Time",
    location: "Noida / Delhi-NCR",
    salary: "₹10 – ₹15 LPA + Performance Bonus",
    description: "Oversee daily fulfillment SLAs, courier fleet coordination, and partner hub operational metrics across the NCR territory.",
    responsibilities: [
      "Monitor live order telemetry, resolving exceptions and dispatch bottlenecks in real-time.",
      "Onboard, train, and maintain relationships with certified commercial partner facilities.",
      "Analyze fulfillment KPIs (turnaround latency, quality scores) to drive operational excellence.",
    ],
    requirements: [
      "3+ years in logistics, marketplace operations, or last-mile fleet dispatch.",
      "Data-driven mindset with proficiency in SQL and operational spreadsheets.",
      "High ownership and crisis resolution skills.",
    ],
  },
  {
    id: "part-1",
    title: "Partner Success Specialist",
    dept: "Partner Network",
    type: "Full-Time",
    location: "Noida / Delhi-NCR",
    salary: "₹8 – ₹12 LPA + Incentive",
    description: "Act as the trusted advisor for our network of laundromat owners, courier fleet operators, and specialty craft artisans.",
    responsibilities: [
      "Drive partner retention, capacity growth, and satisfaction across regional partner accounts.",
      "Conduct regular performance reviews and provide operational coaching on our tablet software.",
      "Serve as the voice of our partners to product and engineering teams.",
    ],
    requirements: [
      "2+ years in merchant success, account management, or B2B customer support.",
      "Outstanding communication and empathetic relationship-building abilities.",
    ],
  },
  {
    id: "growth-1",
    title: "Growth Marketing & Lifecycle Lead",
    dept: "Growth",
    type: "Full-Time",
    location: "Remote / Noida HQ",
    salary: "₹12 – ₹18 LPA + Performance Bonus",
    description: "Drive consumer acquisition and repeat subscription frequency across WhatsApp, SMS, push, and local referral campaigns.",
    responsibilities: [
      "Build automated lifecycle journeys (welcome onboarding, repeat booking triggers, win-backs).",
      "Analyze cohort retention and experiment with localized promotional campaigns.",
    ],
    requirements: [
      "3+ years in lifecycle marketing or growth for direct-to-consumer mobile apps.",
      "Hands-on experience with customer data and marketing automation platforms.",
    ],
  },
];

const PERKS = [
  { title: "Competitive Salary & ESOPs", desc: "Top-market base compensation plus meaningful equity ownership in a fast-growing startup.", icon: IconSparkle },
  { title: "Comprehensive Health Cover", desc: "100% employer-covered premium health and medical insurance for you and your family.", icon: IconShield },
  { title: "Remote-First Flexibility", desc: "Work from wherever you are most productive with a ₹50,000 home office and gear budget.", icon: IconGlobe },
  { title: "Learning & Development", desc: "₹25,000 annual education stipend for courses, workshops, and books.", icon: IconBolt },
];

export function CareersPage({
  onNavigate,
  onOpenModal,
  onApplyJob,
}: {
  onNavigate: (page: PageType) => void;
  onOpenModal: (type: ModalType) => void;
  onApplyJob: (job: JobPosition) => void;
}) {
  const [selectedDept, setSelectedDept] = useState("All");

  const depts = ["All", "Engineering", "Product & Design", "Operations", "Partner Network", "Growth"];

  const filteredJobs =
    selectedDept === "All"
      ? OPEN_POSITIONS
      : OPEN_POSITIONS.filter((j) => j.dept === selectedDept);

  return (
    <div className="pt-24 sm:pt-32 pb-24 space-y-24 bg-white">
      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-widest uppercase mb-4">
          Careers at QuickPress
        </span>
        <h1 className="text-4xl sm:text-6xl font-black text-gray-950 leading-tight max-w-4xl mx-auto">
          Build the future of <br />
          <span style={{ color: GREEN }}>connected urban logistics.</span>
        </h1>
        <p className="text-gray-600 text-base sm:text-xl max-w-2xl mx-auto mt-6 leading-relaxed">
          Join our founding and engineering teams in Noida & remote. We are building technology that transforms daily chores into seamless digital services.
        </p>

        {/* Department Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-10">
          {depts.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDept(d)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedDept === d
                  ? "bg-emerald-800 text-white shadow-md shadow-emerald-900/10 scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Open Roles List ──────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 group"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold">
                    {job.dept}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold">
                    {job.location}
                  </span>
                  <span className="text-gray-500 font-semibold">{job.salary}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-gray-900 group-hover:text-emerald-800 transition-colors">
                  {job.title}
                </h3>

                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                  {job.description}
                </p>
              </div>

              <div className="shrink-0">
                <button
                  onClick={() => onApplyJob(job)}
                  className="w-full md:w-auto px-7 py-3.5 rounded-full font-bold text-white text-xs sm:text-sm shadow-md hover:scale-105 transition-all cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: GREEN }}
                >
                  <span>Apply Now</span>
                  <IconArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Culture & Perks ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            Perks & Benefits
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-950 mt-3">
            How we take care of our team
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PERKS.map((perk) => (
            <div
              key={perk.title}
              className="bg-gray-50 rounded-3xl p-8 border border-gray-200/80 shadow-xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-white text-emerald-800 flex items-center justify-center shadow-xs mb-6">
                <perk.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{perk.title}</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{perk.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
