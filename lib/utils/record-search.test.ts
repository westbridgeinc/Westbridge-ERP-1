import { describe, it, expect } from "vitest";
import { buildRecordSearchFilters } from "./record-search";

describe("buildRecordSearchFilters", () => {
  it("returns valid JSON array for non-empty query", () => {
    const out = buildRecordSearchFilters("INV");
    expect(() => JSON.parse(out)).not.toThrow();
    const parsed = JSON.parse(out) as unknown[];
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual(["name", "like", "%INV%"]);
  });

  it("wraps query in percent signs for like match", () => {
    const out = buildRecordSearchFilters("foo");
    const parsed = JSON.parse(out) as [string, string, string][];
    expect(parsed[0][2]).toBe("%foo%");
  });

  it("trims whitespace", () => {
    const out = buildRecordSearchFilters("  bar  ");
    const parsed = JSON.parse(out) as [string, string, string][];
    expect(parsed[0][2]).toBe("%bar%");
  });

  it("returns empty array JSON for empty string", () => {
    expect(buildRecordSearchFilters("")).toBe("[]");
    expect(buildRecordSearchFilters("   ")).toBe("[]");
  });
});
