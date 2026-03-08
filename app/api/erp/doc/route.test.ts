import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextResponse } from "next/server";
import { COOKIE } from "@/lib/constants";

// Mock withPermission directly so we control what it returns without needing
// the full session/cookie/RBAC stack in unit tests
const withPermissionMock = vi.fn();
vi.mock("@/lib/api/middleware", () => ({
  withPermission: (...args: unknown[]) => withPermissionMock(...args),
}));

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => (name === COOKIE.SESSION_NAME ? { value: "session-token" } : undefined),
    }),
}));
vi.mock("@/lib/services/erp.service", () => ({ getDoc: vi.fn(), createDoc: vi.fn() }));
vi.mock("@/lib/services/audit.service", () => ({ logAudit: vi.fn(), auditContext: () => ({ ipAddress: "127.0.0.1", userAgent: "test" }) }));
vi.mock("@/lib/security-monitor", () => ({ reportSecurityEvent: vi.fn() }));
vi.mock("@/lib/csrf", () => ({ validateCsrf: vi.fn(() => true), CSRF_COOKIE_NAME: "westbridge_csrf" }));
vi.mock("@/lib/api/rate-limit-tiers", () => ({
  checkTieredRateLimit: () => Promise.resolve({ allowed: true }),
  getClientIdentifier: () => "id",
  rateLimitHeaders: () => ({}),
}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

describe("POST /api/erp/doc", () => {
  beforeEach(() => {
    withPermissionMock.mockReset();
  });

  it("returns 403 when permission is denied (viewer role lacks invoices:write)", async () => {
    // Simulate withPermission denying access — returns a 403 response
    withPermissionMock.mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
        { status: 403 }
      ),
    });
    const request = new Request("http://localhost/api/erp/doc", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": "x" },
      body: JSON.stringify({ doctype: "Sales Invoice" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error?.code).toBe("FORBIDDEN");
    expect(json.error?.message).toBe("Insufficient permissions");
  });

  it("returns 401 when permission check returns unauthorized", async () => {
    withPermissionMock.mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      ),
    });
    const request = new Request("http://localhost/api/erp/doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctype: "Sales Invoice" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
