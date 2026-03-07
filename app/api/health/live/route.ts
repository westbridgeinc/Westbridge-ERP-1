/**
 * GET /api/health/live — liveness probe.
 * Returns 200 as long as the Node.js process is alive and responsive.
 * Used by Kubernetes/ECS to determine if the container should be restarted.
 */
import { NextResponse } from "next/server";
import { getUptimeSeconds } from "@/lib/uptime";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { alive: true, uptime_seconds: getUptimeSeconds() },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
