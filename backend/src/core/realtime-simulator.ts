/**
 * Deterministic realtime fixture stream used when `VITE_SOCKET_URL` is not
 * configured — the exact mirror of the mock HTTP transport in `transport.ts`.
 *
 * It emits the same event names, rooms and payload shapes the production
 * Socket.IO server emits, so every screen is wired to the real contract and
 * pointing at a live gateway is a pure configuration change.
 */

import {
  ORDER_LIFECYCLE_EVENTS,
  SOCKET_EVENTS,
  rooms,
  type AnyRealtimePayload,
  type SocketEventName,
} from "./socket-events";

export type SimulatedEmit = (event: string, payload: AnyRealtimePayload) => void;

const CITY = "bengaluru";
const DEMO_ORDER = "QP-10482";
const DEMO_CUSTOMER = "cust-1001";
const DEMO_PARTNER = "partner-2001";
const DEMO_RIDER = "rider-3001";

let counter = 0;
function eventId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

function envelope(room: string) {
  return { eventId: eventId("sim"), at: new Date().toISOString(), room };
}

/** Runs the full order lifecycle plus rider location pings on a timer. */
export function startRealtimeSimulator(emit: SimulatedEmit): () => void {
  let step = 0;
  let stopped = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const lifecycle = window.setInterval(() => {
    if (stopped) return;
    const event = ORDER_LIFECYCLE_EVENTS[step % ORDER_LIFECYCLE_EVENTS.length] as SocketEventName;
    step += 1;
    emit(event, {
      ...envelope(rooms.order(DEMO_ORDER)),
      orderId: DEMO_ORDER,
      status: event.replace("order.", ""),
      customerId: DEMO_CUSTOMER,
      partnerId: DEMO_PARTNER,
      riderId: DEMO_RIDER,
      city: CITY,
      amount: 649,
      etaMinutes: Math.max(5, 45 - step * 4),
      message: `Simulated ${event}`,
    });
  }, 12_000);

  const location = window.setInterval(() => {
    if (stopped) return;
    const t = Date.now() / 60_000;
    emit(SOCKET_EVENTS.locationUpdated, {
      ...envelope(rooms.rider(DEMO_RIDER)),
      riderId: DEMO_RIDER,
      orderId: DEMO_ORDER,
      lat: 12.9716 + Math.sin(t) * 0.01,
      lng: 77.5946 + Math.cos(t) * 0.01,
      heading: (t * 30) % 360,
      speedKph: 18,
    });
  }, 5_000);

  return () => {
    stopped = true;
    window.clearInterval(lifecycle);
    window.clearInterval(location);
    timers.forEach((timer) => clearTimeout(timer));
  };
}

export const SIMULATOR_IDS = {
  orderId: DEMO_ORDER,
  customerId: DEMO_CUSTOMER,
  partnerId: DEMO_PARTNER,
  riderId: DEMO_RIDER,
  city: CITY,
};
