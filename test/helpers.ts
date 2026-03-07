/**
 * Test helpers for API route testing, DB setup, and mocking.
 */
import { randomBytes } from "crypto";

// ─── Request builder ──────────────────────────────────────────────────────────

export function buildRequest(
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  }
): Request {
  const url = new URL(`http://localhost:3000${path}`);
  if (options?.searchParams) {
    for (const [k, v] of Object.entries(options.searchParams)) {
      url.searchParams.set(k, v);
    }
  }
  return new Request(url.toString(), {
    method: options?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": randomBytes(8).toString("hex"),
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
}

/** Build a request with a valid CSRF header (uses test token). */
export function buildCsrfRequest(
  path: string,
  options?: Parameters<typeof buildRequest>[1]
): Request {
  const csrfToken = "test-csrf-token";
  return buildRequest(path, {
    ...options,
    headers: {
      "x-csrf-token": csrfToken,
      ...options?.headers,
    },
  });
}

// ─── Response assertions ──────────────────────────────────────────────────────

export async function parseApiResponse<T = unknown>(res: Response): Promise<{
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}> {
  return res.json();
}

export async function expectApiSuccess<T>(res: Response): Promise<T> {
  const body = await parseApiResponse<T>(res);
  if (!body.ok) throw new Error(`Expected success, got error: ${JSON.stringify(body.error)}`);
  return body.data as T;
}

export async function expectApiError(res: Response, code: string): Promise<void> {
  const body = await parseApiResponse(res);
  if (body.ok) throw new Error(`Expected error ${code}, but got success`);
  if (body.error?.code !== code) {
    throw new Error(`Expected error code ${code}, got ${body.error?.code}`);
  }
}

// ─── Mock ERPNext (use MSW in full E2E) ──────────────────────────────────────

export const mockErpNextHandlers = {
  successList: (docs: unknown[]) => ({
    data: { message: docs },
  }),
  successDoc: (doc: unknown) => ({
    data: { message: doc },
  }),
  error: (message: string) => ({
    exc: message,
    exc_type: "ValidationError",
  }),
};
