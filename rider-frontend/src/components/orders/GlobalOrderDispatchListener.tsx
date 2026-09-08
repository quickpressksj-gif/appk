import React, { useEffect, useRef } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { useRiderContext } from "../../context/RiderContext";
import { subscribeRiderOffers } from "../../lib/rider-socket";
import { fetchRiderOffers } from "../../api/rider/rider-orders-api";
import {
  unlockAudioContext,
  playOrderAlertSound,
  speakOrderAlert,
  triggerHaptic,
} from "../../lib/captain-audio";
import { supabase } from "../../integrations/supabase/client";

export const GlobalOrderDispatchListener: React.FC = () => {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, isOnline } = useRiderContext();
  const lastDispatchedOfferIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only listen for incoming orders if rider is authenticated and online
    if (!session?.token || !isOnline) return;

    const handleIncomingOffer = (offer: any) => {
      if (!offer) return;
      // Do not alert if order is still placed/pending partner acceptance
      const ordStatus = String(offer.orderStatus || offer.status || "").toLowerCase();
      if (ordStatus === "placed" || ordStatus === "pending" || ordStatus === "pending_partner_acceptance") {
        return;
      }

      const offerId = offer.offerId || offer.orderId || offer.id || offer._id || `offer-${Date.now()}`;

      // Prevent duplicate instant triggers for the same offer ID
      if (lastDispatchedOfferIdRef.current === offerId) {
        return;
      }
      lastDispatchedOfferIdRef.current = offerId;

      // Play high-priority alert sound, siren & speech prompt
      try {
        unlockAudioContext();
        triggerHaptic([300, 100, 300, 100, 500]);
        playOrderAlertSound();
        const fare = Number(offer.fare || offer.estimatedEarning || 45);
        const pickup = offer.pickupTitle || offer.pickupAddress || "कासगंज हब";
        const drop = offer.dropTitle || offer.dropAddress || "कस्टमर लोकेशन";
        speakOrderAlert(fare, pickup, drop);
      } catch (err) {
        console.warn("[GlobalOrderListener] Audio playback alert failed:", err);
      }

      // If already on /orders or /deliveries, don't interrupt active navigation
      if (pathname === "/orders" || pathname === "/deliveries") {
        return;
      }

      toast.success("🚨 Naya Order Aaya! Orders screen par switch ho raha hai...", {
        duration: 3500,
      });

      // Immediate auto-switch to Orders tab as requested by user
      navigate({ to: "/orders" });
    };

    // 1. Listen via WebSocket
    const unsubscribe = subscribeRiderOffers((rawOffer) => {
      handleIncomingOffer(rawOffer);
    });

    // 2. Initial check
    fetchRiderOffers()
      .then((offers) => {
        if (Array.isArray(offers) && offers.length > 0) {
          handleIncomingOffer(offers[0]);
        }
      })
      .catch(() => {});

    // 3. Robust polling backup every 3 seconds
    const pollInterval = setInterval(async () => {
      try {
        const offers = await fetchRiderOffers();
        if (Array.isArray(offers) && offers.length > 0) {
          handleIncomingOffer(offers[0]);
        } else {
          // Reset last seen offer ID if queue cleared
          lastDispatchedOfferIdRef.current = null;
        }
      } catch {
        // Quiet fallback
      }
    }, 3000);

    // 4. Supabase Realtime postgres_changes subscription for instant order alerts
    let supabaseChannel: any = null;
    try {
      supabaseChannel = supabase
        .channel("rider-supabase-dispatch-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "quickpress_documents",
            filter: "collection=eq.rider_offers",
          },
          (payload) => {
            if (payload.new && (payload.new as any).data) {
              try {
                const doc =
                  typeof (payload.new as any).data === "string"
                    ? JSON.parse((payload.new as any).data)
                    : (payload.new as any).data;
                if (doc && (doc.status === "pending" || !doc.status)) {
                  // Only alert if this offer is targeted to me
                  const myRiderId = session?.riderId;
                  const targetRiderId = doc.riderId || doc.rider_id;
                  if (targetRiderId && myRiderId && targetRiderId !== myRiderId) {
                    return;
                  }
                  handleIncomingOffer(doc);
                }
              } catch {}
            }
          }
        )
        .subscribe();
    } catch {}

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
      if (supabaseChannel) {
        try {
          supabase.removeChannel(supabaseChannel);
        } catch {}
      }
    };
  }, [session?.token, isOnline, pathname, navigate]);

  return null;
};
