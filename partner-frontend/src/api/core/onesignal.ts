/**
 * OneSignal Web & Mobile Push Notification Engine — QuickPress Partner.
 *
 * Provides:
 * 1. Client initialization with App ID 184bda82-7c5b-4319-a977-4fcffbcca270
 * 2. User identification (login / logout) mapping to Backend Partner ID.
 * 3. High-priority foreground notification listener & continuous Zomato siren alarm trigger.
 */

import { startOrderAlarm } from "@/lib/order-alarm";

export const ONESIGNAL_APP_ID = "184bda82-7c5b-4319-a977-4fcffbcca270";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>;
    OneSignal?: any;
  }
}

let isInitialized = false;

/**
 * Initializes OneSignal Web SDK for Partner Hub.
 */
export function initOneSignal(): void {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function (OneSignal: any) {
    try {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: false,
        },
      });

      // When an incoming order notification is received in foreground, ring the Zomato alarm!
      OneSignal.Notifications.addEventListener("foregroundWillDisplay", (event: any) => {
        try {
          const notif = event?.notification;
          const data = notif?.additionalData || {};
          const isOrder =
            notif?.title?.includes("ORDER") ||
            data?.kind === "order-new" ||
            data?.type === "ORDER_CREATED";

          if (isOrder) {
            startOrderAlarm(data?.orderCode || data?.orderId);
          }
        } catch (err) {
          console.warn("[OneSignal-Partner] Foreground alarm trigger error:", err);
        }
      });

      // Listen for subscription changes and sync with backend
      OneSignal.User.PushSubscription.addEventListener("change", async (event: any) => {
        const subscriptionId = event?.current?.id;
        if (subscriptionId) {
          await syncPlayerIdWithBackend(subscriptionId);
        }
      });
    } catch (err) {
      console.warn("[OneSignal-Partner] Init warning:", err);
    }
  });
}

/**
 * Syncs the OneSignal player / subscription ID with the Python backend.
 */
async function syncPlayerIdWithBackend(playerId: string): Promise<void> {
  try {
    const token = localStorage.getItem("qp_partner_token") || sessionStorage.getItem("qp_partner_token") || localStorage.getItem("qp_access_token");
    if (!token) return;

    await fetch("/api/notifications/onesignal/player-id", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ playerId, deviceType: "web" }),
    });
  } catch {
    // Non-blocking sync
  }
}

/**
 * Logs in the partner in OneSignal using the Partner User ID.
 */
export async function onesignalLogin(partnerId: string): Promise<void> {
  if (typeof window === "undefined" || !partnerId) return;

  initOneSignal();
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function (OneSignal: any) {
    try {
      await OneSignal.login(partnerId);
      const subscriptionId = OneSignal.User?.PushSubscription?.id;
      if (subscriptionId) {
        await syncPlayerIdWithBackend(subscriptionId);
      }
    } catch (err) {
      console.warn("[OneSignal-Partner] Login error:", err);
    }
  });
}

/**
 * Logs out the partner from OneSignal on sign-out.
 */
export async function onesignalLogout(): Promise<void> {
  if (typeof window === "undefined") return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function (OneSignal: any) {
    try {
      await OneSignal.logout();
    } catch (err) {
      console.warn("[OneSignal-Partner] Logout error:", err);
    }
  });
}

/**
 * Requests push notification permission from the partner.
 */
export async function requestOneSignalPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  initOneSignal();
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        const permission = await OneSignal.Notifications.requestPermission();
        resolve(permission === true || permission === "granted");
      } catch {
        resolve(false);
      }
    });
  });
}
