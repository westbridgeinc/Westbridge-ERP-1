/**
 * Auth service: ERPNext login. Orchestrates data layer; returns Result.
 */

import { erpLogin } from "@/lib/data/auth.client";
import type { Result } from "@/lib/utils/result";

export async function login(
  email: string,
  password: string
): Promise<Result<string, string>> {
  if (!email?.trim() || !password) return { ok: false, error: "Email and password required" };
  return erpLogin(email.trim(), password);
}
