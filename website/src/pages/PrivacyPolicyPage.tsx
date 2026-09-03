import React from "react";
import { PageType, ModalType } from "@/types";

export function PrivacyPolicyPage({
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
            <span>Official Legal Document</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Effective: August 2026</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-emerald-100/80 text-sm sm:text-base leading-relaxed max-w-2xl">
            This Privacy Policy describes how{" "}
            <strong className="text-white">QUICKPRESS TECHNOLOGIES & SERVICES PRIVATE LIMITED</strong>{" "}
            collects, uses, protects, and discloses your information across the QuickPress Customer App, Partner Store App, Rider/Captain App, and our official website.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-10 text-sm text-gray-700 leading-relaxed">
          {/* Quick Notice Box */}
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-950">
            <h4 className="font-bold text-base text-emerald-900 mb-1 flex items-center gap-2">
              <span>🛡️ Summary & Commitment</span>
            </h4>
            <p className="text-xs text-emerald-900/90 leading-relaxed">
              We value your trust. We collect only data necessary to pick up, wash, steam iron, and deliver your laundry safely, manage delivery fleet routes, and settle payments with stores and delivery captains. We never sell your personal information to third-party data brokers.
            </p>
          </div>

          {/* Section 1: Corporate Entity */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-950 border-b border-gray-100 pb-2">
              1. Corporate Entity & Scope
            </h2>
            <p>
              This policy applies to all services provided by <strong>QUICKPRESS TECHNOLOGIES & SERVICES PRIVATE LIMITED</strong> (“QuickPress”, “we”, “our”, or “us”), registered under the Companies Act, 2013 in India, with registered office at:
            </p>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs space-y-1">
              <p className="font-bold text-gray-900">QUICKPRESS TECHNOLOGIES & SERVICES PRIVATE LIMITED</p>
              <p>📍 Unit 406 Tower B, Bhutani Alphathum, Sector 90, Noida 201305, Uttar Pradesh, India</p>
              <p>✉️ Grievance Email: official.quickpress@gmail.com</p>
              <p>🌐 Platforms: QuickPress Customer App, QuickPress Partner App, QuickPress Captain App, quickpress.in</p>
            </div>
          </section>

          {/* Section 2: Information We Collect */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-950 border-b border-gray-100 pb-2">
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Customer Profile Data:</strong> Name, mobile phone number, email address, delivery street address, landmark, and building/flat details.
              </li>
              <li>
                <strong>Order & Transaction Information:</strong> Items selected for wash, fold, steam iron or dry clean, order notes, special fabric instructions, transaction amount, payment mode, and order timeline stamps.
              </li>
              <li>
                <strong>Partner Store Information:</strong> Business name, shop registration, store address, GSTIN, PAN, bank account number, and IFSC for weekly payouts and Section 194-O TCS tax reporting.
              </li>
              <li>
                <strong>Rider / Captain Fleet Information:</strong> Full name, verified mobile number, driving license, vehicle registration (RC), live GPS location, bank/UPI details for payout disbursement, and emergency contact details.
              </li>
              <li>
                <strong>Device & Technical Identifiers:</strong> Device model, OS version, push notification tokens (Firebase Cloud Messaging), and anonymized crash analytics.
              </li>
            </ul>
          </section>

          {/* Section 3: Location Data & Google Play Disclosures */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-950 border-b border-gray-100 pb-2">
              3. Location Information (Foreground & Background GPS)
            </h2>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2 text-xs">
              <p className="font-bold text-amber-900 text-sm">
                📍 Prominent Location Disclosure (Google Play Store Compliance)
              </p>
              <p>
                <strong>For Delivery Captains (Riders):</strong> The QuickPress Captain App collects precise real-time location data (both foreground and background while the app is minimized or running in the background) to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Assign nearby customer pickup and store handover orders automatically.</li>
                <li>Calculate accurate travel distances for trip fare payouts (₹8/km distance matrix).</li>
                <li>Display live delivery progress to customers awaiting their clean laundry.</li>
              </ul>
              <p className="text-[11px] text-amber-900/80">
                Background location tracking is active ONLY when the Captain is marked "ON DUTY" in the app and ceases immediately when Duty is turned "OFF".
              </p>
              <p>
                <strong>For Customers:</strong> We collect foreground location with your permission only when selecting your pickup address or viewing live driver arrival on the map.
              </p>
            </div>
          </section>

          {/* Section 4: Payments & Security */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-950 border-b border-gray-100 pb-2">
              4. Payment Security & Financial Data
            </h2>
            <p>
              All online payments (UPI, Credit/Debit Cards, Net Banking, and Wallets) are processed through RBI-authorized payment aggregators (including Razorpay Software Private Limited) using 256-bit bank-grade encryption (TLS 1.3).
            </p>
            <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
              🔒 <strong>PCI-DSS Notice:</strong> QuickPress does NOT store, capture, or have access to your full credit/debit card numbers, CVV, or bank ATM PINs on our servers.
            </p>
          </section>

          {/* Section 5: How We Use Your Data */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-950 border-b border-gray-100 pb-2">
              5. How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>To schedule, process, clean, and deliver laundry orders door-to-door.</li>
              <li>To verify pickups and handovers securely using single-use 4-digit OTPs.</li>
              <li>To disburse automated earnings to laundry partner stores and delivery riders.</li>
              <li>To send order notifications (Order Confirmed, Clothes Picked Up, Washing Started, Out for Delivery).</li>
              <li>To prevent fraud, fake accounts, duplicate referral abuse, and security threats.</li>
            </ul>
          </section>

          {/* Section 6: Data Sharing & Disclosures */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-950 border-b border-gray-100 pb-2">
              6. Data Sharing & Third Parties
            </h2>
            <p>We share information strictly on a need-to-know basis:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>
                <strong>Assigned Laundry Partner:</strong> Receives customer order details and laundry items to properly clean and steam iron clothes.
              </li>
              <li>
                <strong>Assigned Delivery Captain:</strong> Receives customer delivery address and masked phone contact to execute doorstep collection and handover.
              </li>
              <li>
                <strong>Regulatory & Legal Authorities:</strong> If required under Indian Law, court order, or lawful summons under the Information Technology Act, 2000.
              </li>
            </ul>
          </section>

          {/* Section 7: Account & Data Deletion */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-950 border-b border-gray-100 pb-2">
              7. Your Rights: Account & Data Deletion
            </h2>
            <p>
              In accordance with Google Play User Data policies and Indian data protection guidelines, users hold complete control over their personal information:
            </p>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
              <p className="font-bold text-gray-900">How to request permanent Account & Data Deletion:</p>
              <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                <li>Within any QuickPress App: Navigate to <strong>Profile ➡️ Settings ➡️ Delete Account</strong>.</li>
                <li>
                  Via Email: Send an email from your registered email address to{" "}
                  <a href="mailto:official.quickpress@gmail.com" className="text-emerald-700 font-bold underline">
                    official.quickpress@gmail.com
                  </a>{" "}
                  with the subject <em>"Request for Account Deletion"</em> including your registered mobile number.
                </li>
              </ol>
              <p className="text-[11px] text-gray-500 pt-1">
                Upon verification, all personal identifiers, addresses, and device tokens are permanently wiped within 7 business days, retaining only statutory tax invoices as mandated under the GST Act.
              </p>
            </div>
          </section>

          {/* Section 8: Grievance Officer */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-950 border-b border-gray-100 pb-2">
              8. Grievance Officer & Contact
            </h2>
            <p>
              If you have any questions, concerns, or grievances regarding this Privacy Policy or our data practices, please contact our designated Grievance Officer:
            </p>
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs space-y-1">
              <p className="font-bold text-gray-950">Grievance Officer — Privacy & Legal Compliance</p>
              <p className="text-gray-700">QUICKPRESS TECHNOLOGIES & SERVICES PRIVATE LIMITED</p>
              <p className="text-gray-700">Unit 406 Tower B, Bhutani Alphathum, Sector 90, Noida 201305, Uttar Pradesh, India</p>
              <p className="text-emerald-800 font-bold">Email: official.quickpress@gmail.com</p>
              <p className="text-gray-500 text-[11px]">Response Time: Within 24-48 business hours</p>
            </div>
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
          <div className="flex gap-3">
            <button
              onClick={() => onNavigate("terms")}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={() => onOpenModal("contact")}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
