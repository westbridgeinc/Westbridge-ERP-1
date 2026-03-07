import { describe, it, expect } from "vitest";
import { ok, err } from "./result";

describe("result", () => {
  it("ok and err shape", () => {
    expect(ok(42)).toEqual({ ok: true, data: 42 });
    expect(err("fail")).toEqual({ ok: false, error: "fail" });
  });
});
