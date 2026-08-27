import { useEffect, useState } from "react";
import { Bell, Sparkles, X, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeEvent } from "@/shared/hooks/use-realtime";

export function NotificationManager() {
  const queryClient = useQueryClient();
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermissionState("unsupported");
      return;
    }

    const current = Notification.permission;
    setPermissionState(current);

    // Show permission prompt after a brief 2-second delay if not yet granted/denied
    // and not previously dismissed in this session
    const dismissed = sessionStorage.getItem("qp_notif_prompt_dismissed");
    if (current === "default" && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermissionState(result);
      setShowPrompt(false);
      sessionStorage.setItem("qp_notif_prompt_dismissed", "true");

      if (result === "granted") {
        toast.success("Notifications enabled!", {
          description: "You will receive real-time order alerts and exclusive offers.",
          icon: <Check className="size-4 text-emerald-500" />,
        });
        // Send a test welcome local notification
        try {
          new Notification("QuickPress Laundry Notifications Active 🎉", {
            body: "You will now get live pickup, wash, and delivery updates right here.",
            icon: "/favicon.png",
          });
        } catch {
          // ignore web worker / android service restrictions
        }
      } else {
        toast.info("Notifications not enabled", {
          description: "You can enable notifications anytime in your browser/app settings.",
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

  // Real-time broadcast listener
  useRealtimeEvent(["admin_broadcast", "notification_created", "notification.created"], (payload: any) => {
    const title = payload?.title || "QuickPress Alert";
    const message = payload?.message || payload?.description || "";

    // 1. Invalidate caches so UI & badge update instantly
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });

    // 2. Display rich in-app toast
    toast(title, {
      description: message,
      icon: <Bell className="size-4 text-amber-500 fill-amber-400" />,
      duration: 6000,
      action: {
        label: "View",
        onClick: () => {
          window.location.href = "/notifications";
        },
      },
    });

    // 3. Trigger native OS / Mobile push notification if permission is granted
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
  });

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
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Allow Notifications
              </h4>
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
              Get live rider tracking milestones and exclusive discount codes.
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
