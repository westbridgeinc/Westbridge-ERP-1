"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { useErpConnection } from "./ErpConnectionContext";

const STORAGE_KEY = "wb_erp_banner_dismissed";
const TTL_MS = 24 * 60 * 60 * 1000;

function getDismissedUntil(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const t = parseInt(raw, 10);
  return Number.isFinite(t) ? t : null;
}

function setDismissedUntil() {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(Date.now() + TTL_MS));
}

export function ErpConnectionBanner() {
  const pathname = usePathname();
  const { connected } = useErpConnection();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const until = getDismissedUntil();
    const next = until !== null && Date.now() < until;
    queueMicrotask(() => setDismissed(next));
  }, []);

  const hideSettings = pathname === "/dashboard/settings";
  const show = !hideSettings && connected === false && !dismissed;

  const handleDismiss = () => {
    setDismissed(true);
    setDismissedUntil();
  };

  if (!show) return null;

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-border border-l-4 border-l-amber-500 bg-card py-3 pl-4 pr-3">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
        <p className="text-base text-foreground">
          ERPNext is not connected. Some features require an active ERPNext instance.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/dashboard/settings"
          prefetch={true}
          className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:opacity-90"
        >
          Configure in Settings
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
