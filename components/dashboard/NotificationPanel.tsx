"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
import { useState, useCallback } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      return "bg-success";
    case "error":
      return "bg-destructive";
    case "info":
      return "bg-primary";
    default:
      return "bg-muted-foreground/60";
  }
}

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

  const filtered =
    tab === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full max-w-md flex-col p-0">
        <SheetHeader className="border-b px-4 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllRead}
                className="text-muted-foreground"
              >
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread
              {unreadCount > 0 && (
                <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-0">
            <ScrollArea className="h-[calc(100vh-10rem)]">
              {loading ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <Check className="size-6 text-success" />
                  </span>
                  <p className="mt-4 text-base font-medium text-foreground">
                    You&apos;re all caught up
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No new notifications
                  </p>
                </div>
              ) : (
                <ul className="space-y-0 py-2">
                  {filtered.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => onMarkRead(n.id)}
                        className={`flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent ${
                          !n.read ? "bg-accent/50" : ""
                        }`}
                      >
                        <span
                          className={`mt-1.5 size-2 shrink-0 rounded-full ${dotColorClass(n.type)}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {n.title}
                          </p>
                          {n.description && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {n.description}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {n.time}
                          </p>
                        </div>
                        {!n.read && (
                          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/erp/dashboard`, { credentials: "include" });
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
