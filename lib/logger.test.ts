import { describe, it, expect, vi, afterEach } from "vitest";
import { logger } from "./logger";

describe("logger", () => {
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("logger.error calls console.error with JSON", () => {
    logger.error("fail");
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(errorSpy.mock.calls[0][0]);
    expect(parsed.level).toBe("error");
    expect(parsed.message).toBe("fail");
  });
  it("logger.warn calls console.warn", () => {
    logger.warn("warn msg");
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
  it("logger.info calls console.info", () => {
    logger.info("info msg");
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });
  it("includes meta when provided", () => {
    logger.error("e", { requestId: "abc" });
    const parsed = JSON.parse(errorSpy.mock.calls[0][0]);
    expect(parsed.meta).toEqual({ requestId: "abc" });
  });
});
