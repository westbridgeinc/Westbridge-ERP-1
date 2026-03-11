import { describe, it, expect } from "vitest";
import {
  calculateVat,
  extractVat,
  calculateNis,
  calculatePaye,
  calculatePayeFromMonthly,
  calculateNetPay,
} from "../calculations";
import {
  VAT_RATE,
  NIS_EMPLOYER_RATE,
  NIS_EMPLOYEE_RATE,
  NIS_CEILING,
  PAYE_THRESHOLD,
  CARICOM_ORIGIN_COUNTRIES,
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
} from "../constants";

describe("Caribbean Constants", () => {
  it("has correct default currency", () => {
    expect(DEFAULT_CURRENCY).toBe("GYD");
  });

  it("supports all Caribbean currencies", () => {
    expect(SUPPORTED_CURRENCIES).toContain("GYD");
    expect(SUPPORTED_CURRENCIES).toContain("TTD");
    expect(SUPPORTED_CURRENCIES).toContain("BBD");
    expect(SUPPORTED_CURRENCIES).toContain("JMD");
    expect(SUPPORTED_CURRENCIES).toContain("XCD");
    expect(SUPPORTED_CURRENCIES).toContain("USD");
  });

  it("has correct tax rates", () => {
    expect(VAT_RATE).toBe(0.14);
    expect(NIS_EMPLOYER_RATE).toBe(0.088);
    expect(NIS_EMPLOYEE_RATE).toBe(0.056);
    expect(NIS_CEILING).toBe(280_000);
    expect(PAYE_THRESHOLD).toBe(780_000);
  });

  it("lists all CARICOM member states", () => {
    expect(CARICOM_ORIGIN_COUNTRIES).toContain("GY"); // Guyana
    expect(CARICOM_ORIGIN_COUNTRIES).toContain("TT"); // T&T
    expect(CARICOM_ORIGIN_COUNTRIES).toContain("JM"); // Jamaica
    expect(CARICOM_ORIGIN_COUNTRIES).toHaveLength(14);
  });
});

describe("VAT Calculations (Frontend)", () => {
  it("calculates 14% VAT", () => {
    const result = calculateVat(100_000);
    expect(result.vatAmount).toBe(14_000);
    expect(result.grossAmount).toBe(114_000);
    expect(result.currency).toBe("GYD");
  });

  it("extracts VAT from gross", () => {
    const result = extractVat(114_000);
    expect(result.netAmount).toBeCloseTo(100_000, 0);
    expect(result.vatAmount).toBeCloseTo(14_000, 0);
  });

  it("handles zero amount", () => {
    expect(calculateVat(0).vatAmount).toBe(0);
  });

  it("supports TTD currency", () => {
    const result = calculateVat(1000, "TTD");
    expect(result.currency).toBe("TTD");
  });
});

describe("NIS Calculations (Frontend)", () => {
  it("calculates NIS below ceiling", () => {
    const result = calculateNis(200_000);
    expect(result.employeeContribution).toBe(11_200);
    expect(result.employerContribution).toBe(17_600);
    expect(result.ceilingApplied).toBe(false);
  });

  it("caps at NIS ceiling", () => {
    const result = calculateNis(500_000);
    expect(result.insurableEarnings).toBe(280_000);
    expect(result.ceilingApplied).toBe(true);
  });

  it("handles zero salary", () => {
    const result = calculateNis(0);
    expect(result.totalContribution).toBe(0);
  });
});

describe("PAYE Calculations (Frontend)", () => {
  it("returns zero below threshold", () => {
    const result = calculatePaye(700_000);
    expect(result.annualTax).toBe(0);
    expect(result.monthlyTax).toBe(0);
  });

  it("calculates first band (28%)", () => {
    const result = calculatePaye(1_000_000);
    expect(result.taxableIncome).toBe(220_000);
    expect(result.annualTax).toBe(61_600);
    expect(result.marginalRate).toBe(0.28);
  });

  it("calculates second band (40%)", () => {
    const result = calculatePaye(3_000_000);
    expect(result.annualTax).toBe(700_800);
    expect(result.marginalRate).toBe(0.40);
  });

  it("calculates from monthly gross", () => {
    const result = calculatePayeFromMonthly(250_000);
    expect(result.annualGross).toBe(3_000_000);
  });
});

describe("Net Pay Calculation (Frontend)", () => {
  it("computes full salary breakdown", () => {
    const result = calculateNetPay(250_000);
    expect(result.grossMonthly).toBe(250_000);
    expect(result.nisEmployee).toBeGreaterThan(0);
    expect(result.payeMonthly).toBeGreaterThan(0);
    expect(result.netTakeHome).toBeLessThan(250_000);
    expect(result.netTakeHome).toBe(
      result.grossMonthly - result.totalDeductions
    );
  });

  it("low-income has zero PAYE", () => {
    const result = calculateNetPay(50_000);
    expect(result.payeMonthly).toBe(0);
    expect(result.nisEmployee).toBe(2_800);
    expect(result.netTakeHome).toBe(47_200);
  });
});
