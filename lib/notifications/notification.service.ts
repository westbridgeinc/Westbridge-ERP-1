/**
 * In-app notification service.
 * Notifications are stored in Redis with a 30-day TTL.
 * Real-time delivery is via the SSE stream (publish to realtime channel).
 */
import { getRedis } from "@/lib/redis";
import { publish } from "@/lib/realtime";
import { logger } from "@/lib/logger";
import { randomBytes } from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "invoice.paid"
  | "invoice.overdue"
  | "user.joined"
  | "erp.sync_complete"
  | "erp.sync_failed"
  | "subscription.expiring"
  | "security.new_login"
  | "security.failed_attempts"
  | "webhook_circuit_breaker"
  | "report_ready";

export interface Notification {
  id: string;
  accountId: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const NOTIF_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const MAX_NOTIFICATIONS = 100;

function listKey(accountId: string): string {
  return `notif:list:${accountId}`;
}

function itemKey(id: string): string {
  return `notif:item:${id}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Create and store a notification; deliver in real-time via SSE. */
export async function createNotification(
  notification: Omit<Notification, "id" | "read" | "createdAt">
): Promise<Notification> {
  const id = randomBytes(12).toString("hex");
  const full: Notification = {
    ...notification,
    id,
    read: false,
    createdAt: new Date().toISOString(),
  };

  const redis = getRedis();
  if (redis) {
    try {
      const pipeline = redis.pipeline();
      pipeline.set(itemKey(id), JSON.stringify(full), "EX", NOTIF_TTL_SECONDS);
      pipeline.lpush(listKey(notification.accountId), id);
      pipeline.ltrim(listKey(notification.accountId), 0, MAX_NOTIFICATIONS - 1);
      await pipeline.exec();
    } catch (e) {
      logger.warn("notification.store_failed", { error: e instanceof Error ? e.message : String(e) });
    }
  }

  // Push real-time delivery
  await publish(notification.accountId, {
    type: "notification",
    payload: full as unknown as Record<string, unknown>,
    timestamp: full.createdAt,
  });

  return full;
}

/** Get all notifications for an account (newest first). */
export async function getNotifications(accountId: string): Promise<Notification[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    const ids = await redis.lrange(listKey(accountId), 0, MAX_NOTIFICATIONS - 1);
    if (ids.length === 0) return [];
    const raw = await redis.mget(...ids.map(itemKey));
    return raw
      .filter((r): r is string => r !== null)
      .map((r) => JSON.parse(r) as Notification);
  } catch {
    return [];
  }
}

/** Get unread notification count. */
export async function getUnreadCount(accountId: string): Promise<number> {
  const all = await getNotifications(accountId);
  return all.filter((n) => !n.read).length;
}

/** Mark a notification as read. */
export async function markAsRead(id: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const raw = await redis.get(itemKey(id));
  if (!raw) return;
  const notif = JSON.parse(raw) as Notification;
  notif.read = true;
  await redis.set(itemKey(id), JSON.stringify(notif), "KEEPTTL");
}

/** Mark all notifications for an account as read. */
export async function markAllRead(accountId: string): Promise<void> {
  const notifs = await getNotifications(accountId);
  await Promise.all(notifs.filter((n) => !n.read).map((n) => markAsRead(n.id)));
}

/**
 * Convenience wrapper that maps a flexible payload to the Notification schema.
 * `body` maps to `message`. `severity` is metadata only (not stored separately).
 */
export async function sendNotification(payload: {
  accountId: string;
  userId?: string;
  type: NotificationType;
  title: string;
  body: string;
  severity?: "info" | "warn" | "error";
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await createNotification({
    accountId: payload.accountId,
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.body,
  });
}
