import { describe, it, expect, vi, beforeEach } from "vitest";

const erpLoginMock = vi.fn();
vi.mock("@/lib/data/auth.client", () => ({ erpLogin: erpLoginMock }));

const { login } = await import("./auth.service");

describe("auth.service", () => {
  beforeEach(() => {
    erpLoginMock.mockReset();
  });

  it("returns error when email is empty", async () => {
    const result = await login("", "password");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Email");
  });

  it("returns error when password is empty", async () => {
    const result = await login("user@example.com", "");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("password");
  });

  it("returns error when erpLogin fails", async () => {
    erpLoginMock.mockResolvedValue({ ok: false, error: "Invalid credentials" });
    const result = await login("user@example.com", "wrong");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Invalid credentials");
  });

  it("returns session when erpLogin succeeds", async () => {
    erpLoginMock.mockResolvedValue({ ok: true, data: "session-123" });
    const result = await login("user@example.com", "correct");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBe("session-123");
  });
});
