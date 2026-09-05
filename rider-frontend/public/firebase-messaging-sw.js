// QuickPress Rider / Captain — Firebase Cloud Messaging Service Worker
// Listens for incoming ride requests, pickup assignments, and drop-off alerts.

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const notification = payload.notification || {};
    const data = payload.data || {};

    const title = notification.title || data.title || "🛵 New Ride Opportunity!";
    const body = notification.body || data.body || data.message || "A new delivery/pickup is waiting for you.";
    const icon = notification.icon || data.icon || "/favicon.png";
    const clickUrl = data.url || (data.orderId ? `/orders/${data.orderId}` : "/orders");

    const options = {
      body: body,
      icon: icon,
      badge: "/favicon.png",
      vibrate: [500, 200, 500],
      tag: data.orderId ? `rider_trip_${data.orderId}` : "quickpress_rider_notification",
      renotify: true,
      requireInteraction: true,
      data: {
        url: clickUrl,
        orderId: data.orderId,
        ...data,
      },
      actions: [
        { action: "view", title: "View Ride" },
        { action: "dismiss", title: "Ignore" },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.debug("[Rider-FCM-SW] Error parsing push payload:", err);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || "/orders";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url && "focus" in client) {
            client.focus();
            if ("navigate" in client) {
              return client.navigate(targetUrl);
            }
            return client;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
