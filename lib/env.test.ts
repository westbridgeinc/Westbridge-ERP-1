import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateEnv, getEnvSummary } from "./env";

const keysToSave = ["DATABASE_URL", "CSRF_SECRET", "ENCRYPTION_KEY", "NODE_ENV", "ERPNEXT_URL", "TWOCO_MERCHANT_CODE", "TWOCO_SECRET_WORD"] as const;

describe("env", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    keysToSave.forEach((k) => { saved[k] = process.env[k]; });
    process.env.DATABASE_URL = "postgres://local";
    process.env.CSRF_SECRET = "secret";
    process.env.ENCRYPTION_KEY = "enc-key";
    // @ts-expect-error - NODE_ENV is read-only in types but writable at runtime for tests
    process.env.NODE_ENV = "test";
    process.env.ERPNEXT_URL = "http://erp";
    process.env.TWOCO_MERCHANT_CODE = "mc";
    process.env.TWOCO_SECRET_WORD = "sw";
  });

  afterEach(() => {
    const env = process.env as Record<string, string | undefined>;
    keysToSave.forEach((k) => {
      if (saved[k] !== undefined) env[k] = saved[k];
      else delete env[k];
    });
  });

  describe("validateEnv", () => {
    it("returns ok when required vars are set", () => {
      expect(validateEnv()).toEqual({ ok: true });
    });
    it("returns missing when DATABASE_URL is empty", () => {
      delete process.env.DATABASE_URL;
      const r = validateEnv();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.missing).toContain("DATABASE_URL");
    });
    it("returns missing when CSRF_SECRET is empty", () => {
      process.env.CSRF_SECRET = "";
      const r = validateEnv();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.missing).toContain("CSRF_SECRET");
    });
    it("in production requires ERPNEXT_URL and 2CO vars", () => {
      // @ts-expect-error - NODE_ENV is read-only in types but writable at runtime for tests
      process.env.NODE_ENV = "production";
      delete process.env.ERPNEXT_URL;
      const r = validateEnv();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.missing).toContain("ERPNEXT_URL");
    });
  });

  describe("getEnvSummary", () => {
    it("returns object with boolean per key", () => {
      const s = getEnvSummary();
      expect(s.DATABASE_URL).toBe(true);
      expect(s.CSRF_SECRET).toBe(true);
      expect(s.REDIS_URL).toBeDefined();
    });
  });
});
