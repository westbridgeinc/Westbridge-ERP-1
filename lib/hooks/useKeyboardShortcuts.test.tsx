/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts, G_KEYS } from "./useKeyboardShortcuts";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: mockPush }),
}));

describe("useKeyboardShortcuts G_KEYS", () => {
  it("defines href for each expected shortcut key", () => {
    const EXPECTED_KEYS = ["d", "i", "a", "e", "c", "q", "n", "p", "h", "r", "y", "s"];
    for (const key of EXPECTED_KEYS) {
      expect(G_KEYS[key]).toBeDefined();
      expect(typeof G_KEYS[key]).toBe("string");
    }
  });
  it("all hrefs are dashboard routes", () => {
    for (const key of Object.keys(G_KEYS)) {
      expect(G_KEYS[key].startsWith("/dashboard")).toBe(true);
    }
  });
  it("maps d to dashboard root and s to settings", () => {
    expect(G_KEYS.d).toBe("/dashboard");
    expect(G_KEYS.s).toBe("/dashboard/settings");
  });
});

describe("useKeyboardShortcuts hook", () => {
  const onOpenCommand = vi.fn();
  const onOpenNotifications = vi.fn();
  const onOpenShortcuts = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  it("registers keydown listener and calls onOpenCommand for Cmd+K", () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onOpenCommand,
        onOpenNotifications,
        onOpenShortcuts,
      })
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
    expect(onOpenCommand).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenShortcuts for Shift+?", () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onOpenCommand,
        onOpenNotifications,
        onOpenShortcuts,
      })
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "?", shiftKey: true }));
    expect(onOpenShortcuts).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenNotifications for N", () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onOpenCommand,
        onOpenNotifications,
        onOpenShortcuts,
      })
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "n" }));
    expect(onOpenNotifications).toHaveBeenCalledTimes(1);
  });

  it("pushes route for G then d", () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onOpenCommand,
        onOpenNotifications,
        onOpenShortcuts,
      })
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("G then wait past timeout then d does not push", async () => {
    vi.useFakeTimers();
    renderHook(() =>
      useKeyboardShortcuts({
        onOpenCommand,
        onOpenNotifications,
        onOpenShortcuts,
      })
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    await vi.advanceTimersByTimeAsync(900);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));
    expect(mockPush).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
