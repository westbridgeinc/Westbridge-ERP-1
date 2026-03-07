import { describe, it, expect, vi, beforeEach } from "vitest";
describe("auth.client", () => {
  beforeEach(() => {
    process.env.ERPNEXT_URL = "http://erp.test";
    vi.resetModules();
  });
  it("erpLogin returns sid", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "set-cookie": "sid=abc; Path=/" }),
    }));
    const mod = await import("./auth.client");
    const r = await mod.erpLogin("u@x.com", "p");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe("abc");
  });
  it("erpLogin returns error when no sid in set-cookie", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "set-cookie": "other=val; Path=/" }),
    }));
    const mod = await import("./auth.client");
    const r = await mod.erpLogin("u@x.com", "p");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("No session returned");
  });
  it("erpLogin returns error when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("net")));
    const mod = await import("./auth.client");
    const r = await mod.erpLogin("u@x.com", "p");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("net");
  });
});
