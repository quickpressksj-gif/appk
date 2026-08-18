/**
 * QuickPress realtime contract (Phase 5 · Sprint 5.5).
 *
 * ONE source of truth for Socket.IO event names, room names and payload
 * shapes. Customer, partner, rider and admin apps all import from here, so a
 * change to the contract updates every application at once.
 *
 * Nothing in this file talks to the network — see `socket-client.ts`.
 */

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

export const SOCKET_EVENTS = {
  orderCreated: "order.created",
  orderAccepted: "order.accepted",
  orderAssigned: "order.assigned",
  orderReachedShop: "order.reached_shop",
  orderPicked: "order.picked",
  orderWashing: "order.washing",
  orderIroning: "order.ironing",
  orderReady: "order.ready",
  orderOutForDelivery: "order.out_for_delivery",
  orderDelivered: "order.delivered",
  locationUpdated: "location.updated",
  walletUpdated: "wallet.updated",
  notificationCreated: "notification.created",
  chatMessage: "chat.message",
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

/** Order lifecycle events in the exact sequence the tracking UI renders. */
export const ORDER_LIFECYCLE_EVENTS: SocketEventName[] = [
  SOCKET_EVENTS.orderCreated,
  SOCKET_EVENTS.orderAccepted,
  SOCKET_EVENTS.orderAssigned,
  SOCKET_EVENTS.orderReachedShop,
  SOCKET_EVENTS.orderPicked,
  SOCKET_EVENTS.orderWashing,
  SOCKET_EVENTS.orderIroning,
  SOCKET_EVENTS.orderReady,
  SOCKET_EVENTS.orderOutForDelivery,
  SOCKET_EVENTS.orderDelivered,
];

export const ORDER_EVENT_LABELS: Record<string, string> = {
  [SOCKET_EVENTS.orderCreated]: "Order placed",
  [SOCKET_EVENTS.orderAccepted]: "Partner accepted",
  [SOCKET_EVENTS.orderAssigned]: "Rider assigned",
  [SOCKET_EVENTS.orderReachedShop]: "Rider reached shop",
  [SOCKET_EVENTS.orderPicked]: "Pickup complete",
  [SOCKET_EVENTS.orderWashing]: "Washing started",
  [SOCKET_EVENTS.orderIroning]: "Ironing started",
  [SOCKET_EVENTS.orderReady]: "Washing finished",
  [SOCKET_EVENTS.orderOutForDelivery]: "Out for delivery",
  [SOCKET_EVENTS.orderDelivered]: "Delivered",
  [SOCKET_EVENTS.locationUpdated]: "Rider location updated",
  [SOCKET_EVENTS.walletUpdated]: "Wallet updated",
  [SOCKET_EVENTS.notificationCreated]: "New notification",
  [SOCKET_EVENTS.chatMessage]: "New message",
};

/* ------------------------------------------------------------------ */
/* Rooms                                                               */
/* ------------------------------------------------------------------ */

export const rooms = {
  customer: (id: string) => `customer:${id}`,
  partner: (id: string) => `partner:${id}`,
  rider: (id: string) => `rider:${id}`,
  admin: () => "admin",
  city: (city: string) => `city:${city.toLowerCase().replace(/\s+/g, "-")}`,
  order: (orderId: string) => `order:${orderId}`,
} as const;

export type RoomName = string;

/* ------------------------------------------------------------------ */
/* Payloads                                                            */
/* ------------------------------------------------------------------ */

/** Envelope every server event carries. `eventId` powers duplicate removal. */
export type RealtimeEnvelope = {
  /** Globally unique id — replays/duplicates are dropped by the client. */
  eventId: string;
  /** ISO timestamp the server produced the event at. */
  at: string;
  /** Room the event was broadcast to (for debugging / dev tools). */
  room?: string;
};

export type OrderEventPayload = RealtimeEnvelope & {
  orderId: string;
  status: string;
  customerId?: string;
  partnerId?: string;
  riderId?: string | null;
  city?: string;
  amount?: number;
  etaMinutes?: number | null;
  message?: string;
};

export type LocationEventPayload = RealtimeEnvelope & {
  riderId: string;
  orderId?: string;
  lat: number;
  lng: number;
  heading?: number;
  speedKph?: number;
};

export type WalletEventPayload = RealtimeEnvelope & {
  ownerId: string;
  ownerRole: "customer" | "partner" | "rider";
  balance: number;
  delta: number;
  reason?: string;
};

export type NotificationEventPayload = RealtimeEnvelope & {
  notificationId: string;
  title: string;
  body?: string;
  category?: string;
  targetRole?: "customer" | "partner" | "rider" | "admin";
};

export type ChatEventPayload = RealtimeEnvelope & {
  threadId: string;
  orderId?: string;
  from: "customer" | "partner" | "rider" | "support";
  text: string;
};

export type RealtimePayloadMap = {
  [SOCKET_EVENTS.orderCreated]: OrderEventPayload;
  [SOCKET_EVENTS.orderAccepted]: OrderEventPayload;
  [SOCKET_EVENTS.orderAssigned]: OrderEventPayload;
  [SOCKET_EVENTS.orderReachedShop]: OrderEventPayload;
  [SOCKET_EVENTS.orderPicked]: OrderEventPayload;
  [SOCKET_EVENTS.orderWashing]: OrderEventPayload;
  [SOCKET_EVENTS.orderIroning]: OrderEventPayload;
  [SOCKET_EVENTS.orderReady]: OrderEventPayload;
  [SOCKET_EVENTS.orderOutForDelivery]: OrderEventPayload;
  [SOCKET_EVENTS.orderDelivered]: OrderEventPayload;
  [SOCKET_EVENTS.locationUpdated]: LocationEventPayload;
  [SOCKET_EVENTS.walletUpdated]: WalletEventPayload;
  [SOCKET_EVENTS.notificationCreated]: NotificationEventPayload;
  [SOCKET_EVENTS.chatMessage]: ChatEventPayload;
};

export type AnyRealtimePayload = RealtimePayloadMap[keyof RealtimePayloadMap];

export function isOrderEvent(name: string): boolean {
  return ORDER_LIFECYCLE_EVENTS.includes(name as SocketEventName);
}
