import { NextResponse } from "next/server";
import { prisma } from "@/lib/data/prisma";
import { getRequestId } from "@/types/api";
import { apiSuccess } from "@/types/api";
import { securityHeaders } from "@/lib/security-headers";
import { getRedis } from "@/lib/redis";
import { getUptimeSeconds } from "@/lib/uptime";
import os from "os";
import packageJson from "../../../package.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CheckStatus = "healthy" | "degraded" | "unhealthy";
interface CheckResult {
  status: CheckStatus;
  latency_ms: number;
  message?: string;
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
    ]);
    const latency = Date.now() - start;
    return { status: latency > 1000 ? "degraded" : "healthy", latency_ms: latency };
  } catch (e) {
    return { status: "unhealthy", latency_ms: Date.now() - start, message: e instanceof Error ? e.message : "unreachable" };
  }
}

async function checkRedis(): Promise<CheckResult> {
  const redis = getRedis();
  if (!redis) return { status: "unhealthy", latency_ms: 0, message: "not configured" };
  const start = Date.now();
  try {
    await Promise.race([
      redis.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
    ]);
    const latency = Date.now() - start;
    return { status: latency > 500 ? "degraded" : "healthy", latency_ms: latency };
  } catch (e) {
    return { status: "unhealthy", latency_ms: Date.now() - start, message: e instanceof Error ? e.message : "unreachable" };
  }
}

async function checkErpNext(): Promise<CheckResult> {
  const url = process.env.ERPNEXT_URL ?? "http://localhost:8080";
  const start = Date.now();
  try {
    const res = await fetch(`${url}/api/method/ping`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - start;
    if (!res.ok) return { status: "degraded", latency_ms: latency, message: `HTTP ${res.status}` };
    if (latency > 1000) return { status: "degraded", latency_ms: latency, message: "slow response" };
    return { status: "healthy", latency_ms: latency };
  } catch (e) {
    return { status: "degraded", latency_ms: Date.now() - start, message: e instanceof Error ? e.message : "unreachable" };
  }
}

function checkMemory(): CheckResult {
  const total = os.totalmem();
  const free = os.freemem();
  const usedPercent = Math.round(((total - free) / total) * 100);
  return {
    status: usedPercent > 95 ? "unhealthy" : usedPercent > 85 ? "degraded" : "healthy",
    latency_ms: 0,
    message: `${usedPercent}% used`,
  };
}

function checkDisk(): CheckResult {
  try {
    const { statfsSync } = require("fs");
    const stat = statfsSync("/");
    const totalBytes = stat.blocks * stat.bsize;
    const freeBytes = stat.bfree * stat.bsize;
    const usedPercent = Math.round(((totalBytes - freeBytes) / totalBytes) * 100);
    return {
      status: usedPercent > 95 ? "unhealthy" : usedPercent > 85 ? "degraded" : "healthy",
      latency_ms: 0,
      message: `${usedPercent}% used`,
    };
  } catch {
    // statfsSync may not be available on all platforms
    return { status: "healthy", latency_ms: 0, message: "check unavailable" };
  }
}

/**
 * GET /api/health — comprehensive health check.
 */
export async function GET(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const hdrs = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms`, "Cache-Control": "no-store" });

  const [dbCheck, redisCheck, erpCheck] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkErpNext(),
  ]);
  const memCheck = checkMemory();
  const diskCheck = checkDisk();

  const checks = {
    database: dbCheck,
    redis: redisCheck,
    erpnext: erpCheck,
    memory: memCheck,
    disk: diskCheck,
  };

  // Database is critical; Redis is critical; ERPNext and system checks are non-critical
  const criticalOk = dbCheck.status !== "unhealthy" && redisCheck.status !== "unhealthy";
  const allOk = Object.values(checks).every((c) => c.status === "healthy");
  const overallStatus: CheckStatus = allOk ? "healthy" : criticalOk ? "degraded" : "unhealthy";
  const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

  const body = apiSuccess(
    {
      status: overallStatus,
      version: packageJson.version,
      uptime_seconds: getUptimeSeconds(),
      checks,
      timestamp: new Date().toISOString(),
    },
    { request_id: requestId }
  );
  return NextResponse.json(body, { status: httpStatus, headers: hdrs() });
}
