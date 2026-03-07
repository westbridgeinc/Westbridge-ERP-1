"use client";

/**
 * React hook for subscribing to real-time server-sent events.
 *
 * @example
 * useRealtimeEvents({
 *   onEvent: (event) => {
 *     if (event.type === 'invoice.created') refetchInvoices();
 *   },
 * });
 */
import { useEffect, useRef } from "react";

export interface RealtimeEventPayload {
  type: string;
  payload: Record<string, unknown>;
}

export interface UseRealtimeEventsOptions {
  onEvent: (event: RealtimeEventPayload) => void;
  onConnect?: () => void;
  onError?: (error: Event) => void;
  enabled?: boolean;
}

export function useRealtimeEvents({
  onEvent,
  onConnect,
  onError,
  enabled = true,
}: UseRealtimeEventsOptions) {
  const onEventRef = useRef(onEvent);
  const onConnectRef = useRef(onConnect);
  const onErrorRef = useRef(onError);

  // Keep refs up to date without causing reconnects
  onEventRef.current = onEvent;
  onConnectRef.current = onConnect;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!enabled) return;

    let es: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let retries = 0;

    function connect() {
      es = new EventSource("/api/events/stream");

      es.onopen = () => {
        retries = 0;
        onConnectRef.current?.();
      };

      es.onmessage = (ev) => {
        try {
          onEventRef.current({ type: "message", payload: JSON.parse(ev.data) });
        } catch { /* ignore malformed */ }
      };

      es.addEventListener("invoice.created", (ev) => {
        onEventRef.current({ type: "invoice.created", payload: JSON.parse((ev as MessageEvent).data) });
      });

      es.addEventListener("invoice.paid", (ev) => {
        onEventRef.current({ type: "invoice.paid", payload: JSON.parse((ev as MessageEvent).data) });
      });

      es.addEventListener("notification", (ev) => {
        onEventRef.current({ type: "notification", payload: JSON.parse((ev as MessageEvent).data) });
      });

      es.onerror = (err) => {
        onErrorRef.current?.(err);
        es?.close();
        // Exponential backoff with jitter, max 30s
        const delay = Math.min(1000 * 2 ** retries + Math.random() * 1000, 30_000);
        retries++;
        retryTimeout = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      retryTimeout && clearTimeout(retryTimeout);
      es?.close();
    };
  }, [enabled]);
}
