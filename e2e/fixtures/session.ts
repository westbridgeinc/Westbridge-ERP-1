/**
 * E2E helpers: create a test session via direct DB seed and clean up after.
 * Uses the same DATABASE_URL as the app (e.g. in CI).
 * Uses relative imports so Playwright's runner can load this without path aliases.
 */

import { createHash, randomBytes } from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";

function getPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? "postgresql://localhost:5432/westbridge";
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}
const prisma = getPrisma();

const SESSION_EXPIRY_DAYS = 7;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type SessionRole = "owner" | "admin" | "member";

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
  const id = `e2e-${role}-${Date.now()}-${randomBytes(4).toString("hex")}`;
  const email = `${id}@e2e.test`;

  const account = await prisma.account.create({
    data: {
      email,
      companyName: "E2E Test",
      plan: "Starter",
      status: "active",
    },
  });

  const user = await prisma.user.create({
    data: {
      accountId: account.id,
      email,
      role,
      status: "active",
    },
  });

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: user.id,
      token: tokenHash,
      erpnextSid: "e2e-erp-sid",
      expiresAt,
    },
  });

  async function cleanup() {
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.account.delete({ where: { id: account.id } });
  }

  return {
    sessionCookie: rawToken,
    userId: user.id,
    accountId: account.id,
    role,
    cleanup,
  };
}
