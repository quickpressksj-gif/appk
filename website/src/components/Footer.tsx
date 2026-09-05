import React from "react";
import { PageType, ModalType } from "@/types";
import { Logo } from "./Navbar";

export function Footer({
  onNavigate,
  onOpenModal,
}: {
  onNavigate: (page: PageType) => void;
  onOpenModal: (type: ModalType) => void;
}) {
  return (
    <footer className="pt-16 pb-12 bg-[#07160D] text-white border-t border-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          {/* Brand & Corporate Info */}
          <div className="col-span-2 md:col-span-2 space-y-4 pr-0 md:pr-6">
            <Logo size="md" dark={true} onClick={() => onNavigate("home")} />
            <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed max-w-sm">
              <strong>QUICKPRESS TECHNOLOGIES & SERVICES PRIVATE LIMITED</strong><br />
              Building connected on-demand services and smart delivery infrastructure. Built by friends, driven by ambition.
            </p>
            <div className="text-xs text-emerald-300/80 space-y-1 pt-1">
              <p className="text-[11px] leading-relaxed">
                📍 <strong>Registered Office:</strong> Unit 406 Tower B, Bhutani Alphathum, Sector 90, Noida 201305, Uttar Pradesh, India
              </p>
              <p className="text-[11px]">
                ✉️ <strong>Official Email:</strong>{" "}
                <a href="mailto:official.quickpress@gmail.com" className="text-emerald-300 underline hover:text-white">
                  official.quickpress@gmail.com
                </a>
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              {[
                { name: "X", label: "𝕏" },
                { name: "LinkedIn", label: "in" },
                { name: "Instagram", label: "ig" },
                { name: "GitHub", label: "gh" },
              ].map((s) => (
                <a
                  key={s.name}
                  href="#"
                  className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-xs font-bold text-emerald-300 hover:bg-emerald-800 hover:text-white transition-all"
                  aria-label={s.name}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Column 1: Company */}
          <div>
            <h5 className="text-xs font-black tracking-wider uppercase text-emerald-400 mb-4">
              Company
            </h5>
            <ul className="space-y-2.5 text-xs text-emerald-100/70">
              <li>
                <button
                  onClick={() => onNavigate("about")}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  About
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("services")}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Services
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("how-it-works")}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("about")}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Careers
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenModal("contact")}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Legal */}
          <div>
            <h5 className="text-xs font-black tracking-wider uppercase text-emerald-400 mb-4">
              Legal
            </h5>
            <ul className="space-y-2.5 text-xs text-emerald-100/70">
              <li>
                <button
                  onClick={() => onNavigate("privacy")}
                  className="hover:text-white transition-colors text-left cursor-pointer text-emerald-300 font-semibold"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("terms")}
                  className="hover:text-white transition-colors text-left cursor-pointer text-emerald-300 font-semibold"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("terms")}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Cancellation & Refund Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("terms")}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Pickup & Delivery Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("privacy")}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Cookie Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("privacy")}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Grievance Redressal
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h5 className="text-xs font-black tracking-wider uppercase text-emerald-400 mb-4">
              Support
            </h5>
            <ul className="space-y-2.5 text-xs text-emerald-100/70">
              <li>
                <button
                  onClick={() => onOpenModal("contact")}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Help Center
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenModal("contact")}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Contact Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("privacy")}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Privacy & Data Help
                </button>
              </li>
              <li>
                <a href="mailto:official.quickpress@gmail.com" className="hover:text-white transition-colors text-left">
                  official.quickpress@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Direct App Portals Quick Access Bar */}
        <div className="border-t border-emerald-950 py-4 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-300/80">
          <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">Direct App Portals:</span>
          <div className="flex flex-wrap gap-4 text-xs font-medium">
            <a href="https://appk-mu.vercel.app" target="_blank" rel="noreferrer" className="hover:text-white underline">
              👤 Customer Web App
            </a>
            <span className="text-emerald-800">•</span>
            <a href="https://quickpress-partner.vercel.app" target="_blank" rel="noreferrer" className="hover:text-white underline">
              🏪 Partner Store Portal
            </a>
            <span className="text-emerald-800">•</span>
            <a href="https://quickpress-rider.vercel.app" target="_blank" rel="noreferrer" className="hover:text-white underline">
              🛵 Captain (Rider) Portal
            </a>
            <span className="text-emerald-800">•</span>
            <a href="https://quickpress-admin.vercel.app" target="_blank" rel="noreferrer" className="hover:text-white underline">
              🛡️ Admin Control Panel
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-emerald-900/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-400/60">
          <p>© 2026 QUICKPRESS TECHNOLOGIES & SERVICES PRIVATE LIMITED. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => onNavigate("privacy")} className="hover:text-emerald-200 cursor-pointer">
              Privacy Policy
            </button>
            <span>•</span>
            <button onClick={() => onNavigate("terms")} className="hover:text-emerald-200 cursor-pointer">
              Terms
            </button>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-live-dot" />
              <span className="text-emerald-300 font-medium">All 3 Panels Connected</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
