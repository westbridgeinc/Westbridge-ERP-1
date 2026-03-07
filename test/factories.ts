/**
 * Test data factories.
 * Use these to create consistent, realistic test objects without boilerplate.
 *
 * @example
 * const account = factory.account({ plan: 'enterprise' });
 * const user = factory.user({ accountId: account.id, role: 'admin' });
 */
import { randomBytes } from "crypto";

function id() { return randomBytes(8).toString("hex"); }
function email(prefix = "user") { return `${prefix}-${id().slice(0, 6)}@test.westbridge.local`; }

export const factory = {
  account(overrides?: Partial<{
    id: string; companyName: string; email: string; plan: string; status: string; erpnextCompany: string;
  }>) {
    const base = {
      id: id(),
      companyName: "Test Company",
      email: email("admin"),
      plan: "starter",
      status: "active",
      erpnextCompany: "Test Company",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return { ...base, ...overrides };
  },

  user(overrides?: Partial<{
    id: string; accountId: string; email: string; name: string; role: string; status: string; passwordHash: string;
  }>) {
    const base = {
      id: id(),
      accountId: id(),
      email: email(),
      name: "Test User",
      role: "member",
      status: "active",
      passwordHash: "$argon2id$test_hash",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return { ...base, ...overrides };
  },

  session(overrides?: Partial<{
    id: string; accountId: string; userId: string; token: string; role: string;
    erpnextSid: string; fingerprint: string; expiresAt: Date;
  }>) {
    const base = {
      id: id(),
      accountId: id(),
      userId: id(),
      token: randomBytes(32).toString("hex"),
      role: "member",
      erpnextSid: randomBytes(16).toString("hex"),
      fingerprint: randomBytes(32).toString("hex"),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      lastActiveAt: new Date(),
    };
    return { ...base, ...overrides };
  },

  auditLog(overrides?: Partial<{
    id: string; accountId: string; userId: string; action: string; severity: string; outcome: string;
  }>) {
    const base = {
      id: id(),
      accountId: id(),
      userId: id(),
      action: "test.action",
      severity: "info",
      outcome: "success",
      ipAddress: "127.0.0.1",
      userAgent: "test-agent",
      metadata: {},
      createdAt: new Date(),
    };
    return { ...base, ...overrides };
  },
};
