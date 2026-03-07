import { describe, it, expect } from "vitest";
import { erpDocCreateBodySchema } from "./erp";
describe("erp schemas", () => {
  it("doctype required", () => {
    expect(erpDocCreateBodySchema.parse({ doctype: "Sales Invoice" }).doctype).toBe("Sales Invoice");
    expect(() => erpDocCreateBodySchema.parse({})).toThrow();
  });
  it("passthrough keeps extra", () => {
    expect(erpDocCreateBodySchema.parse({ doctype: "X", foo: 1 })).toHaveProperty("foo", 1);
  });
});
