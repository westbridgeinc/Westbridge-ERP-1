import { describe, it, expect } from "vitest";
import { SITE, ROUTES, TRIAL, CURRENCY } from "./site";

describe("site", () => {
  it("SITE has name and domain", () => {
    expect(SITE.name).toBe("Westbridge");
    expect(SITE.domain).toBe("westbridge.gy");
  });
  it("ROUTES has login and dashboard", () => {
    expect(ROUTES.login).toBe("/login");
    expect(ROUTES.dashboard).toBe("/dashboard");
  });
  it("TRIAL has days", () => {
    expect(TRIAL.days).toBe(14);
  });
  it("CURRENCY supported is USD only", () => {
    expect(CURRENCY.supported).toContain("USD");
    expect(CURRENCY.supported).toEqual(["USD"]);
  });
});
