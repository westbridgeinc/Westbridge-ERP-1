"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/** G+letter → dashboard route. Exported for tests. */
export const G_KEYS: Record<string, string> = {
  d: "/dashboard",
  i: "/dashboard/invoices",
  a: "/dashboard/accounting",
  e: "/dashboard/expenses",
  c: "/dashboard/crm",
  q: "/dashboard/quotations",
  n: "/dashboard/inventory",
  p: "/dashboard/procurement",
  h: "/dashboard/hr",
  r: "/dashboard/payroll",
  y: "/dashboard/analytics",
  s: "/dashboard/settings",
};

export interface UseKeyboardShortcutsOptions {
  onOpenCommand: () => void;
  onOpenNotifications: () => void;
  onOpenShortcuts: () => void;
}

export function useKeyboardShortcuts({
  onOpenCommand,
  onOpenNotifications,
  onOpenShortcuts,
}: UseKeyboardShortcutsOptions) {
  const pathname = usePathname();
  const router = useRouter();
  const pendingG = useRef(false);
  const gTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!pathname?.startsWith("/dashboard")) return;
      const target = e.target as HTMLElement;
      if (target?.closest?.("input, textarea, [contenteditable=\"true\"]")) return;

      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenCommand();
        return;
      }
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        onOpenShortcuts();
        return;
      }
      if (e.key.toLowerCase() === "n" && !meta) {
        e.preventDefault();
        onOpenNotifications();
        return;
      }

      const key = e.key.toLowerCase();
      if (pendingG.current) {
        if (gTimeout.current) clearTimeout(gTimeout.current);
        gTimeout.current = null;
        pendingG.current = false;
        const href = G_KEYS[key];
        if (href) {
          e.preventDefault();
          router.push(href);
        }
        return;
      }
      if (key === "g" && !meta) {
        e.preventDefault();
        pendingG.current = true;
        gTimeout.current = setTimeout(() => {
          pendingG.current = false;
          gTimeout.current = null;
        }, 800);
      }
    },
    [pathname, router, onOpenCommand, onOpenNotifications, onOpenShortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (gTimeout.current) clearTimeout(gTimeout.current);
    };
  }, [handleKeyDown]);
}
