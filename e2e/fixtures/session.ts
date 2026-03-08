/**
 * E2E helpers: create a test session via direct DB seed and clean up after.
 * Uses the same DATABASE_URL as the app (e.g. in CI).
 * Uses raw pg queries instead of the Prisma generated client to avoid
 * ESM/CJS interop issues when Playwright's esbuild transformer loads this file.
 */

import { createHash, randomBytes } from "crypto";
import { Client } from "pg";

function cuid(): string {
  // Simple cuid2-like ID for test data (24 chars, starts with 'c')
  return "c" + randomBytes(16).toString("hex").slice(0, 23);
}

function getClient(): Client {
  const connectionString = process.env.DATABASE_URL ?? "postgresql://localhost:5432/westbridge";
  return new Client({ connectionString });
}

const SESSION_EXPIRY_DAYS = 7;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type SessionRole = "owner" | "admin" | "member" | "viewer";

export interface TestSession {
  /** Value to set in Cookie: westbridge_sid=<sessionCookie> */
  sessionCookie: string;
  /** Value to set in Cookie: westbridge_csrf=<csrfToken> when calling CSRF-protected endpoints */
  csrfToken?: string;
  userId: string;
  accountId: string;
  role: SessionRole;
  /** Call after test to remove session, user, and account from DB */
  cleanup: () => Promise<void>;
}

/**
 * Create a test user and session in the DB. Call cleanup() after the test.
 */
export async function createTestSession(role: SessionRole): Promise<TestSession> {
  const client = getClient();
  await client.connect();

  const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const email = `e2e-${role}-${suffix}@e2e.test`;
  const accountId = cuid();
  const userId = cuid();
  const sessionId = cuid();

  try {
    // Insert account (updated_at required — no SQL default, Prisma @updatedAt)
    await client.query(
      `INSERT INTO accounts (id, email, company_name, plan, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [accountId, email, "E2E Test Co", "Starter", "active"],
    );

    // Insert user (updated_at required — no SQL default, Prisma @updatedAt)
    await client.query(
      `INSERT INTO users (id, account_id, email, role, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, accountId, email, role, "active"],
    );

    // Insert session — store the SHA-256 hash of rawToken in the token column,
    // exactly as the app does. The raw token is returned as the cookie value.
    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await client.query(
      `INSERT INTO sessions (id, user_id, token, expires_at, last_active_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [sessionId, userId, tokenHash, expiresAt],
    );

    await client.end();

    async function cleanup() {
      const cleanupClient = getClient();
      await cleanupClient.connect();
      try {
        await cleanupClient.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
        await cleanupClient.query("DELETE FROM users WHERE id = $1", [userId]);
        await cleanupClient.query("DELETE FROM accounts WHERE id = $1", [accountId]);
      } finally {
        await cleanupClient.end();
      }
    }

    return {
      sessionCookie: rawToken,
      userId,
      accountId,
      role,
      cleanup,
    };
  } catch (err) {
    await client.end().catch(() => {});
    throw new Error(`createTestSession failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
