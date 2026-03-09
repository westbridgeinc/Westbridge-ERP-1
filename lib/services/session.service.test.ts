import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateSession, createSession, revokeSession, revokeAllUserSessions } from "./session.service";

const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockDelete = vi.fn();
const mockDeleteMany = vi.fn();
const mockFindMany = vi.fn();
const mockUpdate = vi.fn();
const mockUserFindUnique = vi.fn();

const mockTransaction = vi.fn();
vi.mock("@/lib/data/prisma", () => ({
  prisma: {
    $transaction: (...args: unknown[]) => mockTransaction(...args),
    session: {
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
  },
}));
vi.mock("@/lib/redis", () => ({ getRedis: vi.fn(() => null) }));
vi.mock("@/lib/encryption", () => ({ encrypt: vi.fn((s: string) => s), decrypt: vi.fn((s: string) => s) }));
vi.mock("@/lib/services/audit.service", () => ({ logAudit: vi.fn(), auditContext: () => ({ ipAddress: "127.0.0.1", userAgent: "test" }) }));
vi.mock("@/lib/security-monitor", () => ({ reportSecurityEvent: vi.fn() }));

describe("session.service", () => {
  const fakeRequest = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4", "user-agent": "test" } });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserFindUnique.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: { session: { findMany: typeof mockFindMany; delete: typeof mockDelete; create: typeof mockCreate } }) => Promise<void>) => {
      const tx = {
        session: {
          findMany: mockFindMany,
          delete: mockDelete,
          create: mockCreate,
        },
      };
      return fn(tx);
    });
  });

  describe("validateSession", () => {
    it("returns error for empty token", async () => {
      const r = await validateSession("");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe("Missing token");
    });
    it("returns error when session not found", async () => {
      mockFindUnique.mockResolvedValue(null);
      mockDeleteMany.mockResolvedValue({ count: 0 });
      const r = await validateSession("any-token");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe("Invalid session");
    });
    it("returns error when session expired", async () => {
      mockFindUnique.mockResolvedValue({
        id: "s1",
        userId: "u1",
        expiresAt: new Date(0),
        erpnextSid: null,
        fingerprint: null,
        user: { accountId: "a1", role: "owner" },
      });
      mockDelete.mockResolvedValue({});
      const r = await validateSession("token");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe("Session expired");
    });
    it("returns error when findUnique throws", async () => {
      mockFindUnique.mockRejectedValue(new Error("DB error"));
      const r = await validateSession("token");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe("DB error");
    });
    it("returns userId accountId role when valid", async () => {
      mockFindUnique.mockResolvedValue({
        id: "s1",
        userId: "u1",
        expiresAt: new Date(Date.now() + 86400000),
        erpnextSid: "erpsid",
        fingerprint: null,
        lastActiveAt: new Date(),
        createdAt: new Date(),
        user: { accountId: "a1", role: "owner" },
      });
      mockUpdate.mockResolvedValue({});
      const r = await validateSession("token");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.userId).toBe("u1");
        expect(r.data.accountId).toBe("a1");
        expect(r.data.role).toBe("owner");
        expect(r.data.erpnextSid).toBe("erpsid");
      }
    });
    it("defaults role to member when not owner/admin/member", async () => {
      mockFindUnique.mockResolvedValue({
        id: "s1",
        userId: "u1",
        expiresAt: new Date(Date.now() + 86400000),
        erpnextSid: null,
        fingerprint: null,
        lastActiveAt: new Date(),
        createdAt: new Date(),
        user: { accountId: "a1", role: "unknown" },
      });
      mockUpdate.mockResolvedValue({});
      const r = await validateSession("token");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.role).toBe("member");
    });
  });

  describe("createSession", () => {
    it("returns token and expiresAt on success", async () => {
      mockFindMany.mockResolvedValue([]);
      mockCreate.mockResolvedValue({});
      const r = await createSession("u1", fakeRequest, "erpsid");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.token).toBeDefined();
        expect(r.data.expiresAt).toBeInstanceOf(Date);
      }
    });
    it("returns error on DB failure", async () => {
      mockFindMany.mockResolvedValue([]);
      mockCreate.mockRejectedValue(new Error("DB error"));
      const r = await createSession("u1", fakeRequest);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain("DB error");
    });
  });

  describe("revokeSession", () => {
    it("returns revoked false for empty token", async () => {
      const r = await revokeSession("");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.revoked).toBe(false);
    });
    it("returns revoked true when session deleted", async () => {
      mockDeleteMany.mockResolvedValue({ count: 1 });
      const r = await revokeSession("token");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.revoked).toBe(true);
    });
    it("returns revoked false when deleteMany throws", async () => {
      mockDeleteMany.mockRejectedValue(new Error("DB"));
      const r = await revokeSession("token");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.revoked).toBe(false);
    });
  });

  describe("revokeAllUserSessions", () => {
    it("returns count on success", async () => {
      mockDeleteMany.mockResolvedValue({ count: 3 });
      const r = await revokeAllUserSessions("u1");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(3);
    });
    it("returns error on failure", async () => {
      mockDeleteMany.mockRejectedValue(new Error("fail"));
      const r = await revokeAllUserSessions("u1");
      expect(r.ok).toBe(false);
    });
  });
});
