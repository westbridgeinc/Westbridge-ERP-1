import { describe, it, expect, vi, beforeEach } from "vitest";

const erpListMock = vi.fn();
const erpGetMock = vi.fn();
const erpCreateMock = vi.fn();
const erpUpdateMock = vi.fn();
vi.mock("@/lib/data/erpnext.client", () => ({
  erpList: erpListMock,
  erpGet: erpGetMock,
  erpCreate: erpCreateMock,
  erpUpdate: erpUpdateMock,
}));

describe("erp.service", () => {
  beforeEach(() => {
    erpListMock.mockReset();
    erpGetMock.mockReset();
    erpCreateMock.mockReset();
    erpUpdateMock.mockReset();
  });

  describe("list", () => {
    it("returns error when doctype is empty", async () => {
      const { list } = await import("./erp.service");
      const result = await list("", "sid");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toContain("doctype");
      expect(erpListMock).not.toHaveBeenCalled();
    });

    it("calls erpList with accountId when provided", async () => {
      erpListMock.mockResolvedValue({ ok: true, data: [] });
      const { list } = await import("./erp.service");
      await list("Sales Invoice", "session-1", undefined, "account-1");
      expect(erpListMock).toHaveBeenCalledWith("Sales Invoice", "session-1", undefined, "account-1");
    });

    it("returns data from erpList", async () => {
      const data = [{ name: "SINV-001" }];
      erpListMock.mockResolvedValue({ ok: true, data });
      const { list } = await import("./erp.service");
      const result = await list("Sales Invoice", "sid");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual(data);
    });
  });

  describe("getDoc", () => {
    it("returns error when doctype or name is empty", async () => {
      const { getDoc } = await import("./erp.service");
      expect((await getDoc("", "x", "sid")).ok).toBe(false);
      expect((await getDoc("Doc", "", "sid")).ok).toBe(false);
      expect(erpGetMock).not.toHaveBeenCalled();
    });

    it("calls erpGet with accountId when provided", async () => {
      erpGetMock.mockResolvedValue({ ok: true, data: {} });
      const { getDoc } = await import("./erp.service");
      await getDoc("Sales Invoice", "SINV-001", "sid", "account-1");
      expect(erpGetMock).toHaveBeenCalledWith("Sales Invoice", "SINV-001", "sid", "account-1");
    });
  });

  describe("createDoc", () => {
    it("returns error when doctype is empty", async () => {
      const { createDoc } = await import("./erp.service");
      const result = await createDoc("", "sid", {});
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toContain("doctype");
      expect(erpCreateMock).not.toHaveBeenCalled();
    });
    it("calls erpCreate and returns result on success", async () => {
      erpCreateMock.mockResolvedValue({ ok: true, data: { name: "NEW-1" } });
      const { createDoc } = await import("./erp.service");
      const result = await createDoc("Sales Invoice", "sid", { customer: "Acme" });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual({ name: "NEW-1" });
      expect(erpCreateMock).toHaveBeenCalledWith("Sales Invoice", "sid", { customer: "Acme" }, undefined);
    });
  });

  describe("updateDoc", () => {
    it("returns error when doctype or name is empty", async () => {
      const { updateDoc } = await import("./erp.service");
      expect((await updateDoc("", "x", "sid", {})).ok).toBe(false);
      expect((await updateDoc("Doc", "", "sid", {})).ok).toBe(false);
      expect(erpUpdateMock).not.toHaveBeenCalled();
    });
    it("calls erpUpdate and returns result on success", async () => {
      erpUpdateMock.mockResolvedValue({ ok: true, data: {} });
      const { updateDoc } = await import("./erp.service");
      const result = await updateDoc("Sales Invoice", "SINV-001", "sid", { status: "Paid" });
      expect(result.ok).toBe(true);
      expect(erpUpdateMock).toHaveBeenCalledWith("Sales Invoice", "SINV-001", "sid", { status: "Paid" }, undefined);
    });
  });
});
