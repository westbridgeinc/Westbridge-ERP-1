import { describe, it, expect } from "vitest";
import { parseValue } from "./animated-number";

describe("parseValue", () => {
  it("returns number and empty suffix for numeric input", () => {
    expect(parseValue(42)).toEqual({ num: 42, suffix: "" });
    expect(parseValue(0)).toEqual({ num: 0, suffix: "" });
    expect(parseValue(3.14)).toEqual({ num: 3.14, suffix: "" });
  });

  it("parses string with numeric prefix and suffix", () => {
    expect(parseValue("38+")).toEqual({ num: 38, suffix: "+" });
    expect(parseValue("14%")).toEqual({ num: 14, suffix: "%" });
    expect(parseValue("7")).toEqual({ num: 7, suffix: "" });
  });

  it("returns 0 and full string as suffix when no leading number", () => {
    expect(parseValue("abc")).toEqual({ num: 0, suffix: "abc" });
  });
});
