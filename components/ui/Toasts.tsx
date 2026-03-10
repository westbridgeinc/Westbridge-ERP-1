"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastVariant = "success" | "warning" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  action?: { label: string; onClick: () => void };
  persist?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, variant?: ToastVariant, options?: { action?: Toast["action"]; persist?: boolean }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_DURATION_MS = 5000;

export function useToasts() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toasts: [], addToast: () => {}, removeToast: () => {} };
  return ctx;
}

export function ToastsProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (
      message: string,
      variant: ToastVariant = "info",
      options?: { action?: Toast["action"]; persist?: boolean }
    ) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          variant,
          action: options?.action,
          persist: options?.persist ?? variant === "error",
        },
      ]);
      if (!options?.persist && variant !== "error") {
        setTimeout(() => {
          setToasts((p) => p.filter((t) => t.id !== id));
        }, TOAST_DURATION_MS);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  function ToastProgressBar({ variant, persist }: { variant: ToastVariant; persist?: boolean }) {
  if (persist) return null;

  const barClass =
    variant === "error"
      ? "bg-destructive"
      : variant === "success"
        ? "bg-success"
        : variant === "warning"
          ? "bg-warning"
          : "bg-primary";

  return (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-b-lg bg-muted">
      <motion.div
        className={`h-full rounded-b-lg ${barClass}`}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: TOAST_DURATION_MS / 1000, ease: "linear" }}
      />
    </div>
  );
}

function ToastItem({
  t,
  removeToast,
}: {
  t: Toast;
  removeToast: (id: string) => void;
}) {
  const borderLClass =
    t.variant === "error"
      ? "border-l-4 border-l-destructive"
      : t.variant === "success"
        ? "border-l-4 border-l-emerald-500"
        : "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className={`relative flex min-w-[280px] max-w-sm items-start justify-between gap-3 overflow-hidden rounded-md border border-border bg-background px-4 py-3 shadow-lg ${borderLClass}`}
    >
      <p className="text-base text-foreground">
        {t.message}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        {t.action && (
          <button
            type="button"
            onClick={() => {
              t.action?.onClick();
              removeToast(t.id);
            }}
            className="text-sm font-semibold text-primary transition-opacity hover:opacity-80"
          >
            {t.action.label}
          </button>
        )}
        <button
          type="button"
          onClick={() => removeToast(t.id)}
          className="rounded p-1 text-muted-foreground/60 transition-opacity hover:opacity-70"
          aria-label="Dismiss"
        >
          <span>×</span>
        </button>
      </div>
      <ToastProgressBar variant={t.variant} persist={t.persist} />
    </motion.div>
  );
}

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2"
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} t={t} removeToast={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
