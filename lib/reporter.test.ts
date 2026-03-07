import { describe, it, expect, vi, beforeEach } from "vitest";

const captureExceptionMock = vi.fn();
const loggerErrorMock = vi.fn();
vi.mock("@sentry/nextjs", () => ({ captureException: captureExceptionMock }));
vi.mock("@/lib/logger", () => ({ logger: { error: loggerErrorMock } }));

describe("reporter", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { reportError } = await import("./reporter");
    (global as unknown as { reportError: typeof reportError }).reportError = reportError;
  });
  it("calls logger.error and Sentry.captureException", async () => {
    const { reportError } = await import("./reporter");
    const err = new Error("test");
    reportError(err, { requestId: "r1" });
    expect(loggerErrorMock).toHaveBeenCalledWith("Reported error", expect.objectContaining({ error: "test", requestId: "r1" }));
    expect(captureExceptionMock).toHaveBeenCalledWith(err, { extra: { requestId: "r1" } });
  });
  it("handles non-Error", async () => {
    const { reportError } = await import("./reporter");
    reportError("string error");
    expect(loggerErrorMock).toHaveBeenCalled();
    expect(captureExceptionMock).toHaveBeenCalledWith("string error", { extra: undefined });
  });
});
