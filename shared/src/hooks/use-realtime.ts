/**
 * React bindings for the QuickPress Socket.IO client (Phase 5 · Sprint 5.5).
 *
 * Every subscription here is cleaned up on unmount (memory-leak prevention),
 * rooms are ref-counted, and duplicate events are dropped inside the client
 * before a handler ever runs.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  connectionState,
  emitWithAck,
  joinRoom,
  onRealtimeEvent,
  reconnectRealtime,
  subscribeConnection,
  type ConnectionState,
} from "@backend/core/socket-client";
import type { AnyRealtimePayload } from "@backend/core/socket-events";

/** Live connection status (status, mode, joined rooms, reconnect attempts). */
export function useRealtimeConnection(): ConnectionState & { reconnect: () => void } {
  const [state, setState] = useState<ConnectionState>(() => connectionState());

  useEffect(() => subscribeConnection(setState), []);

  return useMemo(() => ({ ...state, reconnect: reconnectRealtime }), [state]);
}

/**
 * Subscribe to one or more realtime events. The handler is kept in a ref so
 * re-renders never re-subscribe (a classic listener leak).
 */
export function useRealtimeEvent(
  events: string | string[],
  handler: (payload: AnyRealtimePayload, event: string) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const list = Array.isArray(events) ? events : [events];
  const key = list.join("|");

  useEffect(() => {
    const names = key.split("|").filter(Boolean);
    const unsubscribers = names.map((name) =>
      onRealtimeEvent(name, (payload) => handlerRef.current(payload, name)),
    );
    return () => unsubscribers.forEach((off) => off());
  }, [key]);
}

/** Join rooms for the lifetime of the component. */
export function useRealtimeRoom(room: string | string[] | null | undefined): void {
  const list = Array.isArray(room) ? room : room ? [room] : [];
  const key = list.filter(Boolean).join("|");

  useEffect(() => {
    const names = key.split("|").filter(Boolean);
    const leavers = names.map((name) => joinRoom(name));
    return () => leavers.forEach((leave) => leave());
  }, [key]);
}

/** Emit a client→server event and await the server acknowledgement. */
export function useRealtimeEmit() {
  return useCallback(
    <T = unknown,>(event: string, payload: unknown) => emitWithAck<T>(event, payload),
    [],
  );
}
