/**
 * Environment validation — crash at startup, not at runtime.
 *
 * Every environment variable the frontend needs is declared and validated
 * here using Zod.  If any required variable is missing or malformed,
 * the app fails immediately with a clear error message instead of
 * silently breaking at runtime.
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   console.log(env.NEXT_PUBLIC_API_URL);
 */

import { z } from "zod";

// ─── Server-side env (not exposed to browser) ────────────────────────────────

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKEND_URL: z.string().url().default("http://localhost:4000"),
});

// ─── Client-side env (NEXT_PUBLIC_ prefix, exposed to browser) ───────────────

const clientSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().default("http://localhost:4000"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional().default(""),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional().default(""),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional().default(""),
});

// ─── Merge & parse ───────────────────────────────────────────────────────────

const envSchema = serverSchema.merge(clientSchema);

function parseEnv() {
  const raw = {
    NODE_ENV: process.env.NODE_ENV,
    BACKEND_URL: process.env.BACKEND_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  };

  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    console.error("❌ Invalid environment variables:", formatted);
    throw new Error(
      `Missing or invalid environment variables:\n${JSON.stringify(formatted, null, 2)}`
    );
  }

  return result.data;
}

export const env = parseEnv();

export type Env = z.infer<typeof envSchema>;
