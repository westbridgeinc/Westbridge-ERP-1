import { describe, it, expect } from "vitest";
import { signupBodySchema, signupSuccessSchema } from "./signup";

describe("signup schemas", () => {
  it("signupBodySchema", () => {
    expect(signupBodySchema.parse({
      email: "a@b.com",
      companyName: "Co",
      plan: "starter",
    })).toMatchObject({ email: "a@b.com", companyName: "Co", plan: "starter" });
    expect(signupBodySchema.parse({
      email: "a@b.com",
      companyName: "Co",
      plan: "starter",
      modulesSelected: ["m1"],
    }).modulesSelected).toEqual(["m1"]);
    expect(() => signupBodySchema.parse({ email: "invalid", companyName: "C", plan: "p" })).toThrow();
  });
  it("signupSuccessSchema", () => {
    const valid = { accountId: "acc1", paymentUrl: "https://x.com", status: "pending" as const };
    expect(signupSuccessSchema.parse(valid)).toEqual(valid);
  });
});
