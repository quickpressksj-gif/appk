import React, { useState, useEffect } from "react";
import { PageType, ModalType, ServiceInfo } from "@/types";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import {
  BookingModal,
  PartnerModal,
  ContactModal,
  ServiceDetailModal,
  DownloadAppModal,
} from "@/components/Modals";

// Pages
import { HomePage } from "@/pages/HomePage";
import { AboutPage } from "@/pages/AboutPage";
import { ServicesPage } from "@/pages/ServicesPage";
import { HowItWorksPage } from "@/pages/HowItWorksPage";
import { PartnersPage } from "@/pages/PartnersPage";
import { EcosystemPage } from "@/pages/EcosystemPage";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";
import { TermsPage } from "@/pages/TermsPage";

interface ToastState {
  show: boolean;
  message: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("home");
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, message: "" });

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Synchronize hash with current page
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      const validPages: PageType[] = [
        "home",
        "about",
        "services",
        "how-it-works",
        "partners",
        "ecosystem",
        "privacy",
        "terms",
      ];
      if (validPages.includes(hash as PageType)) {
        setCurrentPage(hash as PageType);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigateTo = (page: PageType) => {
    setCurrentPage(page);
    window.location.hash = `#${page}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectService = (service: ServiceInfo) => {
    setSelectedService(service);
    setActiveModal("service_detail");
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased flex flex-col selection:bg-emerald-200 selection:text-emerald-950">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-950 text-white text-xs font-semibold px-5 py-3.5 rounded-2xl shadow-2xl border border-gray-800 animate-slide-up flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-live-dot" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Global Navigation Header */}
      <Navbar
        currentPage={currentPage}
        onNavigate={navigateTo}
        onOpenModal={setActiveModal}
      />

      {/* Primary Page Outlet */}
      <main className="flex-grow">
        {currentPage === "home" && (
          <HomePage
            onNavigate={navigateTo}
            onOpenModal={setActiveModal}
            onSelectService={handleSelectService}
          />
        )}

        {currentPage === "about" && (
          <AboutPage
            onNavigate={navigateTo}
            onOpenModal={setActiveModal}
          />
        )}

        {currentPage === "services" && (
          <ServicesPage
            onNavigate={navigateTo}
            onOpenModal={setActiveModal}
            onSelectService={handleSelectService}
          />
        )}

        {currentPage === "how-it-works" && (
          <HowItWorksPage
            onNavigate={navigateTo}
            onOpenModal={setActiveModal}
          />
        )}

        {currentPage === "partners" && (
          <PartnersPage
            onNavigate={navigateTo}
            onOpenModal={setActiveModal}
          />
        )}

        {currentPage === "ecosystem" && (
          <EcosystemPage
            onNavigate={navigateTo}
            onOpenModal={setActiveModal}
          />
        )}

        {currentPage === "privacy" && (
          <PrivacyPolicyPage
            onNavigate={navigateTo}
            onOpenModal={setActiveModal}
          />
        )}

        {currentPage === "terms" && (
          <TermsPage
            onNavigate={navigateTo}
            onOpenModal={setActiveModal}
          />
        )}
      </main>

      {/* Cookie Consent Banner */}
      <CookieBanner onNavigate={navigateTo} />

      {/* Global Multi-Column Footer */}
      <Footer onNavigate={navigateTo} onOpenModal={setActiveModal} />

      {/* Interactive Modals */}
      <BookingModal
        isOpen={activeModal === "booking"}
        onClose={() => setActiveModal(null)}
        initialServiceId={selectedService?.id}
        onSuccess={(id) => {
          setActiveModal(null);
          showToast(`Order #${id} confirmed! A courier will be assigned shortly.`);
        }}
      />

      <PartnerModal
        isOpen={activeModal === "partner"}
        onClose={() => setActiveModal(null)}
        onSuccess={() => {
          setActiveModal(null);
          showToast("Partner application submitted! Our team will reach out within 24 hours.");
        }}
      />

      <ContactModal
        isOpen={activeModal === "contact"}
        onClose={() => setActiveModal(null)}
        onSuccess={() => {
          setActiveModal(null);
          showToast("Thank you! Your message has been sent to official.quickpress@gmail.com.");
        }}
      />

      <ServiceDetailModal
        service={selectedService}
        isOpen={activeModal === "service_detail"}
        onClose={() => setActiveModal(null)}
        onBook={() => {
          setActiveModal("download_app");
        }}
      />

      <DownloadAppModal
        isOpen={activeModal === "download_app"}
        onClose={() => setActiveModal(null)}
        onSuccess={(phone) => {
          showToast(`Download link dispatched to +91 ${phone}! Check your SMS.`);
        }}
      />
    </div>
  );
}
