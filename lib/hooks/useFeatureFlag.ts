"use client";

/**
 * React hook to evaluate a feature flag client-side.
 * Fetches from /api/admin/flags on mount; returns defaultValue while loading.
 * Subscribes to the SSE stream and invalidates the cache on `feature_flag.updated`
 * events so flag changes propagate to connected clients without a page reload.
 *
 * @example
 * const showNewNav = useFeatureFlag("new_dashboard_nav", false);
 */
import { useState, useEffect, useCallback } from "react";
import type { FlagValue } from "@/lib/feature-flags.types";

// Module-level cache shared across all hook instances in a session.
// Invalidated via SSE when an admin updates a flag (TD-04).
const _cache = new Map<string, FlagValue>();

let _sseController: AbortController | null = null;
let _sseListeners = 0;

function ensureSseSubscription(onInvalidate: (key: string) => void): () => void {
  _sseListeners++;

  if (!_sseController) {
    _sseController = new AbortController();
    const ctrl = _sseController;

    (async () => {
      try {
        const res = await fetch("/api/events/stream", { signal: ctrl.signal });
        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";
          for (const chunk of lines) {
            const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "));
            if (!dataLine) continue;
            try {
              const event = JSON.parse(dataLine.slice(6)) as { type: string; payload?: { key?: string } };
              if (event.type === "flag.updated") {
                const flagKey = event.payload?.key;
                if (flagKey) {
                  _cache.delete(flagKey);
                  onInvalidate(flagKey);
                } else {
                  // Full cache bust when key is unknown
                  _cache.clear();
                  onInvalidate("*");
                }
              }
            } catch {
              // non-JSON SSE heartbeat, ignore
            }
          }
        }
      } catch {
        // AbortError on cleanup or network issue — reconnect handled by next mount
        _sseController = null;
      }
    })();
  }

  return () => {
    _sseListeners--;
    if (_sseListeners <= 0 && _sseController) {
      _sseController.abort();
      _sseController = null;
      _sseListeners = 0;
    }
  };
}

export function useFeatureFlag(key: string, defaultValue: FlagValue = false): FlagValue {
  const [value, setValue] = useState<FlagValue>(() => _cache.get(key) ?? defaultValue);

  const fetchFlags = useCallback(() => {
    fetch(`/api/admin/flags`)
      .then((r) => r.json())
      .then((d: { data?: Array<{ key: string; defaultValue: FlagValue }> }) => {
        if (!Array.isArray(d.data)) return;
        for (const flag of d.data) {
          _cache.set(flag.key, flag.defaultValue);
        }
        const found = _cache.get(key);
        if (found !== undefined) setValue(found);
      })
      .catch(() => {});
  }, [key]);

  useEffect(() => {
    if (!_cache.has(key)) {
      fetchFlags();
    }

    // Subscribe to SSE invalidation signals
    const cleanup = ensureSseSubscription((invalidatedKey) => {
      if (invalidatedKey === "*" || invalidatedKey === key) {
        fetchFlags();
      }
    });

    return cleanup;
  }, [key, fetchFlags]);

  return value;
}
