/**
 * Real-time Socket.IO client for Rider Cockpit.
 * Listens for instant order dispatches ('order.rider_offer', 'new_order_offer')
 * and triggers immediate audible siren bell alerts for the delivery captain.
 */

import { io, type Socket } from "socket.io-client";
import { readSession } from "../api/core/session-store";

let socket: Socket | null = null;
const listeners = new Set<(offer: any) => void>();

function getSocketUrl(): string {
  if (typeof window === "undefined") return "http://localhost:8000";
  const custom = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL;
  if (custom && typeof custom === "string" && custom.trim()) {
    return custom.trim().replace(/\/+$/, "");
  }
  const host = window.location.hostname || "localhost";
  return `http://${host}:8000`;
}

export function initRiderSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (socket && socket.connected) return socket;

  const url = getSocketUrl();
  const session = readSession("rider") || readSession();
  const riderId = session?.riderId || session?.account?.riderId || "";
  const phone = (session?.account?.phone || session?.phone || "").replace("+", "").trim();
  const userId = session?.account?.id || session?.account?.user_id || "";

  try {
    if (!socket) {
      socket = io(url, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      socket.on("connect", () => {
        console.log("[RiderSocket] Connected to realtime dispatch gateway:", socket?.id);
        // Join relevant rider rooms
        if (riderId) socket?.emit("join", `rider:${riderId}`);
        if (phone) {
          socket?.emit("join", `rider:${phone}`);
          socket?.emit("join", `rider:+${phone}`);
        }
        if (userId) socket?.emit("join", `rider:${userId}`);
        socket?.emit("join", "riders");
      });

      const handleOffer = (data: any) => {
        console.log("[RiderSocket] ⚡ Realtime order offer received:", data);
        listeners.forEach((listener) => {
          try {
            listener(data);
          } catch (err) {
            console.error("[RiderSocket] Error in offer listener:", err);
          }
        });
      };

      socket.on("order.rider_offer", handleOffer);
      socket.on("new_order_offer", handleOffer);
      socket.on("order.offer", handleOffer);
      socket.on("dispatch.offer", handleOffer);

      socket.on("disconnect", (reason) => {
        console.log("[RiderSocket] Disconnected from gateway:", reason);
      });
    } else if (!socket.connected) {
      socket.connect();
    }

    return socket;
  } catch (err) {
    console.warn("[RiderSocket] Failed to initialize socket client:", err);
    return null;
  }
}

export function subscribeRiderOffers(callback: (offer: any) => void): () => void {
  listeners.add(callback);
  initRiderSocket();

  return () => {
    listeners.delete(callback);
  };
}
