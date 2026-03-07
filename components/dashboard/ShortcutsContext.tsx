"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ShortcutsContextValue = {
  openShortcuts: boolean;
  setOpenShortcuts: (open: boolean) => void;
  openShortcutsModal: () => void;
};

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null);

export function ShortcutsProvider({ children }: { children: ReactNode }) {
  const [openShortcuts, setOpenShortcuts] = useState(false);
  const openShortcutsModal = useCallback(() => setOpenShortcuts(true), []);
  return (
    <ShortcutsContext.Provider
      value={{ openShortcuts, setOpenShortcuts, openShortcutsModal }}
    >
      {children}
    </ShortcutsContext.Provider>
  );
}

export function useShortcuts(): ShortcutsContextValue {
  const ctx = useContext(ShortcutsContext);
  if (!ctx) {
    return {
      openShortcuts: false,
      setOpenShortcuts: () => {},
      openShortcutsModal: () => {},
    };
  }
  return ctx;
}
