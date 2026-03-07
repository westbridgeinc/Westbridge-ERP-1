/**
 * POST /api/auth/change-password
 * Allows an authenticated user to change their own password.
 *
 * Body: { currentPassword: string, newPassword: string }
 *
 * Flow:
 *  1. Validate session.
 *  2. Verify current password against the stored hash.
 *  3. Apply new password via ERPNext (same call used by the reset-password flow).
 *  4. Update the stored hash in Prisma.
 *  5. Return 200 on success; 400/401 on failure.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/services/session.service";
import { prisma } from "@/lib/data/prisma";
import { validatePassword } from "@/lib/password-policy";
import { validateCsrf, CSRF_COOKIE_NAME } from "@/lib/csrf";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { securityHeaders } from "@/lib/security-headers";
import { checkTieredRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit-tiers";
import { COOKIE } from "@/lib/constants";
import { createHash, timingSafeEqual } from "crypto";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const hdrs = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });

  try {
    // CSRF
    const cookieStore = await cookies();
    const csrfCookie = cookieStore.get(CSRF_COOKIE_NAME)?.value;
    const csrfHeader = request.headers.get("x-csrf-token") ?? request.headers.get("X-CSRF-Token");
    if (!validateCsrf(csrfHeader, csrfCookie)) {
      return NextResponse.json(apiError("FORBIDDEN", "Invalid CSRF token", undefined, meta()), { status: 403, headers: hdrs() });
    }

    // Session
    const token = cookieStore.get(COOKIE.SESSION_NAME)?.value;
    if (!token) {
      return NextResponse.json(apiError("UNAUTHORIZED", "Not authenticated", undefined, meta()), { status: 401, headers: hdrs() });
    }
    const session = await validateSession(token, request);
    if (!session.ok) {
      return NextResponse.json(apiError("UNAUTHORIZED", session.error, undefined, meta()), { status: 401, headers: hdrs() });
    }

    const rateLimit = await checkTieredRateLimit(session.data.userId, "authenticated", "/api/auth/change-password");
    if (!rateLimit.allowed) {
      return NextResponse.json(apiError("RATE_LIMIT", "Too many attempts. Please wait before trying again.", undefined, meta()), { status: 429, headers: { ...hdrs(), ...rateLimitHeaders(rateLimit) } });
    }

    const body = await request.json().catch(() => null);
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(apiError("VALIDATION", "currentPassword and newPassword are required", undefined, meta()), { status: 400, headers: hdrs() });
    }

    // Validate new password policy
    const { valid, errors } = validatePassword(newPassword);
    if (!valid) {
      return NextResponse.json(apiError("VALIDATION", errors.join(". "), undefined, meta()), { status: 400, headers: hdrs() });
    }

    // Verify current password
    const user = await prisma.user.findUnique({
      where: { id: session.data.userId },
      select: { id: true, email: true, passwordHash: true },
    });
    if (!user) {
      return NextResponse.json(apiError("NOT_FOUND", "User not found", undefined, meta()), { status: 404, headers: hdrs() });
    }

    const currentHash = Buffer.from(hashPassword(currentPassword));
    const storedHash = Buffer.from(user.passwordHash ?? "");
    const match =
      currentHash.length === storedHash.length &&
      timingSafeEqual(currentHash, storedHash);
    if (!match) {
      return NextResponse.json(apiError("UNAUTHORIZED", "Current password is incorrect", undefined, meta()), { status: 401, headers: hdrs() });
    }

    // Update password in ERPNext
    const erpUrl = process.env.ERPNEXT_URL ?? "http://localhost:8080";
    const erpApiKey = process.env.ERPNEXT_API_KEY ?? "";
    const erpApiSecret = process.env.ERPNEXT_API_SECRET ?? "";
    const erpRes = await fetch(`${erpUrl}/api/method/frappe.core.doctype.user.user.update_password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(erpApiKey && erpApiSecret ? { Authorization: `token ${erpApiKey}:${erpApiSecret}` } : {}),
      },
      body: JSON.stringify({ new_password: newPassword, logout_all_sessions: 0, user: user.email }),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null);

    // ERPNext unavailable is non-fatal — still update our DB hash
    if (erpRes && !erpRes.ok) {
      const text = await erpRes.text().catch(() => "");
      Sentry.captureMessage("change-password: ERPNext update failed", { extra: { status: erpRes.status, body: text } });
    }

    // Update hash and revoke all other sessions (keep current session only)
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(newPassword) },
      }),
      prisma.session.deleteMany({
        where: { userId: user.id, token: { not: tokenHash } },
      }),
    ]);

    return NextResponse.json(apiSuccess({ message: "Password updated successfully" }, meta()), { headers: hdrs() });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(apiError("INTERNAL", "An unexpected error occurred", undefined, meta()), { status: 500, headers: hdrs() });
  }
}
