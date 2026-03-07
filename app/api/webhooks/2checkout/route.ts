import { NextResponse } from "next/server";
import { checkTieredRateLimit, getClientIdentifier, rateLimitHeaders } from "@/lib/api/rate-limit-tiers";
import {
  verifyIPN,
  isPaymentSuccess,
  markAccountPaid,
} from "@/lib/services/billing.service";
import { logAudit, auditContext } from "@/lib/services/audit.service";
import { securityHeaders } from "@/lib/security-headers";
import { getRedis } from "@/lib/redis";
import { logger } from "@/lib/logger";

const WEBHOOK_IDEMPOTENCY_TTL_SEC = 24 * 60 * 60; // 24 hours

/** 2Checkout IPN source IP ranges (CIDR). */
const TWOCHECKOUT_IP_PREFIXES = [
  "86.105.46.",   // 86.105.46.0/24
  "195.65.26.",   // 195.65.26.0/24
  "195.242.",     // 195.242.0.0/16
];

function is2CheckoutIP(ip: string): boolean {
  const trimmed = ip.trim();
  return TWOCHECKOUT_IP_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

export async function POST(request: Request) {
  const start = Date.now();
  const headers = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });
  const ctx = auditContext(request);
  const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "";
  if (clientIP && !is2CheckoutIP(clientIP)) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Forbidden", { status: 403, headers: headers() });
    }
    logger.warn("2Checkout webhook from non-allowlisted IP (non-production)", { ip: clientIP });
  }
  const id = getClientIdentifier(request);
  const rateLimit = await checkTieredRateLimit(id, "anonymous", "/api/webhooks/2checkout");
  if (!rateLimit.allowed) {
    const systemAccountId = process.env.SYSTEM_ACCOUNT_ID;
    if (systemAccountId) {
      void logAudit({
        accountId: systemAccountId,
        action: "payment.webhook.rate_limited",
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        severity: "warn",
        outcome: "failure",
      });
    }
    return new NextResponse("Too Many Requests", { status: 429, headers: { ...headers(), ...rateLimitHeaders(rateLimit) } });
  }

  let paramsRecord: Record<string, string | undefined> = {};
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      paramsRecord = Object.fromEntries(new URLSearchParams(text)) as Record<string, string | undefined>;
    } else {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        paramsRecord[key] = typeof value === "string" ? value : undefined;
      });
    }
  } catch {
    return new NextResponse("Bad Request", { status: 400, headers: headers() });
  }

  if (!verifyIPN(paramsRecord)) {
    const systemAccountId = process.env.SYSTEM_ACCOUNT_ID;
    if (systemAccountId) {
      void logAudit({
        accountId: systemAccountId,
        action: "payment.webhook.invalid_signature",
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        severity: "critical",
        outcome: "failure",
      });
    }
    return new NextResponse("Invalid signature", { status: 401, headers: headers() });
  }

  if (!isPaymentSuccess(paramsRecord)) {
    return new NextResponse("OK", { status: 200, headers: headers() });
  }

  const refno = paramsRecord.REFNO ?? paramsRecord.ORDERNO ?? paramsRecord.ORDER_NUMBER ?? "";
  if (refno) {
    const redis = getRedis();
    if (redis) {
      const idempotencyKey = `webhook:2co:${refno}`;
      const set = await redis.set(idempotencyKey, "1", "EX", WEBHOOK_IDEMPOTENCY_TTL_SEC, "NX");
      if (set !== "OK") {
        return new NextResponse("OK", { status: 200, headers: headers() });
      }
    }
  }

  const accountId = paramsRecord.MERCHANT_ORDER_ID ?? paramsRecord.EXTERNAL_REFERENCE ?? paramsRecord.REFNO;
  if (!accountId) {
    return new NextResponse("OK", { status: 200, headers: headers() });
  }

  const result = await markAccountPaid(
    accountId,
    paramsRecord.ORDERNO ?? paramsRecord.ORDER_NUMBER,
    paramsRecord.CUSTOMER_REF
  );

  if (!result.ok) {
    const { logger } = await import("@/lib/logger");
    logger.error("2Checkout webhook markAccountPaid error", { error: result.error });
    return new NextResponse("Error", { status: 500, headers: headers() });
  }

  void logAudit({
    accountId,
    action: "payment.webhook.success",
    metadata: {
      orderNo: paramsRecord.ORDERNO ?? paramsRecord.ORDER_NUMBER,
      customerRef: paramsRecord.CUSTOMER_REF,
    },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    severity: "info",
    outcome: "success",
  });

  return new NextResponse("OK", { status: 200, headers: headers() });
}
