import { describe, it, expect } from "vitest";
import { loginBodySchema } from "./auth";

describe("loginBodySchema", () => {
  it("accepts valid email and password", () => {
    const result = loginBodySchema.safeParse({ email: "a@b.co", password: "secret" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginBodySchema.safeParse({ email: "not-an-email", password: "secret" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginBodySchema.safeParse({ email: "a@b.co", password: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(loginBodySchema.safeParse({}).success).toBe(false);
    expect(loginBodySchema.safeParse({ email: "a@b.co" }).success).toBe(false);
  });
});
