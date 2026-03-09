import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock external dependencies ───────────────────────────────────────────────

const mockSession = {
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  update: vi.fn(),
};
const mockUser = {
  findUnique: vi.fn(),
};
const mockPrisma = {
  session: mockSession,
  user: mockUser,
  $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
    return cb(mockPrisma);
  }),
};
vi.mock("@/lib/data/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn(() => null), // No Redis by default
}));

vi.mock("@/lib/encryption", () => ({
  encrypt: vi.fn((v: string) => `enc:${v}`),
  decrypt: vi.fn((v: string) => v.replace(/^enc:/, "")),
}));

vi.mock("@/lib/services/audit.service", () => ({
  logAudit: vi.fn(),
  auditContext: vi.fn(() => ({ ipAddress: "1.2.3.4", userAgent: "vitest" })),
}));

vi.mock("@/lib/security-monitor", () => ({
  reportSecurityEvent: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { createSession, validateSession, revokeSession } from "./session.service";
import { prisma } from "@/lib/data/prisma";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(overrides: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/auth/login", {
    headers: {
      "user-agent": "TestBrowser/1.0",
      "x-forwarded-for": "1.2.3.4",
      ...overrides,
    },
  });
}

// ─── createSession ────────────────────────────────────────────────────────────

describe("createSession", () => {
  beforeEach(() => {
    vi.mocked(prisma.session.findMany).mockResolvedValue([]);
    vi.mocked(prisma.session.create).mockResolvedValue({} as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
  });

  it("returns a token and expiresAt on success", async () => {
    const result = await createSession("user-1", makeRequest());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    expect(typeof result.data.token).toBe("string");
    expect(result.data.token.length).toBeGreaterThan(10);
    expect(result.data.expiresAt).toBeInstanceOf(Date);
    expect(result.data.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("stores a hash, not the raw token in the DB", async () => {
    const result = await createSession("user-1", makeRequest());
    if (!result.ok) throw new Error();
    const rawToken = result.data.token;

    const createCall = vi.mocked(prisma.session.create).mock.calls[0]![0];
    const storedToken = createCall.data.token;

    // The stored token must NOT equal the raw token
    expect(storedToken).not.toBe(rawToken);
    // It should look like a SHA-256 hex digest
    expect(storedToken).toMatch(/^[0-9a-f]{64}$/);
  });

  it("encrypts the erpnextSid before storing", async () => {
    await createSession("user-1", makeRequest(), "my-erp-sid");
    const createCall = vi.mocked(prisma.session.create).mock.calls[0]![0];
    expect(createCall.data.erpnextSid).toBe("enc:my-erp-sid");
  });
});

// ─── validateSession ──────────────────────────────────────────────────────────

describe("validateSession", () => {
  it("returns err for empty token", async () => {
    const result = await validateSession("");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error();
    expect(result.error).toBe("Missing token");
  });

  it("returns err for whitespace-only token", async () => {
    const result = await validateSession("   ");
    expect(result.ok).toBe(false);
  });

  it("returns err for invalid (not found) session", async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue(null);
    const result = await validateSession("valid-looking-token", makeRequest());
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error();
    expect(result.error).toBe("Invalid session");
  });

  it("returns err for expired session", async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue({
      id: "s1",
      userId: "u1",
      token: "hash",
      expiresAt: new Date(Date.now() - 1000), // already expired
      lastActiveAt: new Date(),
      createdAt: new Date(),
      fingerprint: null,
      erpnextSid: null,
      ipAddress: null,
      userAgent: null,
      user: { role: "member", accountId: "acc1", account: {} },
    } as never);
    vi.mocked(prisma.session.delete).mockResolvedValue({} as never);

    const result = await validateSession("some-token", makeRequest());
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error();
    expect(result.error).toBe("Session expired");
  });
});

// ─── revokeSession ────────────────────────────────────────────────────────────

describe("revokeSession", () => {
  it("returns revoked: false for empty token without throwing", async () => {
    const result = await revokeSession("");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    expect(result.data.revoked).toBe(false);
  });

  it("returns revoked: true when DB deletes a row", async () => {
    vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 1 });
    const result = await revokeSession("some-token");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    expect(result.data.revoked).toBe(true);
  });

  it("returns revoked: false when no DB row matched", async () => {
    vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 0 });
    const result = await revokeSession("nonexistent-token");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    expect(result.data.revoked).toBe(false);
  });

  it("calls logAudit when audit context is provided", async () => {
    vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 1 });
    const { logAudit } = await import("@/lib/services/audit.service");

    await revokeSession("token", {
      userId: "u1",
      accountId: "acc1",
      reason: "logout",
      request: makeRequest(),
    });

    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "auth.session.revoked",
        userId: "u1",
        accountId: "acc1",
      })
    );
  });
});
