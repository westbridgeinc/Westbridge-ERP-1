import { describe, it, expect, vi, beforeEach } from "vitest";
describe("erpnext.client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) }));
    process.env.ERPNEXT_URL = "http://erp.test";
    vi.resetModules();
  });
  it("erpList returns array", async () => {
    const mod = await import("./erpnext.client");
    const r = await mod.erpList("Sales Invoice", "sid");
    expect(r.ok).toBe(true);
  });
  it("erpList returns empty when body.data not array", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    vi.resetModules();
    const mod = await import("./erpnext.client");
    const r = await mod.erpList("Doc", "sid");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual([]);
  });
  it("erpGet returns doc", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { name: "SINV-001" } }) }));
    vi.resetModules();
    const mod = await import("./erpnext.client");
    const r = await mod.erpGet("Sales Invoice", "SINV-001", "sid");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual({ name: "SINV-001" });
  });
  it("erpGet returns not found when no data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    vi.resetModules();
    const mod = await import("./erpnext.client");
    const r = await mod.erpGet("Doc", "X", "sid");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Not found");
  });
  it("erpCreate sends POST", async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", f);
    vi.resetModules();
    const mod = await import("./erpnext.client");
    await mod.erpCreate("Sales Invoice", "sid", { customer: "Acme" });
    expect(f).toHaveBeenCalledWith(expect.stringContaining("/resource/"), expect.objectContaining({ method: "POST" }));
  });
  it("erpUpdate sends PUT", async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", f);
    vi.resetModules();
    const mod = await import("./erpnext.client");
    await mod.erpUpdate("Sales Invoice", "SINV-001", "sid", { status: "Paid" });
    expect(f).toHaveBeenCalledWith(expect.stringContaining("SINV-001"), expect.objectContaining({ method: "PUT" }));
  });
  it("returns error when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    vi.resetModules();
    const mod = await import("./erpnext.client");
    const r = await mod.erpList("Doc", "sid");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("network");
  });
});
