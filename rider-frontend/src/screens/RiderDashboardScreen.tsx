import { useNavigate } from "@tanstack/react-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useRiderContext } from "../context/RiderContext";
import { fetchRiderOffers } from "../api/rider/rider-orders-api";
import {
  fetchRiderDashboard,
  pushRiderLocation,
  updateRiderStatus,
} from "../api/rider/rider-dashboard-api";
import { fetchRiderProfile } from "../api/rider/rider-profile-api";

import { CaptainTopBar } from "../components/layout/CaptainTopBar";
import { CaptainSidebarDrawer } from "../components/layout/CaptainSidebarDrawer";
import { CaptainNotificationsModal } from "../components/notifications/CaptainNotificationsModal";
import { fetchUnreadCount } from "../api/rider/rider-notifications-api";
import { CaptainHomeOfflineScreen } from "../components/home/CaptainHomeOfflineScreen";
import { CaptainOnlineMapView } from "../components/map/CaptainOnlineMapView";
import { RiderBottomNav } from "../components/RiderBottomNav";
import { useLanguage } from "../lib/i18n";
import {
  playDutyToggleSound,
  playOrderAlertSound,
  speakDutyStatus,
  speakOrderAlert,
  triggerHaptic,
  unlockAudioContext,
} from "../lib/captain-audio";
import { subscribeRiderOffers } from "../lib/rider-socket";

export function RiderDashboardScreen() {
  const navigate = useNavigate();
  const { session, isOnline, setOnline, signOut } = useRiderContext();
  const { t } = useLanguage();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [dutyLoading, setDutyLoading] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayDeliveries, setTodayDeliveries] = useState(0);
  const [captainName, setCaptainName] = useState(session?.fullName || "Captain");
  const [captainId, setCaptainId] = useState(session?.riderId || "");
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [savedActiveOrder, setSavedActiveOrder] = useState<any>(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  const geoWatchIdRef = useRef<number | null>(null);

  // Restore saved active order safely
  useEffect(() => {
    try {
      const saved = localStorage.getItem("qp_active_rider_order");
      if (saved) setSavedActiveOrder(JSON.parse(saved));
    } catch {}
  }, []);

  // Load real metrics from MongoDB Atlas Backend
  const loadRealData = useCallback(async () => {
    try {
      const [dashRes, profileRes, offersRes, unreadRes] = await Promise.all([
        fetchRiderDashboard().catch(() => null),
        fetchRiderProfile().catch(() => null),
        fetchRiderOffers().catch(() => []),
        fetchUnreadCount().catch(() => 0),
      ]);

      if (profileRes) {
        setCaptainName(profileRes.fullName || profileRes.name || "Captain");
        setCaptainId(profileRes.riderId || profileRes.id || "");
        setOnline(Boolean(profileRes.isOnline));
      }

      if (Array.isArray(offersRes)) {
        setPendingOrdersCount(offersRes.length);
      }

      if (typeof unreadRes === "number") {
        setUnreadNotifCount(unreadRes);
      }

      if (dashRes) {
        setTodayEarnings(Number(dashRes.todayEarnings ?? dashRes.metrics?.earningsToday ?? 0));
        setTodayDeliveries(
          Number(dashRes.todayDeliveries ?? dashRes.metrics?.deliveriesCompletedToday ?? 0)
        );
      }
    } catch {
      // quiet fallback
    }
  }, [setOnline]);

  useEffect(() => {
    loadRealData();
  }, [loadRealData]);

  // Periodic polling for real-time notification badge updates
  useEffect(() => {
    const timer = setInterval(() => {
      fetchUnreadCount().then(setUnreadNotifCount).catch(() => {});
    }, 25000);
    return () => clearInterval(timer);
  }, []);

  // GPS Geolocation Tracking
  useEffect(() => {
    if (!navigator?.geolocation) return;

    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentCoords(coords);
        if (isOnline) {
          pushRiderLocation(coords.lat, coords.lng).catch(() => {});
        }
      },
      () => {
        setCurrentCoords({ lat: 27.8118, lng: 78.6477 });
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );

    return () => {
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }
    };
  }, [isOnline]);

  // Live Offers Stream: When an offer arrives, switch immediately to the Orders tab!
  useEffect(() => {
    if (!isOnline) return;

    const unsubscribe = subscribeRiderOffers(() => {
      unlockAudioContext();
      triggerHaptic([200, 100, 200, 100, 400]);
      playOrderAlertSound();
      speakOrderAlert(55, "कासगंज हब", "कस्टमर लोकेशन");
      setPendingOrdersCount((prev) => prev + 1);
      toast.info("🚨 New Order Dispatched! Switching to Orders...");
      // Auto-switch to the Orders tab as requested by user
      navigate({ to: "/orders" });
    });

    fetchRiderOffers()
      .then((offers) => {
        if (Array.isArray(offers) && offers.length > 0) {
          setPendingOrdersCount(offers.length);
        }
      })
      .catch(() => {});

    return () => {
      unsubscribe();
    };
  }, [isOnline, navigate]);

  // Handle Duty Toggle
  const handleToggleDuty = async () => {
    unlockAudioContext();
    setDutyLoading(true);
    const nextState = !isOnline;
    try {
      await updateRiderStatus(nextState);
      setOnline(nextState);
      playDutyToggleSound(nextState);
      speakDutyStatus(nextState);
      triggerHaptic();
      toast.success(nextState ? "Captain is ON DUTY 🟢" : "Captain is OFF DUTY 🔴");
    } catch {
      toast.error("Failed to update duty status. Please check your network.");
    } finally {
      setDutyLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col w-full h-[100dvh] max-w-md mx-auto bg-white shadow-2xl overflow-hidden text-neutral-900 select-none">
      {/* 1. Left Slide-Out Hamburger Drawer */}
      <CaptainSidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        captainName={captainName}
        captainId={captainId}
        onLogout={() => {
          setIsDrawerOpen(false);
          signOut();
          toast.success("Logged out successfully. See you soon, Captain! 🛵");
          navigate({ to: "/auth" });
        }}
        onOpenLanguage={() => {
          setIsDrawerOpen(false);
          navigate({ to: "/language" });
        }}
        onOpenOnboarding={() => {
          setIsDrawerOpen(false);
          navigate({ to: "/onboarding" });
        }}
      />

      {/* 2. Top Header Bar (Hamburger, Duty Switch, MapPin, Bell Badge) */}
      <CaptainTopBar
        isOnline={isOnline}
        onToggleDuty={handleToggleDuty}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenNotifications={() => setIsNotifModalOpen(true)}
        notificationCount={unreadNotifCount}
        loading={dutyLoading}
      />

      {/* 3. Screen Switcher: Offline Home vs Online Map (Order Queue is exclusively on /orders) */}
      {!isOnline ? (
        // Offline Home View (Exact match to uploaded screenshot)
        <CaptainHomeOfflineScreen
          todayEarnings={todayEarnings}
          todayDeliveries={todayDeliveries}
          captainName={captainName}
          onGoOnline={handleToggleDuty}
          onOpenWorkZoneInfo={() =>
            toast.info("Kasganj Work Zone active with ₹20 bonus per trip!")
          }
        />
      ) : (
        // Online Rapido Captain Full-Bleed Map View
        <CaptainOnlineMapView
          currentCoords={currentCoords}
          todayEarnings={todayEarnings}
          todayDeliveries={todayDeliveries}
          captainName={captainName}
          pendingOrdersCount={pendingOrdersCount}
          onOpenOrders={() => navigate({ to: "/orders" })}
          onRecenter={() => {
            if (currentCoords) {
              toast.info("Map centered at live location 📍");
            }
          }}
          onOpenWorkZoneInfo={() =>
            toast.info("Kasganj Work Zone active with ₹20 bonus per trip!")
          }
        />
      )}

      {/* Active Trip Floating Pill (if order is active) */}
      {/* Active Trip Floating Pill (if order is active - White & Emerald Green) */}
      {savedActiveOrder && (
        <div className="absolute bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom-2 duration-200">
          <button
            type="button"
            onClick={() => navigate({ to: "/orders" })}
            className="w-full flex items-center justify-between p-3.5 bg-white text-zinc-900 rounded-2xl shadow-xl border-2 border-[#00C853] active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00C853] text-white">
                🛵
              </div>
              <div>
                <p className="text-xs font-black text-zinc-900">Active Trip: {savedActiveOrder.customerName || "Customer"}</p>
                <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{savedActiveOrder.pickupTitle || savedActiveOrder.pickupAddress}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-[#00C853] bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <span>Resume HUD</span>
              <span>➔</span>
            </div>
          </button>
        </div>
      )}

      {/* 4. Captain Real-Time Notification Center Modal */}
      <CaptainNotificationsModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        onNotificationChange={() => {
          fetchUnreadCount().then(setUnreadNotifCount).catch(() => {});
        }}
      />

      {/* 5. Strictly 2-Tab Bottom Navigation with live badge count on Orders */}
      <RiderBottomNav active="dashboard" ordersBadgeCount={pendingOrdersCount} />
    </div>
  );
}
