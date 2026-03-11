/**
 * Caribbean business logic — barrel export.
 *
 * Import from here for a clean API:
 *   import { calculateVat, calculateNis, Money } from "@/lib/caribbean";
 */

export {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  VAT_RATE,
  WITHHOLDING_TAX_RATE,
  NIS_EMPLOYER_RATE,
  NIS_EMPLOYEE_RATE,
  NIS_CEILING,
  PAYE_THRESHOLD,
  PAYE_BANDS,
  CARICOM_ORIGIN_COUNTRIES,
  GRA_TIN_REGEX,
  GRA_RETENTION_YEARS,
  NIS_RETENTION_YEARS,
  type CaribbeanCurrency,
  type CaricomCountry,
} from "./constants";

export { Money, CURRENCY_INFO } from "./money";

export {
  calculateVat,
  extractVat,
  calculateNis,
  calculatePaye,
  calculatePayeFromMonthly,
  calculateNetPay,
  validateGraTin,
  type VatResult,
  type NisResult,
  type PayeResult,
  type NetPayResult,
} from "./calculations";
