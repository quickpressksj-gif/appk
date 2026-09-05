/**
 * QuickPress Customer — Pure Native WebPush (VAPID / RFC 8292) Client.
 *
 * 100% Native browser push notification support without third-party dependencies.
 * Uses standard ServiceWorker + PushManager + VAPID Public Key.
 */

import { apiGetJson, apiPostJson, apiDeleteJson } from "./transport";
import { toast } from "sonner";

export function isNativeWebPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Convert base64url string to Uint8Array for PushManager subscription */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Fetch public VAPID key dynamically from the backend */
export async function fetchVapidPublicKey(): Promise<string | null> {
  try {
    const res = await apiGetJson<{ ok: boolean; publicKey: string }>(
      "/api/notifications/webpush/vapid-public-key",
      { anonymous: true }
    );
    return res?.publicKey || null;
  } catch (err) {
    console.debug("[WebPush] Failed to fetch VAPID public key:", err);
    return null;
  }
}

/** Request browser permission and subscribe to Native WebPush */
export async function subscribeToNativeWebPush(): Promise<PushSubscription | null> {
  if (!isNativeWebPushSupported()) {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return null;
    }

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" }
    );
    await navigator.serviceWorker.ready;

    const vapidPublicKey = await fetchVapidPublicKey();
    if (!vapidPublicKey) {
      console.warn("[WebPush] No VAPID public key available.");
      return null;
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });
    }

    if (subscription) {
      // Sync subscription with FastAPI backend
      await apiPostJson("/api/notifications/webpush/subscribe", {
        subscription: subscription.toJSON(),
        device: "web",
        deviceType: "web",
      });
      return subscription;
    }
  } catch (err) {
    console.debug("[WebPush] Subscription error:", err);
  }
  return null;
}

/** Unsubscribe from Native WebPush on logout */
export async function unsubscribeFromNativeWebPush(): Promise<boolean> {
  if (!isNativeWebPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      try {
        await apiDeleteJson("/api/notifications/webpush/unsubscribe", {
          params: { endpoint },
        });
      } catch {
        // Best-effort backend cleanup
      }
      return true;
    }
  } catch (err) {
    console.debug("[WebPush] Unsubscribe error:", err);
  }
  return false;
}

/** Trigger an instant native test push */
export async function triggerTestWebPush(): Promise<boolean> {
  try {
    const res = await apiPostJson<{ ok: boolean; sentCount: number }>(
      "/api/notifications/webpush/test",
      {
        title: "⚡ Native WebPush Working!",
        body: "Your device is successfully receiving direct VAPID browser notifications.",
        url: "/notifications",
      }
    );
    if (res?.ok) {
      toast.success("Native push dispatched to your browser!");
      return true;
    }
  } catch (err) {
    toast.error("Failed to send test push notification.");
  }
  return false;
}
