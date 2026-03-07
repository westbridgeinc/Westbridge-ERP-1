import { describe, it, expect } from "vitest";
import { requireRole, requireOwnerOrAdmin, requireOwner } from "./auth";

const owner = { userId: "u1", accountId: "a1", role: "owner" as const };
const admin = { userId: "u2", accountId: "a1", role: "admin" as const };
const member = { userId: "u3", accountId: "a1", role: "member" as const };

describe("auth", () => {
  it("requireRole allows when in list", () => {
    expect(requireRole(owner, ["owner"])).toBe(true);
    expect(requireRole(member, ["owner", "admin"])).toBe(false);
  });
  it("requireOwnerOrAdmin allows owner and admin", () => {
    expect(requireOwnerOrAdmin(owner)).toBe(true);
    expect(requireOwnerOrAdmin(admin)).toBe(true);
    expect(requireOwnerOrAdmin(member)).toBe(false);
  });
  it("requireOwner allows only owner", () => {
    expect(requireOwner(owner)).toBe(true);
    expect(requireOwner(admin)).toBe(false);
  });
});
