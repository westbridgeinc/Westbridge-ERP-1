"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";

const FOCUSABLE =
  "button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])";

export type NotificationType = "success" | "error" | "info" | "default";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: NotificationType;
  read: boolean;
}

function dotColorClass(type: NotificationType): string {
  switch (type) {
    case "success":
      return "bg-emerald-500";
    case "error":
      return "bg-destructive";
    case "info":
      return "bg-primary";
    default:
      return "bg-muted-foreground/60";
  }
}

const NOTIFICATION_TABS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
];

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  loading?: boolean;
}

export function NotificationPanel({
  open,
  onClose,
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
  loading = false,
}: NotificationPanelProps) {
  const [tab, setTab] = useState("all");
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      previousActiveRef.current = document.activeElement as HTMLElement | null;
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
      if (previousActiveRef.current?.focus) previousActiveRef.current.focus();
    };
  }, [open, handleEscape]);

  useEffect(() => {
    if (open && panelRef.current) {
      const focusable = panelRef.current.querySelector<HTMLElement>(FOCUSABLE);
      if (focusable) focusable.focus();
    }
  }, [open]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusable = Array.from<HTMLElement>(panelRef.current.querySelectorAll(FOCUSABLE));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  const filtered =
    tab === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal
            aria-label="Notifications"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <h2 className="text-xl font-semibold text-foreground">
                Notifications
              </h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Tabs
              items={NOTIFICATION_TABS}
              activeId={tab}
              onChange={setTab}
              className="px-4"
            />

            <div className="flex-1 overflow-y-auto px-4 pb-6">
              {loading ? (
                <div className="mt-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Check className="h-6 w-6 text-emerald-500" />
                  </span>
                  <p className="mt-4 text-base font-medium text-foreground">
                    You&apos;re all caught up
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No new notifications
                  </p>
                </div>
              ) : (
                <ul className="mt-4 space-y-0">
                  {filtered.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => onMarkRead(n.id)}
                        className={`flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted ${!n.read ? "bg-muted" : ""}`}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColorClass(n.type)}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-foreground">
                            {n.title}
                          </p>
                          {n.description && (
                            <p className="mt-0.5 text-sm text-muted-foreground/60">
                              {n.description}
                            </p>
                          )}
                          <p className="mt-1 text-sm text-muted-foreground/60">
                            {n.time}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/erp/dashboard");
      if (!res.ok) {
        setNotifications([]);
        return;
      }
      const json = await res.json();
      const data = json?.data;
      const activity = Array.isArray(data?.activity) ? data.activity : [];
      const mapped: NotificationItem[] = activity.map(
        (a: { text?: string; time?: string; type?: NotificationType }, i: number) => ({
          id: `notif-${i}-${a.text ?? ""}`,
          title: String(a.text ?? "Activity"),
          description: "",
          time: String(a.time ?? ""),
          type: (a.type as NotificationType) ?? "default",
          read: false,
        })
      );
      setNotifications((prev) => {
        const byId = new Map(prev.map((n) => [n.id, n]));
        return mapped.map((m) => {
          const existing = byId.get(m.id);
          return existing ? { ...m, read: existing.read } : m;
        });
      });
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAllRead,
    markRead,
  };
}
