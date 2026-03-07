import { describe, it, expect } from "vitest";
import { apiMeta, getRequestId, apiSuccess, apiError } from "./api";
describe("api", () => {
  it("apiMeta has timestamp", () => {
    expect(apiMeta().timestamp).toBeDefined();
  });
  it("apiMeta overrides request_id", () => {
    expect(apiMeta({ request_id: "x" }).request_id).toBe("x");
  });
  it("getRequestId from header", () => {
    const r = new Request("http://x", { headers: { "x-request-id": "abc" } });
    expect(getRequestId(r)).toBe("abc");
  });
  it("apiSuccess has data and meta", () => {
    const res = apiSuccess({ n: 1 });
    expect(res.data).toEqual({ n: 1 });
    expect(res.meta).toBeDefined();
  });
  it("apiError has error and meta", () => {
    const res = apiError("E", "m");
    expect(res.error.code).toBe("E");
    expect(res.error.message).toBe("m");
  });
});
