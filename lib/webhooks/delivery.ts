/**
 * Outgoing webhook delivery system.
 * - HMAC-SHA256 signed payloads (customer verifies signature)
 * - Retry with exponential backoff (1min → 5min → 30min → 2hr → 24hr)
 * - Circuit breaker: persisted in DB (survives restarts). Disables after
 *   CIRCUIT_BREAKER_THRESHOLD consecutive failures, notifies account owner.
 * - Delivery logs stored in Redis (7-day TTL)
 */
import { createHmac, randomBytes } from "crypto";
import { getRedis } from "@/lib/redis";
import { prisma } from "@/lib/data/prisma";
import { logger } from "@/lib/logger";
import { encrypt, decrypt } from "@/lib/encryption";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WebhookEndpoint {
  id: string;
  accountId: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  consecutiveFailures: number;
  disabledAt?: Date | null;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  event: string;
  payload: Record<string, unknown>;
  status: "pending" | "success" | "failed";
  attempts: number;
  lastAttemptAt?: string;
  responseStatus?: number;
  errorMessage?: string;
}

// ─── Retry schedule (delays in ms) ───────────────────────────────────────────

export const RETRY_DELAYS_MS = [
  60_000,
  5 * 60_000,
  30 * 60_000,
  2 * 60 * 60_000,
  24 * 60 * 60_000,
];

export const CIRCUIT_BREAKER_THRESHOLD = 10;

// ─── HMAC signing ─────────────────────────────────────────────────────────────

export function signPayload(secret: string, body: string, timestamp: number): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
}

export function buildSignatureHeader(secret: string, body: string): { signature: string; timestamp: number } {
  const timestamp = Date.now();
  const signature = signPayload(secret, body, timestamp);
  return { signature, timestamp };
}

/** Encrypt webhook secret before storing in DB. Use when creating or updating WebhookEndpoint. */
export function encryptWebhookSecret(plainSecret: string): string {
  return encrypt(plainSecret);
}

/** Decrypt webhook secret read from DB for signature validation. */
function decryptWebhookSecret(encryptedSecret: string): string {
  return decrypt(encryptedSecret);
}

// ─── Circuit breaker (DB + Redis: durable + fast reads) ───────────────────────

const CIRCUIT_CACHE_PREFIX = "webhook:circuit:";
const CIRCUIT_CACHE_TTL = 7 * 24 * 60 * 60; // 7 days

export interface CircuitState {
  failureCount: number;
  circuitOpenedAt: number | null;
}

async function getCircuitStateFromDb(endpointId: string): Promise<CircuitState | null> {
  const row = await prisma.webhookEndpoint.findUnique({
    where: { id: endpointId },
    select: { consecutiveFailures: true, disabledAt: true },
  });
  if (!row) return null;
  return {
    failureCount: row.consecutiveFailures,
    circuitOpenedAt: row.disabledAt ? row.disabledAt.getTime() : null,
  };
}

async function getCircuitStateFromRedis(endpointId: string): Promise<CircuitState | null> {
  const redis = getRedis();
  if (!redis) return null;
  const raw = await redis.get(`${CIRCUIT_CACHE_PREFIX}${endpointId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CircuitState;
  } catch {
    return null;
  }
}

/**
 * Get circuit breaker state: Redis first (fast), DB fallback (durable after Redis flush).
 */
export async function getCircuitState(endpointId: string): Promise<CircuitState | null> {
  const fromRedis = await getCircuitStateFromRedis(endpointId);
  if (fromRedis !== null) return fromRedis;
  const fromDb = await getCircuitStateFromDb(endpointId);
  if (fromDb !== null) {
    const redis = getRedis();
    if (redis) {
      await redis.set(
        `${CIRCUIT_CACHE_PREFIX}${endpointId}`,
        JSON.stringify(fromDb),
        "EX",
        CIRCUIT_CACHE_TTL
      );
    }
  }
  return fromDb;
}

async function setCircuitStateInRedis(endpointId: string, state: CircuitState): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(
    `${CIRCUIT_CACHE_PREFIX}${endpointId}`,
    JSON.stringify(state),
    "EX",
    CIRCUIT_CACHE_TTL
  );
}

/**
 * Record a failed delivery attempt. Increments consecutiveFailures in DB and Redis.
 * Trips the circuit breaker (sets disabledAt) at CIRCUIT_BREAKER_THRESHOLD.
 * Returns true if the circuit was just tripped this call.
 */
export async function recordFailure(endpointId: string, accountId: string): Promise<boolean> {
  const updated = await prisma.webhookEndpoint.update({
    where: { id: endpointId },
    data: { consecutiveFailures: { increment: 1 } },
    select: { consecutiveFailures: true, disabledAt: true },
  });

  const state: CircuitState = {
    failureCount: updated.consecutiveFailures,
    circuitOpenedAt: updated.disabledAt ? updated.disabledAt.getTime() : null,
  };
  await setCircuitStateInRedis(endpointId, state);

  if (updated.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD && !updated.disabledAt) {
    const disabledAt = new Date();
    await prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: { disabledAt },
    });
    await setCircuitStateInRedis(endpointId, {
      failureCount: updated.consecutiveFailures,
      circuitOpenedAt: disabledAt.getTime(),
    });
    logger.warn("Webhook circuit breaker tripped", { endpointId, accountId, failures: updated.consecutiveFailures });

    notifyCircuitBreakerTripped(endpointId, accountId).catch(() => {});

    return true;
  }
  return false;
}

/**
 * Record a successful delivery. Resets consecutiveFailures to 0 in DB and Redis.
 */
export async function recordSuccess(endpointId: string): Promise<void> {
  await prisma.webhookEndpoint.update({
    where: { id: endpointId },
    data: { consecutiveFailures: 0 },
  });
  await setCircuitStateInRedis(endpointId, { failureCount: 0, circuitOpenedAt: null });
}

async function notifyCircuitBreakerTripped(endpointId: string, accountId: string): Promise<void> {
  const { sendNotification } = await import("@/lib/notifications/notification.service");
  await sendNotification({
    accountId,
    type: "webhook_circuit_breaker",
    title: "Webhook endpoint disabled",
    body: `Webhook endpoint ${endpointId} has been disabled after ${CIRCUIT_BREAKER_THRESHOLD} consecutive failures. Re-enable it from the settings page once the issue is resolved.`,
    severity: "error",
  });
}

// ─── Delivery attempt ─────────────────────────────────────────────────────────

export async function attemptDelivery(
  endpoint: WebhookEndpoint,
  delivery: WebhookDelivery
): Promise<{ success: boolean; status?: number; error?: string }> {
  // Circuit state is in DB (and mirrored to Redis for durability). Read from DB so
  // admin re-enable takes effect immediately; getCircuitState(Redis then DB) used elsewhere.
  const dbEndpoint = await prisma.webhookEndpoint.findUnique({
    where: { id: endpoint.id },
    select: { disabledAt: true, enabled: true },
  });

  if (!dbEndpoint?.enabled || dbEndpoint.disabledAt) {
    logger.warn("Webhook delivery skipped: endpoint disabled", {
      endpointId: endpoint.id,
      disabledAt: dbEndpoint?.disabledAt,
    });
    return { success: false, error: "Endpoint is disabled (circuit breaker open)" };
  }

  const body = JSON.stringify({
    id: delivery.id,
    event: delivery.event,
    timestamp: new Date().toISOString(),
    data: delivery.payload,
  });

  let plainSecret: string;
  try {
    plainSecret = decryptWebhookSecret(endpoint.secret);
  } catch {
    logger.warn("Webhook delivery: failed to decrypt endpoint secret", { endpointId: endpoint.id });
    return { success: false, error: "Invalid endpoint secret" };
  }
  const { signature, timestamp } = buildSignatureHeader(plainSecret, body);

  try {
    const res = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Westbridge-Signature": signature,
        "X-Westbridge-Timestamp": String(timestamp),
        "X-Westbridge-Event": delivery.event,
        "X-Westbridge-Delivery": delivery.id,
      },
      body,
      signal: AbortSignal.timeout(30_000),
    });

    logger.info("Webhook delivery attempt", {
      deliveryId: delivery.id,
      endpointId: endpoint.id,
      status: res.status,
      attempt: delivery.attempts,
    });

    if (res.ok) {
      await recordSuccess(endpoint.id);
    } else {
      await recordFailure(endpoint.id, endpoint.accountId);
    }

    return { success: res.ok, status: res.status };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    logger.warn("Webhook delivery failed", { deliveryId: delivery.id, error });
    await recordFailure(endpoint.id, endpoint.accountId);
    return { success: false, error };
  }
}

// ─── Delivery log ─────────────────────────────────────────────────────────────

const DELIVERY_LOG_TTL = 7 * 24 * 60 * 60;

export async function logDelivery(delivery: WebhookDelivery): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const key = `webhook:delivery:${delivery.id}`;
  await redis.set(key, JSON.stringify(delivery), "EX", DELIVERY_LOG_TTL);
}

export async function getDeliveryLog(deliveryId: string): Promise<WebhookDelivery | null> {
  const redis = getRedis();
  if (!redis) return null;
  const raw = await redis.get(`webhook:delivery:${deliveryId}`);
  if (!raw) return null;
  return JSON.parse(raw) as WebhookDelivery;
}

// ─── New delivery ─────────────────────────────────────────────────────────────

export function createDelivery(
  endpointId: string,
  event: string,
  payload: Record<string, unknown>
): WebhookDelivery {
  return {
    id: randomBytes(12).toString("hex"),
    endpointId,
    event,
    payload,
    status: "pending",
    attempts: 0,
  };
}
