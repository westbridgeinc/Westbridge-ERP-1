import { describe, it, expect } from "vitest";
import {
  HTTP,
  RATE_LIMIT,
  COOKIE,
  PAGINATION,
  LOCALE,
  CURRENCY_CODES,
} from "./constants";

describe("constants", () => {
  it("HTTP has expected status codes", () => {
    expect(HTTP.OK).toBe(200);
    expect(HTTP.BAD_REQUEST).toBe(400);
    expect(HTTP.UNAUTHORIZED).toBe(401);
    expect(HTTP.FORBIDDEN).toBe(403);
    expect(HTTP.NOT_FOUND).toBe(404);
    expect(HTTP.TOO_MANY_REQUESTS).toBe(429);
    expect(HTTP.SERVER_ERROR).toBe(500);
  });
  it("RATE_LIMIT has numeric limits", () => {
    expect(RATE_LIMIT.LOGIN_PER_MINUTE).toBe(10);
    expect(RATE_LIMIT.SIGNUP_PER_MINUTE).toBe(5);
    expect(RATE_LIMIT.WEBHOOK_2CO_PER_MINUTE).toBe(100);
  });
  it("COOKIE has session and CSRF names", () => {
    expect(COOKIE.SESSION_NAME).toBe("westbridge_sid");
    expect(COOKIE.CSRF_NAME).toBe("westbridge_csrf");
    expect(COOKIE.SESSION_MAX_AGE_SEC).toBe(60 * 60 * 24 * 7);
  });
  it("PAGINATION has defaults", () => {
    expect(PAGINATION.DEFAULT_PAGE).toBe(1);
    expect(PAGINATION.DEFAULT_PER_PAGE).toBe(20);
    expect(PAGINATION.MAX_PER_PAGE).toBe(100);
  });
  it("LOCALE defaults to GYD and Guyana timezone", () => {
    expect(LOCALE.DEFAULT_CURRENCY).toBe("GYD");
    expect(LOCALE.DEFAULT_TIMEZONE).toBe("America/Guyana");
    expect(LOCALE.VAT_RATE_GUYANA).toBe(0.14);
  });
  it("CURRENCY_CODES includes Caribbean + international currencies", () => {
    expect(CURRENCY_CODES).toContain("GYD");
    expect(CURRENCY_CODES).toContain("USD");
    expect(CURRENCY_CODES).toContain("TTD");
    expect(CURRENCY_CODES).toContain("BBD");
    expect(CURRENCY_CODES).toContain("JMD");
    expect(CURRENCY_CODES).toContain("XCD");
    expect(CURRENCY_CODES).toContain("EUR");
    expect(CURRENCY_CODES).toContain("GBP");
    expect(CURRENCY_CODES).toContain("CAD");
  });
});
