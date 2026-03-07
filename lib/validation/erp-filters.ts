/**
 * Server-side validation for ERP list API filters.
 * Prevents arbitrary filter injection; only allowlisted operators and safe field names.
 */

const ALLOWED_OPS = new Set([
  "=",
  "!=",
  ">",
  "<",
  ">=",
  "<=",
  "like",
  "not like",
  "in",
  "not in",
  "is",
  "is not",
]);

/** Frappe field names: alphanumeric and underscore only (no path/dots). */
const SAFE_FIELD_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const MAX_FILTERS = 20;
const MAX_VALUE_LENGTH = 500;
const MAX_DEPTH = 5;

function getDepth(val: unknown, d = 0): number {
  if (!Array.isArray(val) && (typeof val !== "object" || val === null)) return d;
  const vals = Object.values(val ?? {});
  if (vals.length === 0) return d;
  return Math.max(...vals.map((v) => getDepth(v, d + 1)));
}

function isSafeValue(v: unknown, operator?: string): boolean {
  if (operator === "like" || operator === "not like") {
    if (typeof v === "string" && /[%_]/.test(v)) return false;
  }
  if (typeof v === "string") return v.length <= MAX_VALUE_LENGTH;
  if (typeof v === "number") return Number.isFinite(v);
  if (Array.isArray(v)) return v.length <= 50 && v.every((x) => typeof x === "string" || typeof x === "number");
  return false;
}

/**
 * Parse and validate filters query param for ERP list.
 * Returns validated JSON string for ERPNext or error message.
 */
export function parseAndValidateFilters(raw: string | null): { ok: true; filters: string } | { ok: false; error: string } {
  if (!raw || !raw.trim()) return { ok: true, filters: "[]" };
  let arr: unknown;
  try {
    arr = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, error: "filters: invalid JSON" };
  }
  if (!Array.isArray(arr)) return { ok: false, error: "filters: must be an array" };
  if (arr.length > MAX_FILTERS) return { ok: false, error: `filters: max ${MAX_FILTERS} conditions` };
  if (getDepth(arr) > MAX_DEPTH) return { ok: false, error: `filters: max nesting depth ${MAX_DEPTH} exceeded` };
  const out: [string, string, string | number | (string | number)[]][] = [];
  for (let i = 0; i < arr.length; i++) {
    const row = arr[i];
    if (!Array.isArray(row) || row.length !== 3) {
      return { ok: false, error: `filters[${i}]: expected [field, operator, value]` };
    }
    const [field, op, value] = row;
    if (typeof field !== "string" || !SAFE_FIELD_REGEX.test(field)) {
      return { ok: false, error: `filters[${i}]: invalid field name` };
    }
    if (typeof op !== "string" || !ALLOWED_OPS.has(op)) {
      return { ok: false, error: `filters[${i}]: invalid operator` };
    }
    if (!isSafeValue(value, op)) {
      return { ok: false, error: `filters[${i}]: invalid value` };
    }
    out.push([field, op, value as string | number | (string | number)[]]);
  }
  return { ok: true, filters: JSON.stringify(out) };
}
