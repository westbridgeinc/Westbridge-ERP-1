import { describe, it, expect } from "vitest";
import { formatCurrency, parseCurrency, CURRENCY_DISPLAY } from "./currency";

describe("currency", () => {
  it("formatCurrency USD has symbol and decimals", () => {
    const s = formatCurrency(1250000, "USD");
    expect(s).toContain("$");
    expect(s).toContain("1,250,000");
  });
  it("formatCurrency defaults to USD", () => {
    expect(formatCurrency(100)).toContain("$");
  });
  it("parseCurrency strips symbol and commas", () => {
    expect(parseCurrency("$ 1,250,000.00", "USD")).toBe(1250000);
  });
  it("parseCurrency invalid returns 0", () => {
    expect(parseCurrency("", "USD")).toBe(0);
  });
  it("CURRENCY_DISPLAY has USD and EUR", () => {
    expect(CURRENCY_DISPLAY.USD.symbol).toBe("$");
    expect(CURRENCY_DISPLAY.USD.decimals).toBe(2);
    expect(CURRENCY_DISPLAY.EUR.symbol).toBe("€");
  });
});
