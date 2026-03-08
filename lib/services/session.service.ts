/**
 * Session service: create, validate, revoke. Tokens are hashed (SHA-256) before storage.
 */

import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/data/prisma";
import type { Result } from "@/lib/utils/result";
import { ok, err } from "@/lib/utils/result";
import { logAudit, auditContext } from "@/lib/services/audit.service";
import { reportSecurityEvent } from "@/lib/security-monitor";
import { encrypt, decrypt } from "@/lib/encryption";
import { getRedis } from "@/lib/redis";

const SESSION_EXPIRY_DAYS = 7;
const IDLE_TIMEOUT_MINUTES = 30;
const MAX_CONCURRENT_SESSIONS = 5;
const SESSION_CACHE_TTL_SEC = 5;
const SESSION_CACHE_PREFIX = "session:v1:";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0]?.trim() ?? null : null;
}

function getUserAgent(request: Request): string | null {
  return request.headers.get("user-agent") ?? null;
}

function fingerprintFromRequest(request: Request): string | null {
  const ua = getUserAgent(request);
  if (!ua) return null;
  const ip = getIp(request);
  const prefix = ip ? ip.split(".").slice(0, 3).join(".") : "";
  return createHash("sha256").update(`${ua}|${prefix}`, "utf8").digest("hex");
}

/**
 * Create a new session for the user. Returns the raw token (to set in cookie); only hash is stored.
 * Enforces max concurrent sessions by revoking the oldest if count >= 5.
 */
export async function createSession(
  userId: string,
  request: Request,
  erpnextSid?: string | null
): Promise<Result<{ token: string; expiresAt: Date }, string>> {
  const raw = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const fingerprint = fingerprintFromRequest(request);

  try {
    const now = new Date();
    const activeSessions = await prisma.session.findMany({
      where: { userId, expiresAt: { gt: now } },
      orderBy: { lastActiveAt: "asc" },
    });
    if (activeSessions.length >= MAX_CONCURRENT_SESSIONS) {
      const oldest = activeSessions[0];
      await prisma.session.delete({ where: { id: oldest.id } }).catch(() => {});
      const user = await prisma.user.findUnique({ where: { id: userId }, include: { account: true } }).catch(() => null);
      if (user) {
        const ctx = auditContext(request);
        void logAudit({
          accountId: user.accountId,
          userId: user.id,
          action: "auth.session.revoked_oldest",
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          severity: "info",
          outcome: "success",
        });
      }
    }
    const encryptedSid = erpnextSid ? encrypt(erpnextSid) : undefined;
    await prisma.session.create({
      data: {
        userId,
        token: tokenHash,
        erpnextSid: encryptedSid,
        ipAddress: getIp(request),
        userAgent: getUserAgent(request),
        fingerprint: fingerprint ?? undefined,
        expiresAt,
      },
    });
    return ok({ token: raw, expiresAt });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to create session");
  }
}

export type SessionRole = "owner" | "admin" | "manager" | "member" | "viewer";

/**
 * Validate session token. Returns userId, accountId, role; optionally erpnextSid for ERP proxy.
 * If request is provided and session has a fingerprint, validates User-Agent matches (session binding).
 * Deletes expired sessions on miss.
 */
export async function validateSession(
  token: string,
  request?: Request
): Promise<Result<{ userId: string; accountId: string; role: SessionRole; erpnextSid?: string | null }, string>> {
  if (!token?.trim()) return err("Missing token");
  const tokenHash = hashToken(token);

  try {
    const cacheKey = `${SESSION_CACHE_PREFIX}${tokenHash}`;
    const redis = getRedis();
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as { userId: string; accountId: string; role: string; erpnextSid?: string | null };
          const role = ((parsed.role === "owner" || parsed.role === "admin" || parsed.role === "manager" || parsed.role === "member" || parsed.role === "viewer") ? parsed.role : "member") as SessionRole;
          return ok({ userId: parsed.userId, accountId: parsed.accountId, role, erpnextSid: parsed.erpnextSid ?? undefined });
        }
      } catch {
        // fall through to DB
      }
    }

    const session = await prisma.session.findUnique({
      where: { token: tokenHash },
      include: { user: { include: { account: true } } },
    });
    if (!session) {
      return err("Invalid session");
    }
    const now = new Date();
    if (session.expiresAt <= now) {
      if (request) {
        const ctx = auditContext(request);
        void logAudit({
          accountId: session.user.accountId,
          userId: session.userId,
          action: "auth.session.expired",
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          severity: "info",
          outcome: "failure",
        });
      }
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return err("Session expired");
    }
    const idleCutoff = new Date(now.getTime() - IDLE_TIMEOUT_MINUTES * 60 * 1000);
    const lastActive = "lastActiveAt" in session && session.lastActiveAt ? session.lastActiveAt : session.createdAt;
    if (lastActive < idleCutoff) {
      if (request) {
        const ctx = auditContext(request);
        void logAudit({
          accountId: session.user.accountId,
          userId: session.userId,
          action: "auth.session.idle_timeout",
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          severity: "info",
          outcome: "failure",
        });
      }
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return err("Session expired");
    }
    if (session.fingerprint != null && request != null) {
      const currentFingerprint = fingerprintFromRequest(request);
      if (currentFingerprint == null || currentFingerprint !== session.fingerprint) {
        const ctx = auditContext(request);
        reportSecurityEvent({
          type: "session_hijack",
          userId: session.userId,
          accountId: session.user.accountId,
          ipAddress: ctx.ipAddress,
          details: "Session fingerprint mismatch (User-Agent)",
        });
        return err("Invalid session");
      }
    }
    const ACTIVE_UPDATE_INTERVAL_MS = 60_000;
    const lastActiveTs = session.lastActiveAt ?? session.createdAt;
    const shouldUpdate = now.getTime() - lastActiveTs.getTime() > ACTIVE_UPDATE_INTERVAL_MS;
    if (shouldUpdate) {
      await prisma.session.update({
        where: { id: session.id },
        data: { lastActiveAt: now },
      });
    }
    const role = ((session.user.role === "owner" || session.user.role === "admin" || session.user.role === "manager" || session.user.role === "member" || session.user.role === "viewer")
      ? session.user.role
      : "member") as SessionRole;
    const erpnextSid = session.erpnextSid ? (() => { try { return decrypt(session.erpnextSid); } catch { return undefined; } })() : undefined;
    const result = { userId: session.userId, accountId: session.user.accountId, role, erpnextSid };
    const redisForWrite = getRedis();
    if (redisForWrite) {
      try {
        await redisForWrite.set(cacheKey, JSON.stringify(result), "EX", SESSION_CACHE_TTL_SEC);
      } catch {
        // fall through — don't fail auth if cache write fails
      }
    }
    return ok(result);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Session validation failed");
  }
}

export async function deleteExpiredSessions(): Promise<void> {
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
}

/**
 * Revoke a session by token (e.g. on logout).
 */
export async function revokeSession(token: string): Promise<Result<{ revoked: boolean }, string>> {
  if (!token?.trim()) return ok({ revoked: false });
  const tokenHash = hashToken(token);
  try {
    const deleted = await prisma.session.deleteMany({ where: { token: tokenHash } });
    try {
      const redis = getRedis();
      if (redis) await redis.del(`${SESSION_CACHE_PREFIX}${tokenHash}`);
    } catch {
      // cache invalidation best-effort
    }
    return ok({ revoked: deleted.count > 0 });
  } catch {
    return ok({ revoked: false });
  }
}

/**
 * Revoke all sessions for a user (e.g. security action).
 * Redis session cache will expire naturally within 5s after bulk revoke.
 */
export async function revokeAllUserSessions(userId: string): Promise<Result<{ count: number }, string>> {
  try {
    const result = await prisma.session.deleteMany({ where: { userId } });
    return ok({ count: result.count });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to revoke sessions");
  }
}
