import { describe, it, expect } from "vitest";
import { z } from "zod";
import { apiMetaSchema, apiErrorSchema, apiSuccessSchema } from "./api";
describe("api schemas", () => {
  it("apiMetaSchema", () => {
    const m = apiMetaSchema.parse({ timestamp: "2025-01-01T00:00:00.000Z" });
    expect(m.timestamp).toBe("2025-01-01T00:00:00.000Z");
  });
  it("apiErrorSchema", () => {
    const e = apiErrorSchema.parse({
      error: { code: "E", message: "m" },
      meta: { timestamp: "2025-01-01T00:00:00.000Z" },
    });
    expect(e.error.code).toBe("E");
  });
  it("apiSuccessSchema returns schema that parses data and meta", () => {
    const schema = apiSuccessSchema(z.object({ id: z.string() }));
    const out = schema.parse({
      data: { id: "123" },
      meta: { timestamp: "2025-01-01T00:00:00.000Z" },
    });
    expect(out.data.id).toBe("123");
  });
});
