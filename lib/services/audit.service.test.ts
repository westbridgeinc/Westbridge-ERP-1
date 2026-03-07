import { describe, it, expect, vi, beforeEach } from "vitest";

const createMock = vi.fn();
const loggerErrorMock = vi.fn();
vi.mock("@/lib/data/prisma", () => ({
  prisma: {
    auditLog: { create: createMock },
  },
}));
vi.mock("@/lib/logger", () => ({
  logger: { error: loggerErrorMock, warn: vi.fn(), info: vi.fn() },
}));

describe("audit.service", () => {
  beforeEach(() => {
    createMock.mockReset();
    createMock.mockResolvedValue({});
  });

  it("calls prisma.auditLog.create with logAudit shape", async () => {
    const { logAudit } = await import("./audit.service");
    await logAudit({
      accountId: "acc-1",
      userId: "user-1",
      action: "auth.login.success",
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    });
    expect(createMock).toHaveBeenCalledTimes(1);
    const call = createMock.mock.calls[0]![0];
    expect(call.data.accountId).toBe("acc-1");
    expect(call.data.userId).toBe("user-1");
    expect(call.data.action).toBe("auth.login.success");
    expect(call.data.ipAddress).toBe("127.0.0.0");
    expect(call.data.userAgent).toMatch(/^[a-f0-9]{16}$/);
    expect(call.data.metadata).toEqual(expect.objectContaining({ _hash: expect.any(String), _prevHash: expect.any(String) }));
    expect(call.data.severity).toBe("info");
    expect(call.data.outcome).toBe("success");
  });

  it("supports optional resource, metadata, severity, outcome", async () => {
    const { logAudit } = await import("./audit.service");
    await logAudit({
      accountId: "acc-2",
      action: "erp.doc.create",
      resource: "Sales Invoice",
      resourceId: "SINV-001",
      metadata: { amount: 1000 },
      severity: "warn",
      outcome: "failure",
    });
    const call = createMock.mock.calls[0]![0];
    expect(call.data.accountId).toBe("acc-2");
    expect(call.data.userId).toBeUndefined();
    expect(call.data.action).toBe("erp.doc.create");
    expect(call.data.resource).toBe("Sales Invoice");
    expect(call.data.resourceId).toBe("SINV-001");
    expect(call.data.metadata).toEqual(expect.objectContaining({ amount: 1000, _hash: expect.any(String), _prevHash: expect.any(String) }));
    expect(call.data.ipAddress).toBeNull();
    expect(call.data.userAgent).toBeNull();
    expect(call.data.severity).toBe("warn");
    expect(call.data.outcome).toBe("failure");
  });

  it("logs error when prisma.auditLog.create rejects", async () => {
    loggerErrorMock.mockClear();
    createMock.mockRejectedValueOnce(new Error("DB error"));
    const { logAudit } = await import("./audit.service");
    await logAudit({ accountId: "acc-3", action: "auth.login.failure", ipAddress: "1.2.3.4" });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      "audit_log_write_failed",
      expect.objectContaining({ action: "auth.login.failure" })
    );
  });

  it("auditContext extracts ip and userAgent from request", async () => {
    const { auditContext } = await import("./audit.service");
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": " 1.2.3.4 , 5.6.7.8", "user-agent": "TestAgent" },
    });
    expect(auditContext(req)).toEqual({ ipAddress: "1.2.3.4", userAgent: "TestAgent" });
  });
});
