/**
 * Data layer: ERPNext API client. Pure I/O; no business logic or formatting.
 * All ERPNext communication in the app goes through this client.
 */

import { Result, ok, err } from "@/lib/utils/result";

const ERPNEXT_URL = process.env.ERPNEXT_URL || "http://localhost:8080";

const ACCOUNT_HEADER = "X-Westbridge-Account-Id";

const RETRYABLE_STATUSES = new Set([502, 503, 429]);
const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 500;

function isRetryable(status: number): boolean {
  return RETRYABLE_STATUSES.has(status);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchErp(
  endpoint: string,
  sessionId: string | undefined,
  options?: RequestInit,
  accountId?: string
): Promise<Result<unknown, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (sessionId) headers["Cookie"] = `sid=${sessionId}`;
  if (accountId) headers[ACCOUNT_HEADER] = accountId;

  let lastError = "";
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${ERPNEXT_URL}/api${endpoint}`, {
        ...options,
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) {
        const data = await res.json();
        return ok(data);
      }
      lastError = `ERPNext ${res.status}: ${res.statusText}`;
      if (!isRetryable(res.status)) return err(lastError);
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(BACKOFF_BASE_MS * (attempt + 1));
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : "ERPNext request failed";
      const isNetworkError = e instanceof TypeError;
      if (!isNetworkError || attempt === MAX_ATTEMPTS - 1) return err(lastError);
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(BACKOFF_BASE_MS * (attempt + 1));
      }
    }
  }
  return err(lastError);
}

export interface ListParams {
  limit_page_length?: string;
  limit_start?: string;
  order_by?: string;
  fields?: string;
  filters?: string;
}

/**
 * List ERP documents. When erpnextCompany is provided the results are scoped
 * to that company via a Frappe filters clause — enforcing tenant isolation.
 */
export async function erpList(
  doctype: string,
  sessionId: string,
  params?: ListParams,
  accountId?: string,
  erpnextCompany?: string | null
): Promise<Result<unknown[], string>> {
  const queryParams: Record<string, string> = {
    limit_page_length: "20",
    order_by: "creation desc",
    ...params,
  };

  if (erpnextCompany) {
    // Merge company filter with any existing filters
    const existingFilters: unknown[][] = params?.filters ? JSON.parse(params.filters) : [];
    const companyFilter: unknown[] = [doctype, "company", "=", erpnextCompany];
    const merged = [...existingFilters, companyFilter];
    queryParams.filters = JSON.stringify(merged);
  }

  const query = new URLSearchParams(queryParams).toString();
  const result = await fetchErp(`/resource/${doctype}?${query}`, sessionId, undefined, accountId);
  if (!result.ok) return err(result.error);
  const body = result.data as { data?: unknown[] };
  return ok(Array.isArray(body?.data) ? body.data : []);
}

export async function erpGet(
  doctype: string,
  name: string,
  sessionId: string,
  accountId?: string
): Promise<Result<unknown, string>> {
  const result = await fetchErp(
    `/resource/${doctype}/${encodeURIComponent(name)}`,
    sessionId,
    undefined,
    accountId
  );
  if (!result.ok) return err(result.error);
  const body = result.data as { data?: unknown };
  return body?.data != null ? ok(body.data) : err("Not found");
}

export async function erpCreate(
  doctype: string,
  sessionId: string,
  body: Record<string, unknown>,
  accountId?: string
): Promise<Result<unknown, string>> {
  return fetchErp(
    `/resource/${doctype}`,
    sessionId,
    { method: "POST", body: JSON.stringify(body) },
    accountId
  );
}

export async function erpUpdate(
  doctype: string,
  name: string,
  sessionId: string,
  updates: Record<string, unknown>,
  accountId?: string
): Promise<Result<unknown, string>> {
  return fetchErp(
    `/resource/${doctype}/${encodeURIComponent(name)}`,
    sessionId,
    { method: "PUT", body: JSON.stringify(updates) },
    accountId
  );
}
