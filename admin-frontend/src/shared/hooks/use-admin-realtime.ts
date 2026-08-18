/**
 * Admin realtime: live dashboard counters, live orders, live riders, live
 * partners and live customer activity.
 */

import { useCallback, useMemo, useState } from "react";

import {
  ORDER_EVENT_LABELS,
  ORDER_LIFECYCLE_EVENTS,
  SOCKET_EVENTS,
  rooms,
  type LocationEventPayload,
  type NotificationEventPayload,
  type OrderEventPayload,
  type WalletEventPayload,
} from "@/api/core/socket-events";

import { useRealtimeEvent, useRealtimeRoom } from "./use-realtime";

export type AdminLiveOrder = {
  orderId: string;
  status: string;
  label: string;
  partnerId?: string | undefined;
  riderId?: string | null | undefined;
  customerId?: string | undefined;
  city?: string | undefined;
  amount?: number | undefined;
  updatedAt: string;
};

export type AdminLiveRider = {
  riderId: string;
  lat: number;
  lng: number;
  orderId?: string | undefined;
  updatedAt: string;
};

export type AdminActivityEntry = {
  id: string;
  kind: "order" | "wallet" | "notification";
  text: string;
  at: string;
};

export type AdminRealtime = {
  orders: AdminLiveOrder[];
  riders: AdminLiveRider[];
  partners: { partnerId: string; lastOrderAt: string; orders: number }[];
  activity: AdminActivityEntry[];
  metrics: { liveOrders: number; delivered: number; onlineRiders: number; activePartners: number };
  clearActivity: () => void;
};

const MAX_FEED = 50;

export function useAdminRealtime(city?: string | null): AdminRealtime {
  const [orders, setOrders] = useState<AdminLiveOrder[]>([]);
  const [riderMap, setRiderMap] = useState<Record<string, AdminLiveRider>>({});
  const [partnerMap, setPartnerMap] = useState<
    Record<string, { partnerId: string; lastOrderAt: string; orders: number }>
  >({});
  const [activity, setActivity] = useState<AdminActivityEntry[]>([]);
  const [delivered, setDelivered] = useState(0);

  useRealtimeRoom([rooms.admin(), city ? rooms.city(city) : ""]);

  const pushActivity = useCallback((entry: AdminActivityEntry) => {
    setActivity((current) => [entry, ...current].slice(0, MAX_FEED));
  }, []);

  useRealtimeEvent(ORDER_LIFECYCLE_EVENTS as string[], (payload, event) => {
    const order = payload as OrderEventPayload;
    const live: AdminLiveOrder = {
      orderId: order.orderId,
      status: order.status ?? event.replace("order.", ""),
      label: ORDER_EVENT_LABELS[event] ?? event,
      partnerId: order.partnerId,
      riderId: order.riderId,
      customerId: order.customerId,
      city: order.city,
      amount: order.amount,
      updatedAt: order.at ?? new Date().toISOString(),
    };

    setOrders((current) =>
      [live, ...current.filter((item) => item.orderId !== live.orderId)].slice(0, MAX_FEED),
    );
    if (event === SOCKET_EVENTS.orderDelivered) setDelivered((count) => count + 1);

    if (order.partnerId) {
      setPartnerMap((current) => {
        const existing = current[order.partnerId as string];
        return {
          ...current,
          [order.partnerId as string]: {
            partnerId: order.partnerId as string,
            lastOrderAt: live.updatedAt,
            orders: (existing?.orders ?? 0) + (event === SOCKET_EVENTS.orderCreated ? 1 : 0),
          },
        };
      });
    }

    pushActivity({
      id: order.eventId,
      kind: "order",
      text: `${live.label} · ${live.orderId}`,
      at: live.updatedAt,
    });
  });

  useRealtimeEvent(SOCKET_EVENTS.locationUpdated, (payload) => {
    const location = payload as LocationEventPayload;
    setRiderMap((current) => ({
      ...current,
      [location.riderId]: {
        riderId: location.riderId,
        lat: location.lat,
        lng: location.lng,
        orderId: location.orderId,
        updatedAt: location.at ?? new Date().toISOString(),
      },
    }));
  });

  useRealtimeEvent(SOCKET_EVENTS.walletUpdated, (payload) => {
    const wallet = payload as WalletEventPayload;
    pushActivity({
      id: wallet.eventId,
      kind: "wallet",
      text: `Wallet ${wallet.delta >= 0 ? "+" : ""}${wallet.delta} · ${wallet.ownerRole} ${wallet.ownerId}`,
      at: wallet.at ?? new Date().toISOString(),
    });
  });

  useRealtimeEvent(SOCKET_EVENTS.notificationCreated, (payload) => {
    const notification = payload as NotificationEventPayload;
    pushActivity({
      id: notification.eventId,
      kind: "notification",
      text: notification.title,
      at: notification.at ?? new Date().toISOString(),
    });
  });

  const riders = useMemo(() => Object.values(riderMap), [riderMap]);
  const partners = useMemo(() => Object.values(partnerMap), [partnerMap]);

  const metrics = useMemo(
    () => ({
      liveOrders: orders.filter((order) => order.status !== "delivered").length,
      delivered,
      onlineRiders: riders.length,
      activePartners: partners.length,
    }),
    [orders, delivered, riders.length, partners.length],
  );

  const clearActivity = useCallback(() => setActivity([]), []);

  return { orders, riders, partners, activity, metrics, clearActivity };
}
