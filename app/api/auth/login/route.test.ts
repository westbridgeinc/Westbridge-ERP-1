import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import * as csrf from "@/lib/csrf";

const loginMock = vi.fn();
const createSessionMock = vi.fn();
vi.mock("@/lib/services/auth.service", () => ({ login: (...args: unknown[]) => loginMock(...args) }));
vi.mock("@/lib/services/session.service", () => ({ createSession: (...args: unknown[]) => createSessionMock(...args) }));
vi.mock("@/lib/data/prisma", () => ({
  prisma: {
    account: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn() },
    user: { findUnique: vi.fn(), create: vi.fn(), count: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("@/lib/ratelimit", () => ({ checkRateLimit: () => Promise.resolve({ allowed: true }), getClientIdentifier: () => "id" }));
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => (name === "westbridge_csrf" ? { value: "csrf-token" } : undefined),
    }),
}));
vi.mock("@/lib/csrf", () => ({ validateCsrf: vi.fn(() => true), CSRF_COOKIE_NAME: "westbridge_csrf" }));
vi.mock("@/lib/services/audit.service", () => ({ logAudit: vi.fn(), auditContext: () => ({ ipAddress: "127.0.0.1", userAgent: "test" }) }));
vi.mock("@/lib/security-monitor", () => ({ reportSecurityEvent: vi.fn() }));

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(csrf.validateCsrf).mockReturnValue(true);
  });

  it("returns 401 and Invalid credentials for bad credentials", async () => {
    loginMock.mockResolvedValue({ ok: false, error: "Invalid credentials" });
    const { prisma } = await import("@/lib/data/prisma");
    vi.mocked(prisma.account.findUnique).mockResolvedValue({ id: "acc-1", email: "u@x.com" } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u-1",
      accountId: "acc-1",
      email: "u@x.com",
      failedLoginAttempts: 0,
      lockedUntil: null,
    } as never);
    vi.mocked(prisma.user.create).mockResolvedValue({ id: "u-1", accountId: "acc-1", email: "u@x.com" } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": "x" },
      body: JSON.stringify({ email: "u@x.com", password: "wrong" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error?.message).toBe("Invalid credentials");
    expect(json.error?.code).toBe("AUTH_FAILED");
  });

  it("returns 413 when body exceeds 1MB", async () => {
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "content-length": "1048577" },
      body: JSON.stringify({ email: "u@x.com", password: "p" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(413);
    const json = await response.json();
    expect(json.error?.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("returns 403 when CSRF invalid", async () => {
    vi.mocked(csrf.validateCsrf).mockReturnValue(false);
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "u@x.com", password: "p" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(403);
  });
});
