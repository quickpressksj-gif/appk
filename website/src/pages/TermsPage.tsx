import React from "react";
import { PageType, ModalType } from "@/types";

export function TermsPage({
  onNavigate,
  onOpenModal,
}: {
  onNavigate: (page: PageType) => void;
  onOpenModal: (type: ModalType) => void;
}) {
  return (
    <div className="bg-white text-gray-900 min-h-screen pt-24 pb-20">
      {/* Header Banner */}
      <div className="bg-[#07160D] text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-emerald-950">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
            <span>Customer & Partner Agreement</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Effective: August 2026</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-emerald-100/80 text-sm sm:text-base leading-relaxed max-w-2xl">
            Please read these terms carefully before booking on-demand laundry, partnering your store, or joining the delivery fleet with{" "}
            <strong className="text-white">QUICKPRESS TECHNOLOGIES & SERVICES PRIVATE LIMITED</strong>.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-10 text-sm text-gray-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-950 border-b border-gray-100 pb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or using the QuickPress website, customer application, partner application, or delivery captain application, you agree to be bound by these Terms of Service, along with our Privacy Policy and Cancellation & Refund Policy.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-950 border-b border-gray-100 pb-2">
              2. Service Process & Garment Care
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Doorstep Pickup & Count Verification:</strong> Customers must verify their garment count with the assigned delivery captain at the doorstep. The single-use 4-digit Pickup OTP confirms successful handover.
              </li>
              <li>
                <strong>Fabric Care Labels:</strong> While our partnered laundry facilities follow strict fabric care procedures, customers must declare delicate or color-bleeding fabrics in the order notes.
              </li>
              <li>
                <strong>Valuables in Pockets:</strong> Customers are requested to thoroughly check pockets. QuickPress and partner facilities are not responsible for cash, jewelry, or electronics left inside garment pockets.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-950 border-b border-gray-100 pb-2">
              3. Pricing, Cancellation & Refund
            </h2>
            <p>
              Orders can be canceled free of charge before a delivery captain is dispatched for pickup. Once collected, cancellations incur a nominal handling and pickup transit fee. In case of garment damage proven to occur during processing, compensation is provided up to 10x the service charge of the affected item in accordance with our Refund & Compensation Policy.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-950 border-b border-gray-100 pb-2">
              4. Partner Store & Fleet Compliance
            </h2>
            <p>
              Partner laundry stores must maintain minimum hygiene, water filtration, and quality standards. Delivery captains operate as independent logistics partners adhering to road safety regulations and platform conduct codes.
            </p>
          </section>
        </div>

        {/* Bottom Navigation Back */}
        <div className="mt-14 pt-8 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => onNavigate("home")}
            className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black transition-all cursor-pointer"
          >
            ← Back to Home
          </button>
          <button
            onClick={() => onNavigate("privacy")}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
          >
            Read Privacy Policy →
          </button>
        </div>
      </div>
    </div>
  );
}
