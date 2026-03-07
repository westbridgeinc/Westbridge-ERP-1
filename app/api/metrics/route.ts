/**
 * GET /api/metrics — Prometheus metrics scrape endpoint.
 * MUST be protected: only allow requests from internal scraper IPs or with bearer token.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const METRICS_TOKEN = process.env.METRICS_TOKEN;

export async function GET(request: Request) {
  // IP-based or token-based protection
  if (METRICS_TOKEN) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${METRICS_TOKEN}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  } else {
    // If no token configured, only allow from loopback/private ranges
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? "";
    const isInternal =
      ip.startsWith("127.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.16.") ||
      ip.startsWith("192.168.") ||
      ip === "::1" ||
      ip === "";
    if (!isInternal) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const { registry } = await import("@/lib/metrics");
  const metrics = await registry.metrics();

  return new NextResponse(metrics, {
    status: 200,
    headers: {
      "Content-Type": registry.contentType,
      "Cache-Control": "no-store",
    },
  });
}
