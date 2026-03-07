"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

type ErpConnectionContextValue = {
  connected: boolean | null;
  checkConnection: () => Promise<void>;
};

const ErpConnectionContext = createContext<ErpConnectionContextValue | null>(null);

export function useErpConnection() {
  const ctx = useContext(ErpConnectionContext);
  if (!ctx) return { connected: null, checkConnection: async () => {} };
  return ctx;
}

export function ErpConnectionProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState<boolean | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const res = await fetch("/api/erp/list?doctype=Company&limit_page_length=1");
      setConnected(res.ok);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => checkConnection());
  }, [checkConnection]);

  return (
    <ErpConnectionContext.Provider value={{ connected, checkConnection }}>
      {children}
    </ErpConnectionContext.Provider>
  );
}
