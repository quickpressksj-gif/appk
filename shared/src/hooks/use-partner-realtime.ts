/**
 * Partner realtime: live incoming orders, acceptance (with server ack),
 * status changes, rider assignment and customer chat events.
 */

import { useCallback, useState } from "react";

import {
  ORDER_EVENT_LABELS,
  ORDER_LIFECYCLE_EVENTS,
  SOCKET_EVENTS,
  rooms,
  type AnyRealtimePayload,
  type ChatEventPayload,
  type OrderEventPayload,
} from "@backend/core/socket-events";

import { useRealtimeEmit, useRealtimeEvent, useRealtimeRoom } from "./use-realtime";

export type PartnerLiveOrder = {
  orderId: string;
  status: string;
  amount?: number | undefined;
  riderId?: string | null | undefined;
  customerId?: string | undefined;
  updatedAt: string;
  label: string;
};

export type PartnerRealtime = {
  incoming: PartnerLiveOrder[];
  updates: PartnerLiveOrder[];
  chat: ChatEventPayload[];
  acceptOrder: (orderId: string) => Promise<{ ok: boolean; error?: string }>;
  rejectOrder: (orderId: string) => Promise<{ ok: boolean; error?: string }>;
  dismissIncoming: (orderId: string) => void;
};

const MAX_FEED = 30;

export function usePartnerRealtime(
  partnerId: string | null | undefined,
  city?: string | null,
): PartnerRealtime {
  const [incoming, setIncoming] = useState<PartnerLiveOrder[]>([]);
  const [updates, setUpdates] = useState<PartnerLiveOrder[]>([]);
  const [chat, setChat] = useState<ChatEventPayload[]>([]);
  const emit = useRealtimeEmit();

  useRealtimeRoom([partnerId ? rooms.partner(partnerId) : "", city ? rooms.city(city) : ""]);

  const toLive = useCallback((order: OrderEventPayload, event: string): PartnerLiveOrder => {
    return {
      orderId: order.orderId,
      status: order.status ?? event.replace("order.", ""),
      amount: order.amount,
      riderId: order.riderId,
      customerId: order.customerId,
      updatedAt: order.at ?? new Date().toISOString(),
      label: ORDER_EVENT_LABELS[event] ?? event,
    };
  }, []);

  useRealtimeEvent(ORDER_LIFECYCLE_EVENTS as string[], (payload, event) => {
    const order = payload as OrderEventPayload;
    if (partnerId && order.partnerId && order.partnerId !== partnerId) return;
    const live = toLive(order, event);

    if (event === SOCKET_EVENTS.orderCreated) {
      setIncoming((current) =>
        current.some((item) => item.orderId === live.orderId)
          ? current
          : [live, ...current].slice(0, MAX_FEED),
      );
    }
    if (event === SOCKET_EVENTS.orderAccepted) {
      setIncoming((current) => current.filter((item) => item.orderId !== live.orderId));
    }
    setUpdates((current) =>
      [live, ...current.filter((item) => item.orderId !== live.orderId)].slice(0, MAX_FEED),
    );
  });

  useRealtimeEvent(SOCKET_EVENTS.chatMessage, (payload) => {
    setChat((current) => [payload as ChatEventPayload, ...current].slice(0, MAX_FEED));
  });

  const acceptOrder = useCallback(
    async (orderId: string) => {
      setIncoming((current) => current.filter((item) => item.orderId !== orderId));
      const ack = await emit("order.accept", { orderId, partnerId });
      return { ok: ack.ok, ...(ack.error ? { error: ack.error } : {}) };
    },
    [emit, partnerId],
  );

  const rejectOrder = useCallback(
    async (orderId: string) => {
      setIncoming((current) => current.filter((item) => item.orderId !== orderId));
      const ack = await emit("order.reject", { orderId, partnerId });
      return { ok: ack.ok, ...(ack.error ? { error: ack.error } : {}) };
    },
    [emit, partnerId],
  );

  const dismissIncoming = useCallback((orderId: string) => {
    setIncoming((current) => current.filter((item) => item.orderId !== orderId));
  }, []);

  return { incoming, updates, chat, acceptOrder, rejectOrder, dismissIncoming };
}
