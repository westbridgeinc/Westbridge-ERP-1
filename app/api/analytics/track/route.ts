/**
 * POST /api/analytics/track
 * Receives product analytics events from the client-side tracker.
 * Called via navigator.sendBeacon so the body arrives as text/plain.
 *
 * No auth required — events are tied to accountId from the client payload.
 * Rate limited to prevent abuse.
 *
 * TODO: pipe these into a proper analytics warehouse (Posthog, Mixpanel, or
 *       a self-hosted ClickHouse table) once we hit meaningful volume.
 *       Redis list works fine for now at our scale.
 */
import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import { getClientIdentifier, checkTieredRateLimit } from "@/lib/api/rate-limit-tiers";

export const dynamic = "force-dynamic";

const EVENT_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const MAX_EVENTS_PER_ACCOUNT = 500;

export async function POST(request: Request) {
  // sendBeacon sends as text/plain — JSON.parse manually
  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const identifier = getClientIdentifier(request);
  const { allowed } = await checkTieredRateLimit(identifier, "anonymous", "/api/analytics/track");
  if (!allowed) {
    return new NextResponse(null, { status: 204 }); // silently drop, don't error
  }

  const redis = getRedis();
  if (redis) {
    try {
      const accountId = typeof body.accountId === "string" ? body.accountId : "anonymous";
      const key = `analytics:events:${accountId}`;
      const event = JSON.stringify({ ...body, receivedAt: new Date().toISOString() });

      const pipeline = redis.pipeline();
      pipeline.lpush(key, event);
      pipeline.ltrim(key, 0, MAX_EVENTS_PER_ACCOUNT - 1);
      pipeline.expire(key, EVENT_TTL_SECONDS);
      await pipeline.exec();
    } catch {
      // Non-critical — analytics should never error the caller
    }
  }

  return new NextResponse(null, { status: 204 });
}
