/**
 * Caribbean domain constants — mirrored from the backend.
 *
 * IMPORTANT: These values MUST match the backend repo exactly.
 * If they drift, the system is broken.  Any change here requires
 * a corresponding change in westbridge-backend/src/lib/caribbean/constants.ts.
 *
 * Source: Guyana Revenue Authority (GRA), National Insurance Scheme (NIS),
 * CARICOM Revised Treaty of Chaguaramas.
 */

// ─── Currency ────────────────────────────────────────────────────────────────

export const DEFAULT_CURRENCY = "GYD" as const;

export const SUPPORTED_CURRENCIES = [
  "GYD", // Guyanese Dollar  (default)
  "USD", // US Dollar
  "TTD", // Trinidad & Tobago Dollar
  "BBD", // Barbados Dollar
  "JMD", // Jamaican Dollar
  "XCD", // East Caribbean Dollar
] as const;

export type CaribbeanCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// ─── VAT / Tax ───────────────────────────────────────────────────────────────

/** Guyana standard VAT rate (14%) */
export const VAT_RATE = 0.14;

/** Withholding tax on payments to non-residents */
export const WITHHOLDING_TAX_RATE = 0.20;

// ─── NIS (National Insurance Scheme — Guyana) ────────────────────────────────

/** Employer's NIS contribution rate (8.8%) */
export const NIS_EMPLOYER_RATE = 0.088;

/** Employee's NIS contribution rate (5.6%) */
export const NIS_EMPLOYEE_RATE = 0.056;

/** Monthly NIS insurable earnings ceiling (GYD) */
export const NIS_CEILING = 280_000;

// ─── PAYE (Pay-As-You-Earn — Guyana) ─────────────────────────────────────────

/** Annual PAYE threshold — income below this is tax-free (GYD) */
export const PAYE_THRESHOLD = 780_000;

/**
 * PAYE progressive tax bands (Guyana).
 * Band 1: First GYD 1,560,000 of taxable income → 28%
 * Band 2: Everything above → 40%
 */
export const PAYE_BANDS = [
  { upperLimit: 1_560_000, rate: 0.28 },
  { upperLimit: Infinity,  rate: 0.40 },
] as const;

// ─── CARICOM ─────────────────────────────────────────────────────────────────

/** ISO 3166-1 alpha-2 codes for CARICOM member states */
export const CARICOM_ORIGIN_COUNTRIES = [
  "GY", "TT", "BB", "JM", "BS", "BZ", "SR", "AG", "DM", "GD", "KN", "LC", "VC", "HT",
] as const;

export type CaricomCountry = (typeof CARICOM_ORIGIN_COUNTRIES)[number];
