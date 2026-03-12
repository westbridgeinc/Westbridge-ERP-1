/**
 * Server-side API helpers for fetching ERP data in Server Components.
 * Uses `cookies()` from next/headers to forward the session cookie
 * so that the backend authenticates the request.
 */

import { cookies, headers } from "next/headers";
import { COOKIE } from "@/lib/constants";
import type { ErpListParams, ErpListResponse } from "./client";

const API_BASE = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Build a Cookie header string from the incoming request cookies
 * so server-side fetches are authenticated.
 */
async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  const sid = cookieStore.get(COOKIE.SESSION_NAME)?.value;
  if (!sid) return "";
  return `${COOKIE.SESSION_NAME}=${sid}`;
}

/**
 * Get forwarded headers (User-Agent, X-Forwarded-For) from the incoming
 * request so server-side fetches pass the session fingerprint check.
 */
async function getForwardedHeaders(): Promise<Record<string, string>> {
  const h = await headers();
  const forwarded: Record<string, string> = {};
  const ua = h.get("user-agent");
  if (ua) forwarded["User-Agent"] = ua;
  const xff = h.get("x-forwarded-for");
  if (xff) forwarded["X-Forwarded-For"] = xff;
  return forwarded;
}

/**
 * Generic server-side fetch with auth cookie forwarding.
 * The `cache: "no-store"` ensures fresh data on every request.
 */
async function serverRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const cookieHeader = await getCookieHeader();
  const forwarded = await getForwardedHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      ...forwarded,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      (body as { error?: { message?: string } })?.error?.message ??
      `HTTP ${res.status}`;
    throw new Error(message);
  }
  const body = await res.json();
  return (body as { data: T }).data;
}

/**
 * Fetch a list of ERP documents on the server.
 * Returns the same shape as the client-side `api.erp.list()`.
 */
export async function serverErpList(
  doctype: string,
  params?: ErpListParams,
): Promise<ErpListResponse> {
  const cookieHeader = await getCookieHeader();
  const forwarded = await getForwardedHeaders();
  const qs = new URLSearchParams({ doctype });
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.page != null) qs.set("page", String(params.page));
  if (params?.orderBy) qs.set("order_by", params.orderBy);
  if (params?.filters) qs.set("filters", JSON.stringify(params.filters));
  if (params?.fields) qs.set("fields", JSON.stringify(params.fields));

  const res = await fetch(`${API_BASE}/api/erp/list?${qs.toString()}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      ...forwarded,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      (body as { error?: { message?: string } })?.error?.message ??
      `HTTP ${res.status}`;
    throw new Error(message);
  }
  const body = (await res.json()) as {
    data: unknown[];
    meta: { page: number; pageSize: number; hasMore: boolean };
  };
  return {
    data: body.data ?? [],
    meta: body.meta ?? { page: 0, pageSize: 20, hasMore: false },
  };
}

/**
 * Fetch dashboard summary data on the server.
 */
export interface DashboardData {
  revenueMTD: number;
  revenueChange: number;
  outstandingCount: number;
  openDealsCount: number;
  employeeCount: number;
  employeeDelta: number;
  revenueData: { month: string; value: number }[];
  activity: { text: string; time: string; type: "success" | "error" | "info" | "default" }[];
  isDemo?: boolean;
}

export async function serverFetchDashboard(): Promise<DashboardData> {
  const cookieHeader = await getCookieHeader();
  const forwarded = await getForwardedHeaders();
  const res = await fetch(`${API_BASE}/api/erp/dashboard`, {
    cache: "no-store",
    headers: {
      Cookie: cookieHeader,
      ...forwarded,
    },
  });
  if (!res.ok) {
    throw new Error(
      res.status === 401
        ? "Session expired. Please sign in again."
        : "Failed to load dashboard data.",
    );
  }
  const json = await res.json();
  return json.data as DashboardData;
}

export { serverRequest };
