// QuickPress Admin — Firebase Cloud Messaging Service Worker
// Listens for critical system alerts, SLA breaches, and high-priority support dispatches.

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

    const title = notification.title || data.title || "🛡️ QuickPress Admin Alert";
    const body = notification.body || data.body || data.message || "System broadcast notification received.";
    const icon = notification.icon || data.icon || "/favicon.png";
    const clickUrl = data.url || "/notifications";

    const options = {
      body: body,
      icon: icon,
      badge: "/favicon.png",
      vibrate: [200, 100, 200],
      tag: data.alertId || "quickpress_admin_notification",
      renotify: true,
      data: {
        url: clickUrl,
        ...data,
      },
      actions: [
        { action: "open", title: "Open Dashboard" },
        { action: "dismiss", title: "Close" },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.debug("[Admin-FCM-SW] Error parsing push payload:", err);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

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
