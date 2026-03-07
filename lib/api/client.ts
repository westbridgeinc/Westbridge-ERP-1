/**
 * Typed API client for all Westbridge endpoints.
 * Used with React Query for data fetching in dashboard components.
 *
 * @example
 * const { data } = useQuery({ queryKey: ['invoices', filters], queryFn: () => api.erp.list('Sales Invoice', filters) });
 */

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = (body as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(message);
  }
  const body = await res.json();
  return (body as { data: T }).data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginInput { email: string; password: string }
export interface LoginResult { userId: string; accountId: string; role: string }

async function login(input: LoginInput): Promise<LoginResult> {
  return request<LoginResult>("/api/auth/login", { method: "POST", body: JSON.stringify(input) });
}

async function logout(): Promise<void> {
  await request<void>("/api/auth/logout", { method: "POST" });
}

async function forgotPassword(email: string): Promise<void> {
  await request<void>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}

async function resetPassword(token: string, password: string): Promise<void> {
  await request<void>("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
}

// ─── ERP ─────────────────────────────────────────────────────────────────────

export interface ErpListParams {
  limit?: number;
  offset?: number;
  page?: number;
  orderBy?: string;
  filters?: Record<string, unknown>[];
}

export interface ErpListResponse {
  data: unknown[];
  meta: { page: number; pageSize: number; hasMore: boolean };
}

async function erpList(doctype: string, params?: ErpListParams): Promise<ErpListResponse> {
  const qs = new URLSearchParams({ doctype });
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.page != null) qs.set("page", String(params.page));
  if (params?.orderBy) qs.set("order_by", params.orderBy);
  if (params?.filters) qs.set("filters", JSON.stringify(params.filters));
  const res = await fetch(`/api/erp/list?${qs.toString()}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = (body as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(message);
  }
  const body = (await res.json()) as { data: unknown[]; meta: { page: number; pageSize: number; hasMore: boolean } };
  return { data: body.data ?? [], meta: body.meta ?? { page: 0, pageSize: 20, hasMore: false } };
}

async function erpGet(doctype: string, name: string): Promise<unknown> {
  return request<unknown>(`/api/erp/doc?doctype=${encodeURIComponent(doctype)}&name=${encodeURIComponent(name)}`);
}

async function erpCreate(doctype: string, data: Record<string, unknown>): Promise<unknown> {
  return request<unknown>("/api/erp/doc", { method: "POST", body: JSON.stringify({ doctype, data }) });
}

// ─── Invite ───────────────────────────────────────────────────────────────────

async function sendInvite(email: string, role: string): Promise<void> {
  await request<void>("/api/invite", { method: "POST", body: JSON.stringify({ email, role }) });
}

async function validateInvite(token: string): Promise<{ email: string; role: string; companyName: string }> {
  return request(`/api/invite?token=${encodeURIComponent(token)}`);
}

async function acceptInvite(token: string, name: string, password: string): Promise<void> {
  await request<void>("/api/invite/accept", { method: "POST", body: JSON.stringify({ token, name, password }) });
}

// ─── Client export ────────────────────────────────────────────────────────────

export const api = {
  auth: { login, logout, forgotPassword, resetPassword },
  erp: { list: erpList, get: erpGet, create: erpCreate },
  invite: { send: sendInvite, validate: validateInvite, accept: acceptInvite },
} as const;
