"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check } from "lucide-react";

const STORAGE_DISMISSED = "wb_onboarding_dismissed";
const STORAGE_IMPORT = "wb_onboarding_import_done";
const STORAGE_INVITE = "wb_onboarding_invite_done";

const STEPS = [
  { id: "employee", label: "Add your first employee", href: "/dashboard/hr", storageKey: null },
  { id: "invoice", label: "Create your first invoice", href: "/dashboard/invoices", storageKey: null },
  { id: "accounts", label: "Set up your chart of accounts", href: "/dashboard/accounting", storageKey: null },
  { id: "import", label: "Import existing data", href: "/dashboard/settings?tab=general", storageKey: STORAGE_IMPORT },
  { id: "invite", label: "Invite your team", href: "/dashboard/settings?tab=team", storageKey: STORAGE_INVITE },
] as const;

async function checkErpListHasRows(doctype: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/erp/list?doctype=${encodeURIComponent(doctype)}&limit_page_length=1`, { credentials: "include" });
    if (!res.ok) return false;
    const json = await res.json();
    const data = json.data;
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

export function OnboardingChecklist({ checklistRef }: { checklistRef?: React.RefObject<HTMLDivElement | null> }) {
  const [dismissed, setDismissed] = useState(true); // start true to avoid flash, then set from storage
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const loadState = useCallback(async () => {
    if (typeof window === "undefined") return;
    const dismissedVal = localStorage.getItem(STORAGE_DISMISSED) === "true";
    setDismissed(dismissedVal);
    if (dismissedVal) {
      setLoading(false);
      return;
    }

    const [hasEmployees, hasInvoices, hasAccounts] = await Promise.all([
      checkErpListHasRows("Employee"),
      checkErpListHasRows("Sales Invoice"),
      checkErpListHasRows("Account"),
    ]);

    const importDone = localStorage.getItem(STORAGE_IMPORT) === "true";
    const inviteDone = localStorage.getItem(STORAGE_INVITE) === "true";

    setCompleted({
      employee: hasEmployees,
      invoice: hasInvoices,
      accounts: hasAccounts,
      import: importDone,
      invite: inviteDone,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => loadState());
  }, [loadState]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_DISMISSED, "true");
    setDismissed(true);
  };

  if (loading || dismissed) return null;

  const completedCount = STEPS.filter((s) => completed[s.id]).length;
  const total = STEPS.length;
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (completedCount / total) * circumference;

  return (
    <motion.div
      ref={checklistRef}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="mb-8 rounded-lg border border-border border-l-4 border-l-primary bg-card p-5 shadow-[0_0_0_1px_rgba(20,184,166,0.08)]"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 shrink-0">
            <svg className="h-12 w-12 -rotate-90" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="var(--border)"
                strokeWidth="4"
              />
              <motion.circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </svg>
          </div>
          <div>
            <p className="text-xl font-semibold text-foreground">
              Get started with Westbridge
            </p>
            <p className="mt-0.5 text-base text-muted-foreground/60">
              {completedCount} of {total} complete
            </p>
          </div>
        </div>

        <ul className="flex-1 space-y-1">
          {STEPS.map((step) => {
            const done = completed[step.id];
            return (
              <li key={step.id}>
                <Link
                  href={step.href}
                  prefetch={true}
                  className="group flex items-center justify-between gap-2 rounded-lg py-2.5 pr-2 transition-colors hover:bg-muted"
                >
                  <span className="flex items-center gap-3">
                    <AnimatePresence mode="wait">
                      {done ? (
                        <motion.span
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="dot"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/60"
                        />
                      )}
                    </AnimatePresence>
                    <span
                      className={`text-base font-medium ${done ? "text-muted-foreground/60 line-through" : "text-muted-foreground"}`}
                    >
                      {step.label}
                    </span>
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground/60"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <button
          type="button"
          onClick={handleDismiss}
          className="text-sm font-medium text-muted-foreground transition-opacity hover:opacity-100"
        >
          Dismiss
        </button>
      </div>
    </motion.div>
  );
}
