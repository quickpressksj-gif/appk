import { useEffect, useState } from "react";
import { Bell, Sparkles, X, Check, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeEvent } from "@/shared/hooks/use-realtime";
import {
  isPushNotificationSupported,
  getNotificationPermission,
  requestPushNotificationPermission,
  setupForegroundMessageListener,
} from "@/api/core/firebase-messaging";
import {
  playOrderBellNotificationSound,
  playOrderPlacedSonicChime,
} from "@/lib/order-success-sound";

export function NotificationManager() {
  const queryClient = useQueryClient();
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (!isPushNotificationSupported()) {
      setPermissionState("unsupported");
      return undefined;
    }

    const current = getNotificationPermission();
    setPermissionState(current);

    // If permission was already granted in a past session, ensure foreground listener & FCM sync is active
    if (current === "granted") {
      void requestPushNotificationPermission();
    }

    // Show permission prompt after a brief 1.5-second delay if not yet granted/denied
    // and not previously dismissed in this session
    const dismissed = sessionStorage.getItem("qp_notif_prompt_dismissed");
    if (current === "default" && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  // Set up Firebase Cloud Messaging (FCM) Foreground Listener with Order Bell Chime
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    void setupForegroundMessageListener((payload) => {
      // Play instant order bell chime sound on incoming push
      playOrderBellNotificationSound();

      // Refresh notification queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    }).then((unsub) => {
      if (unsub) cleanup = unsub;
    });

    return () => {
      cleanup?.();
    };
  }, [queryClient]);

  const requestPermission = async () => {
    if (!isPushNotificationSupported()) return;
    try {
      setShowPrompt(false);
      sessionStorage.setItem("qp_notif_prompt_dismissed", "true");

      const token = await requestPushNotificationPermission();
      const nextPermission = getNotificationPermission();
      setPermissionState(nextPermission);

      if (nextPermission === "granted" || token) {
        // Ring the cheerful order bell sound to confirm audio & notification permission
        playOrderBellNotificationSound();

        toast.success("Notifications & Alerts Enabled! 🔔", {
          description: "You will receive real-time order alerts, live rider updates, and exclusive deals.",
          icon: <Check className="size-4 text-emerald-500" />,
        });

        // Send a test local welcome notification
        try {
          new Notification("QuickPress Notifications Active 🔔", {
            body: "Live pickup, wash, and delivery order alerts are enabled.",
            icon: "/favicon.png",
          });
        } catch {
          // ignore web worker / platform restrictions
        }
      } else {
        toast.info("Notifications not enabled", {
          description: "You can enable notifications anytime in your browser settings.",
        });
      }
    } catch (err) {
      console.error("Error requesting notification permission:", err);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    sessionStorage.setItem("qp_notif_prompt_dismissed", "true");
  };

  // Real-time broadcast & order lifecycle event listener
  useRealtimeEvent(
    [
      "admin_broadcast",
      "notification_created",
      "notification.created",
      "order_status_updated",
      "order_status_changed",
      "order_accepted",
      "order_ready",
      "order_picked_up",
      "order_out_for_delivery",
      "order_delivered",
      "rider_assigned",
    ],
    (payload: any) => {
      const title = payload?.title || payload?.event || "🔔 QuickPress Order Update";
      const message = payload?.message || payload?.description || payload?.text || "Your laundry order has an update.";
      const orderId = payload?.orderId || payload?.id;

      // 1. Play signature order bell chime sound
      playOrderBellNotificationSound();

      // 2. Invalidate caches so UI & badge update instantly
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      }

      // 3. Display rich in-app toast with order link
      toast(title, {
        description: message,
        icon: <Bell className="size-4 text-amber-500 fill-amber-400" />,
        duration: 6000,
        action: {
          label: "View",
          onClick: () => {
            if (typeof window !== "undefined") {
              window.location.href = orderId ? `/track/${orderId}` : "/notifications";
            }
          },
        },
      });

      // 4. Trigger native OS / Mobile push notification if permission is granted
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(title, {
            body: message,
            icon: "/favicon.png",
            badge: "/favicon.png",
          });
        } catch (err) {
          console.warn("Native Notification error:", err);
        }
      }
    }
  );

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md animate-sheet-up">
      <div className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-emerald-500/20 dark:bg-zinc-900/95">
        <div className="flex items-start gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
            <Bell className="size-5 animate-pulse" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Allow Notifications
                </h4>
                <Volume2 className="size-3 text-emerald-600 dark:text-emerald-400" />
              </div>
              <button
                type="button"
                onClick={dismissPrompt}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <p className="mt-1 text-xs font-bold text-zinc-900 dark:text-white">
              Never miss a pickup, delivery, or promo!
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              Get live rider tracking milestones, order bell chimes, and exclusive discount codes.
            </p>

            <div className="mt-3.5 flex items-center gap-2">
              <button
                type="button"
                onClick={dismissPrompt}
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Later
              </button>
              <button
                type="button"
                onClick={requestPermission}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-black text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 active:scale-[0.98]"
              >
                <Sparkles className="size-3.5" />
                Allow Notifications
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

