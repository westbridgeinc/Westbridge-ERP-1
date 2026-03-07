/**
 * Build Frappe/ERPNext list API filters JSON for "name like %query%".
 * Used by command palette record search.
 */
export function buildRecordSearchFilters(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return "[]";
  return JSON.stringify([["name", "like", `%${trimmed}%`]]);
}
