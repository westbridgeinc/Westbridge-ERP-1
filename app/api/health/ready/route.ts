/**
 * GET /api/health/ready — readiness probe.
 * Returns 200 only when all critical dependencies (DB + Redis) are reachable.
 * Used by Kubernetes/ECS readiness checks to gate traffic.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/data/prisma";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    (async () => {
      const r = getRedis();
      if (!r) throw new Error("Redis not configured");
      await r.ping();
    })(),
  ]);

  const [db, redis] = checks;
  const ready = db.status === "fulfilled" && redis.status === "fulfilled";

  return NextResponse.json(
    {
      ready,
      checks: {
        database: db.status === "fulfilled" ? "ok" : "error",
        redis: redis.status === "fulfilled" ? "ok" : "error",
      },
    },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
