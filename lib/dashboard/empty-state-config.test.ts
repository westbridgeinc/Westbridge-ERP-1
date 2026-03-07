import { describe, it, expect } from "vitest";
import { MODULE_EMPTY_STATES, EMPTY_STATE_SUPPORT_LINE } from "./empty-state-config";

describe("empty-state-config", () => {
  it("MODULE_EMPTY_STATES has invoices and crm", () => {
    expect(MODULE_EMPTY_STATES.invoices.title).toBe("No invoices yet");
    expect(MODULE_EMPTY_STATES.crm.actionLink).toContain("crm");
  });
  it("EMPTY_STATE_SUPPORT_LINE is string", () => {
    expect(EMPTY_STATE_SUPPORT_LINE).toContain("support@westbridge.gy");
  });
});
