/**
 * Caribbean calculation functions — pure, zero-dependency, framework-agnostic.
 *
 * These are the frontend mirrors of the backend calculation engines.
 * Used for:
 * - Real-time invoice previews (VAT calculation as user types)
 * - Payroll previews (NIS/PAYE breakdown before submission)
 * - Form validation (client-side sanity checks)
 *
 * The backend always recalculates server-side — these are UX optimizations.
 */

import {
  VAT_RATE,
  NIS_EMPLOYER_RATE,
  NIS_EMPLOYEE_RATE,
  NIS_CEILING,
  PAYE_THRESHOLD,
  PAYE_BANDS,
  GRA_TIN_REGEX,
  type CaribbeanCurrency,
} from "./constants";

// ─── VAT ─────────────────────────────────────────────────────────────────────

export interface VatResult {
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatRate: number;
  currency: CaribbeanCurrency;
}

/** Calculate 14% VAT on a net amount. */
export function calculateVat(
  netAmount: number,
  currency: CaribbeanCurrency = "GYD",
  rate: number = VAT_RATE,
): VatResult {
  const vatAmount = round2(netAmount * rate);
  return {
    netAmount,
    vatAmount,
    grossAmount: round2(netAmount + vatAmount),
    vatRate: rate,
    currency,
  };
}

/** Extract VAT from a gross (VAT-inclusive) amount. */
export function extractVat(
  grossAmount: number,
  currency: CaribbeanCurrency = "GYD",
  rate: number = VAT_RATE,
): VatResult {
  const netAmount = round2(grossAmount / (1 + rate));
  const vatAmount = round2(grossAmount - netAmount);
  return { netAmount, vatAmount, grossAmount, vatRate: rate, currency };
}

// ─── NIS ─────────────────────────────────────────────────────────────────────

export interface NisResult {
  insurableEarnings: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  ceilingApplied: boolean;
}

/** Calculate NIS contributions from monthly gross salary. */
export function calculateNis(grossMonthly: number): NisResult {
  const insurableEarnings = Math.min(grossMonthly, NIS_CEILING);
  const employeeContribution = round2(insurableEarnings * NIS_EMPLOYEE_RATE);
  const employerContribution = round2(insurableEarnings * NIS_EMPLOYER_RATE);

  return {
    insurableEarnings,
    employeeContribution,
    employerContribution,
    totalContribution: round2(employeeContribution + employerContribution),
    ceilingApplied: grossMonthly > NIS_CEILING,
  };
}

// ─── PAYE ────────────────────────────────────────────────────────────────────

export interface PayeResult {
  annualGross: number;
  taxableIncome: number;
  annualTax: number;
  monthlyTax: number;
  effectiveRate: number;
  marginalRate: number;
}

/** Calculate PAYE income tax from annual gross. */
export function calculatePaye(annualGross: number): PayeResult {
  const taxableIncome = Math.max(0, annualGross - PAYE_THRESHOLD);

  let remaining = taxableIncome;
  let totalTax = 0;
  let marginalRate = 0;
  let prevLimit = 0;

  for (const band of PAYE_BANDS) {
    if (remaining <= 0) break;
    const bandWidth = band.upperLimit === Infinity
      ? remaining
      : Math.min(band.upperLimit - prevLimit, remaining);
    const taxable = Math.min(remaining, bandWidth);
    totalTax += taxable * band.rate;
    remaining -= taxable;
    marginalRate = band.rate;
    prevLimit = band.upperLimit === Infinity ? prevLimit : band.upperLimit;
  }

  const annualTax = round2(totalTax);
  const monthlyTax = round2(annualTax / 12);
  const effectiveRate = annualGross > 0 ? round4(annualTax / annualGross) : 0;

  return {
    annualGross,
    taxableIncome,
    annualTax,
    monthlyTax,
    effectiveRate,
    marginalRate: taxableIncome > 0 ? marginalRate : 0,
  };
}

/** Calculate PAYE from monthly gross (annualizes internally). */
export function calculatePayeFromMonthly(grossMonthly: number): PayeResult {
  return calculatePaye(grossMonthly * 12);
}

// ─── Net Pay ─────────────────────────────────────────────────────────────────

export interface NetPayResult {
  grossMonthly: number;
  nisEmployee: number;
  payeMonthly: number;
  totalDeductions: number;
  netTakeHome: number;
}

/**
 * Full salary slip preview: gross → NIS → PAYE → net take-home.
 * Use this for the payroll UI to show real-time breakdown.
 */
export function calculateNetPay(grossMonthly: number): NetPayResult {
  const nis = calculateNis(grossMonthly);
  const paye = calculatePayeFromMonthly(grossMonthly);
  const totalDeductions = round2(nis.employeeContribution + paye.monthlyTax);

  return {
    grossMonthly,
    nisEmployee: nis.employeeContribution,
    payeMonthly: paye.monthlyTax,
    totalDeductions,
    netTakeHome: round2(grossMonthly - totalDeductions),
  };
}

// ─── GRA TIN Validation ──────────────────────────────────────────────────────

/**
 * Validate a Guyana Revenue Authority Tax Identification Number (TIN).
 * Strips hyphens and spaces, then checks for exactly 10 digits.
 */
export function validateGraTin(tin: string): { valid: boolean; normalized: string } {
  const normalized = tin.replace(/[-\s]/g, "");
  return { valid: GRA_TIN_REGEX.test(normalized), normalized };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
