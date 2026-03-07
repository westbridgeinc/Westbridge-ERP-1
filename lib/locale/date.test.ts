import { describe, it, expect } from "vitest";
import { formatDate, formatDateLong, formatDateTime } from "./date";

describe("date", () => {
  const d = new Date("2025-03-15T12:00:00.000Z");
  describe("formatDate", () => {
    it("returns DD/MM/YYYY", () => {
      expect(formatDate(d)).toBe("15/03/2025");
    });
    it("accepts string", () => {
      const out = formatDate("2025-03-15");
      expect(out).toMatch(/^\d{2}\/\d{2}\/2025$/);
    });
  });
  describe("formatDateLong", () => {
    it("returns locale date string", () => {
      expect(formatDateLong(d)).toMatch(/15/);
      expect(formatDateLong(d)).toMatch(/2025/);
    });
  });
  describe("formatDateTime", () => {
    it("includes time", () => {
      expect(formatDateTime(d)).toMatch(/\d{1,2}:\d{2}/);
    });
  });
});
