/**
 * Rider realtime: live delivery queue, new delivery notifications, live
 * navigation updates and live order updates.
 */

import { useCallback, useState } from "react";

import {
  ORDER_EVENT_LABELS,
  ORDER_LIFECYCLE_EVENTS,
  SOCKET_EVENTS,
  rooms,
  type LocationEventPayload,
  type NotificationEventPayload,
  type OrderEventPayload,
} from "@backend/core/socket-events";

import { useRealtimeEmit, useRealtimeEvent, useRealtimeRoom } from "./use-realtime";

export type RiderQueueItem = {
  orderId: string;
  status: string;
  label: string;
  partnerId?: string | undefined;
  updatedAt: string;
};

export type RiderRealtime = {
  queue: RiderQueueItem[];
  newDelivery: RiderQueueItem | null;
  notifications: NotificationEventPayload[];
  navigation: LocationEventPayload | null;
  publishLocation: (lat: number, lng: number, orderId?: string) => Promise<{ ok: boolean }>;
  clearNewDelivery: () => void;
};

const TERMINAL = new Set([SOCKET_EVENTS.orderDelivered]);
const MAX_FEED = 30;

export function useRiderRealtime(
  riderId: string | null | undefined,
  city?: string | null,
): RiderRealtime {
  const [queue, setQueue] = useState<RiderQueueItem[]>([]);
  const [newDelivery, setNewDelivery] = useState<RiderQueueItem | null>(null);
  const [notifications, setNotifications] = useState<NotificationEventPayload[]>([]);
  const [navigation, setNavigation] = useState<LocationEventPayload | null>(null);
  const emit = useRealtimeEmit();

  useRealtimeRoom([riderId ? rooms.rider(riderId) : "", city ? rooms.city(city) : ""]);

  useRealtimeEvent(ORDER_LIFECYCLE_EVENTS as string[], (payload, event) => {
    const order = payload as OrderEventPayload;
    if (riderId && order.riderId && order.riderId !== riderId) return;

    const item: RiderQueueItem = {
      orderId: order.orderId,
      status: order.status ?? event.replace("order.", ""),
      label: ORDER_EVENT_LABELS[event] ?? event,
      partnerId: order.partnerId,
      updatedAt: order.at ?? new Date().toISOString(),
    };

    if (event === SOCKET_EVENTS.orderAssigned) setNewDelivery(item);

    setQueue((current) => {
      const without = current.filter((entry) => entry.orderId !== item.orderId);
      if (TERMINAL.has(event as never)) return without;
      return [item, ...without].slice(0, MAX_FEED);
    });
  });

  useRealtimeEvent(SOCKET_EVENTS.locationUpdated, (payload) => {
    const location = payload as LocationEventPayload;
    if (riderId && location.riderId && location.riderId !== riderId) return;
    setNavigation(location);
  });

  useRealtimeEvent(SOCKET_EVENTS.notificationCreated, (payload) => {
    setNotifications((current) =>
      [payload as NotificationEventPayload, ...current].slice(0, MAX_FEED),
    );
  });

  const publishLocation = useCallback(
    async (lat: number, lng: number, orderId?: string) => {
      const ack = await emit(SOCKET_EVENTS.locationUpdated, { riderId, lat, lng, orderId });
      return { ok: ack.ok };
    },
    [emit, riderId],
  );

  const clearNewDelivery = useCallback(() => setNewDelivery(null), []);

  return { queue, newDelivery, notifications, navigation, publishLocation, clearNewDelivery };
}
