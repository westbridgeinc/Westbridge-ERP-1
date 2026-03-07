import { describe, it, expect } from "vitest";

process.env.CSRF_SECRET = "test-secret-for-csrf";

describe("csrf", () => {
  it("generates a token with two segments", async () => {
    const { generateCsrfToken } = await import("./csrf");
    const token = generateCsrfToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    const parts = token.split(".");
    expect(parts).toHaveLength(2);
  });

  it("verifies a valid token", async () => {
    const { generateCsrfToken, verifyCsrfToken } = await import("./csrf");
    const token = generateCsrfToken();
    expect(verifyCsrfToken(token)).toBe(true);
  });

  it("rejects tampered token", async () => {
    const { generateCsrfToken, verifyCsrfToken } = await import("./csrf");
    const token = generateCsrfToken();
    const [value] = token.split(".");
    const tampered = `${value}.wrongsignature`;
    expect(verifyCsrfToken(tampered)).toBe(false);
  });

  it("rejects null or empty token", async () => {
    const { verifyCsrfToken } = await import("./csrf");
    expect(verifyCsrfToken(null)).toBe(false);
    expect(verifyCsrfToken(undefined)).toBe(false);
    expect(verifyCsrfToken("")).toBe(false);
  });

  it("validateCsrf requires header and cookie to match", async () => {
    const { generateCsrfToken, validateCsrf } = await import("./csrf");
    const token = generateCsrfToken();
    expect(validateCsrf(token, token)).toBe(true);
    expect(validateCsrf(token, "other")).toBe(false);
    expect(validateCsrf(null, token)).toBe(false);
    expect(validateCsrf(token, null)).toBe(false);
  });

  it("verifyCsrfToken safeEqual catch when signature encoding differs", async () => {
    const { verifyCsrfToken, generateCsrfToken } = await import("./csrf");
    const token = generateCsrfToken();
    const [value] = token.split(".");
    const badSig = "\u00e9".repeat(24);
    expect(verifyCsrfToken(`${value}.${badSig}`)).toBe(false);
  });
});
