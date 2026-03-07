import { describe, it, expect } from "vitest";
import { parseAndValidateFilters } from "./erp-filters";

describe("parseAndValidateFilters", () => {
  it("accepts empty or missing input", () => {
    expect(parseAndValidateFilters(null)).toEqual({ ok: true, filters: "[]" });
    expect(parseAndValidateFilters("")).toEqual({ ok: true, filters: "[]" });
    expect(parseAndValidateFilters("   ")).toEqual({ ok: true, filters: "[]" });
  });

  it("accepts valid single filter", () => {
    const r = parseAndValidateFilters('[["name", "=", "SINV-001"]]');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.filters).toBe('[["name","=","SINV-001"]]');
  });

  it("rejects like value containing % or _", () => {
    expect(parseAndValidateFilters('[["name", "like", "%INV%"]]').ok).toBe(false);
    expect(parseAndValidateFilters('[["name", "like", "inv_123"]]').ok).toBe(false);
  });

  it("accepts like value without wildcards", () => {
    const r = parseAndValidateFilters('[["name", "like", "INV"]]');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.filters).toContain("INV");
  });

  it("accepts valid filters with allowed operators", () => {
    expect(parseAndValidateFilters('[["status", "=", "Open"]]').ok).toBe(true);
    expect(parseAndValidateFilters('[["count", ">", 0]]').ok).toBe(true);
    expect(parseAndValidateFilters('[["name", "in", ["a", "b"]]]').ok).toBe(true);
  });

  it("rejects invalid JSON", () => {
    const r = parseAndValidateFilters("not json");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("invalid JSON");
  });

  it("rejects non-array", () => {
    const r = parseAndValidateFilters('{"foo": "bar"}');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("must be an array");
  });

  it("rejects invalid field names", () => {
    expect(parseAndValidateFilters('[["field.name", "=", "x"]]').ok).toBe(false);
    expect(parseAndValidateFilters('[[""; DROP TABLE--", "=", "x"]]').ok).toBe(false);
    expect(parseAndValidateFilters('[["123field", "=", "x"]]').ok).toBe(false); // field must start with letter or underscore
  });

  it("rejects invalid operators", () => {
    const r = parseAndValidateFilters('[["name", "regex", ".*"]]');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("invalid operator");
  });

  it("rejects tuple not length 3", () => {
    expect(parseAndValidateFilters('[["name"]]').ok).toBe(false);
    expect(parseAndValidateFilters('[["name", "="]]').ok).toBe(false);
  });

  it("rejects too many filters", () => {
    const many = JSON.stringify(Array(21).fill(["name", "=", "x"]));
    const r = parseAndValidateFilters(many);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("max 20");
  });

  it("rejects string value over MAX_VALUE_LENGTH", () => {
    const r = parseAndValidateFilters(JSON.stringify([["name", "like", "x".repeat(501)]]));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("invalid value");
  });

  it("rejects array value over 50 items", () => {
    const r = parseAndValidateFilters(JSON.stringify([["x", "in", Array(51).fill("a")]]));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("invalid value");
  });

  it("accepts valid array value for in operator", () => {
    const r = parseAndValidateFilters(JSON.stringify([["status", "in", ["Open", "Closed"]]]));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.filters).toContain("Open");
  });

  it("rejects non-finite number", () => {
    const r = parseAndValidateFilters(JSON.stringify([["n", "=", NaN]]));
    expect(r.ok).toBe(false);
  });
});
