/**
 * POST /api/analytics/vitals
 * Receives Core Web Vitals from reportWebVitals() in lib/analytics/web-vitals.ts.
 * Also called via navigator.sendBeacon (text/plain body).
 *
 * Stored in a Redis sorted set keyed by timestamp so we can query recents.
 * TTL: 7 days.
 *
 * TODO: export to Grafana/DataDog once we have a metrics dashboard.
 *       For now, query with: ZRANGE analytics:vitals:LCP -inf +inf BYSCORE LIMIT 0 100
 */
import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import { getClientIdentifier, checkTieredRateLimit } from "@/lib/api/rate-limit-tiers";

export const dynamic = "force-dynamic";

const VITALS_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const identifier = getClientIdentifier(request);
  const { allowed } = await checkTieredRateLimit(identifier, "anonymous", "/api/analytics/vitals");
  if (!allowed) {
    return new NextResponse(null, { status: 204 });
  }

  const redis = getRedis();
  if (redis) {
    try {
      const metricName = typeof body.name === "string" ? body.name : "UNKNOWN";
      const key = `analytics:vitals:${metricName}`;
      const score = Date.now();
      const member = JSON.stringify({
        value: body.value,
        rating: body.rating,
        url: body.url,
        ts: body.timestamp ?? new Date().toISOString(),
      });

      const pipeline = redis.pipeline();
      pipeline.zadd(key, score, member);
      // Keep at most 10k entries per metric type
      pipeline.zremrangebyrank(key, 0, -10001);
      pipeline.expire(key, VITALS_TTL_SECONDS);
      await pipeline.exec();
    } catch {
      // Non-critical
    }
  }

  return new NextResponse(null, { status: 204 });
}
