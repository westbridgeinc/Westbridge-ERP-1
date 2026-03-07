import { describe, it, expect } from "vitest";
import {
  DEMO_COMPANIES,
  DEMO_PEOPLE,
  DEMO_INVOICES,
  DEMO_DEALS,
  CARIBBEAN_COUNTRIES,
  INDUSTRIES,
} from "./demo-data";

describe("demo-data", () => {
  it("DEMO_COMPANIES has name and currency", () => {
    expect(DEMO_COMPANIES.length).toBeGreaterThan(0);
    expect(DEMO_COMPANIES[0]).toHaveProperty("name");
    expect(DEMO_COMPANIES[0]).toHaveProperty("currency");
  });
  it("DEMO_PEOPLE is string array", () => {
    expect(DEMO_PEOPLE.every((p) => typeof p === "string")).toBe(true);
  });
  it("DEMO_INVOICES has id and status", () => {
    expect(DEMO_INVOICES[0]).toHaveProperty("id");
    expect(DEMO_INVOICES[0]).toHaveProperty("status");
  });
  it("DEMO_DEALS has stage", () => {
    expect(DEMO_DEALS[0]).toHaveProperty("stage");
  });
  it("CARIBBEAN_COUNTRIES and INDUSTRIES are arrays", () => {
    expect(Array.isArray(CARIBBEAN_COUNTRIES)).toBe(true);
    expect(Array.isArray(INDUSTRIES)).toBe(true);
  });
});
