"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Calculator,
  Receipt,
  Users,
  FileBarChart,
  Package,
  Truck,
  UserCog,
  DollarSign,
  BarChart3,
  Settings,
  Plus,
  Clock,
  FileSearch,
} from "lucide-react";
import { buildRecordSearchFilters } from "@/lib/utils/record-search";

type ActionItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "Navigation" | "Quick Actions";
};

type RecordItem = {
  type: "record";
  id: string;
  doctypeLabel: string;
  name: string;
  href: string;
};

const RECORD_DOCTYPES: { doctype: string; label: string; hrefBase: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { doctype: "Sales Invoice", label: "Invoice", hrefBase: "/dashboard/invoices", icon: FileText },
  { doctype: "Opportunity", label: "Deal", hrefBase: "/dashboard/crm", icon: Users },
  { doctype: "Quotation", label: "Quotation", hrefBase: "/dashboard/quotations", icon: FileBarChart },
];

const RECORD_DEBOUNCE_MS = 300;

const ACTIONS: ActionItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Navigation" },
  { label: "Invoices", href: "/dashboard/invoices", icon: FileText, group: "Navigation" },
  { label: "Accounting", href: "/dashboard/accounting", icon: Calculator, group: "Navigation" },
  { label: "Expenses", href: "/dashboard/expenses", icon: Receipt, group: "Navigation" },
  { label: "CRM", href: "/dashboard/crm", icon: Users, group: "Navigation" },
  { label: "Quotations", href: "/dashboard/quotations", icon: FileBarChart, group: "Navigation" },
  { label: "Inventory", href: "/dashboard/inventory", icon: Package, group: "Navigation" },
  { label: "Procurement", href: "/dashboard/procurement", icon: Truck, group: "Navigation" },
  { label: "HR", href: "/dashboard/hr", icon: UserCog, group: "Navigation" },
  { label: "Payroll", href: "/dashboard/payroll", icon: DollarSign, group: "Navigation" },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, group: "Navigation" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, group: "Navigation" },
  { label: "New Invoice", href: "/dashboard/invoices?action=new", icon: Plus, group: "Quick Actions" },
  { label: "New Quote", href: "/dashboard/quotations?action=new", icon: Plus, group: "Quick Actions" },
  { label: "New Purchase Order", href: "/dashboard/procurement?action=new", icon: Plus, group: "Quick Actions" },
];

const GROUPS: ActionItem["group"][] = ["Navigation", "Quick Actions"];

const RECENT_KEY = "wb_cmd_recent";
const MAX_RECENT = 5;

function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(href: string) {
  try {
    const prev = getRecent().filter((h) => h !== href);
    localStorage.setItem(RECENT_KEY, JSON.stringify([href, ...prev].slice(0, MAX_RECENT)));
  } catch {
    /* noop */
  }
}

type FlatEntry = { type: "action"; item: ActionItem } | { type: "record"; item: RecordItem };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [recordResults, setRecordResults] = useState<RecordItem[]>([]);
  const [recordLoading, setRecordLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recordAbortRef = useRef<AbortController | null>(null);

  const filtered = query.trim()
    ? ACTIONS.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : ACTIONS;

  // Debounced ERP record search when query length >= 2
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setRecordResults([]);
      return;
    }
    const t = setTimeout(async () => {
      if (recordAbortRef.current) recordAbortRef.current.abort();
      recordAbortRef.current = new AbortController();
      setRecordLoading(true);
      const filters = buildRecordSearchFilters(q);
      const results: RecordItem[] = [];
      try {
        await Promise.all(
          RECORD_DOCTYPES.map(async ({ doctype, label, hrefBase }) => {
            const res = await fetch(
              `/api/erp/list?doctype=${encodeURIComponent(doctype)}&limit=5&filters=${encodeURIComponent(filters)}`,
              { signal: recordAbortRef.current?.signal }
            );
            if (!res.ok) return;
            const json = await res.json().catch(() => ({}));
            const data = (json?.data ?? []) as { name?: string }[];
            data.forEach((row) => {
              const name = String(row.name ?? "");
              results.push({
                type: "record",
                id: `${doctype}-${name}`,
                doctypeLabel: label,
                name,
                href: `${hrefBase}?search=${encodeURIComponent(name)}`,
              });
            });
          })
        );
        setRecordResults(results);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setRecordResults([]);
      } finally {
        setRecordLoading(false);
      }
    }, RECORD_DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      if (recordAbortRef.current) recordAbortRef.current.abort();
    };
  }, [query]);

  // Build flat list: Records (if any), then Navigation, then Quick Actions
  const { flatEntries, groupStartIndices } = useMemo(() => {
    const flat: FlatEntry[] = [];
    const starts: { group: string; index: number }[] = [];
    if (recordResults.length > 0) {
      starts.push({ group: "Records", index: 0 });
      recordResults.forEach((item) => flat.push({ type: "record", item }));
    }
    for (const g of GROUPS) {
      const items = filtered.filter((a) => a.group === g);
      if (items.length === 0) continue;
      starts.push({ group: g, index: flat.length });
      items.forEach((item) => flat.push({ type: "action", item }));
    }
    return { flatEntries: flat, groupStartIndices: starts };
  }, [filtered, recordResults]);

  // Recent items for empty query state
  const recentHrefs = getRecent();
  const recentItems = recentHrefs.map((h) => ACTIONS.find((a) => a.href === h)).filter(Boolean) as ActionItem[];

  const selectAction = useCallback(
    (item: ActionItem) => {
      saveRecent(item.href);
      router.push(item.href);
      onClose();
    },
    [router, onClose]
  );

  const selectRecord = useCallback(
    (item: RecordItem) => {
      saveRecent(item.href);
      router.push(item.href);
      onClose();
    },
    [router, onClose]
  );

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setQuery("");
      setSelected(0);
      inputRef.current?.focus();
    });
  }, [open]);

  useEffect(() => {
    queueMicrotask(() => setSelected(0));
  }, [query]);

  const handleSelectEntry = useCallback(
    (entry: FlatEntry) => {
      if (entry.type === "action") selectAction(entry.item);
      else selectRecord(entry.item);
    },
    [selectAction, selectRecord]
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      const len = Math.max(1, flatEntries.length);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => (s + 1) % len);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => (s - 1 + len) % len);
        return;
      }
      if (e.key === "Enter" && flatEntries[selected]) {
        e.preventDefault();
        handleSelectEntry(flatEntries[selected]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, flatEntries, selected, handleSelectEntry, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="text-muted-foreground/60">⌘K</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules and actions…"
            className="min-w-0 flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            autoFocus
          />
        </div>
        <div className="max-h-[60vh] overflow-auto py-2">
          {flatEntries.length === 0 && !recordLoading ? (
            <p className="px-4 py-6 text-center text-base text-muted-foreground/60">
              {query.trim().length >= 2 ? "No results. Try another search." : "No results. Try another search."}
            </p>
          ) : (
            <>
              {recordLoading && query.trim().length >= 2 && (
                <p className="px-4 py-2 text-[0.8125rem] text-muted-foreground/60">
                  Searching records…
                </p>
              )}
              {/* Recent searches (only when no query) */}
              {!query.trim() && recentItems.length > 0 && (
                <div className="mb-1">
                  <p
                    className="flex items-center gap-1.5 px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40"
                  >
                    <Clock className="h-3 w-3" />
                    Recent
                  </p>
                  {recentItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={`recent-${item.href}`}
                        href={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          selectAction(item);
                        }}
                        className="flex items-center gap-3 px-4 py-2 text-base text-muted-foreground"
                      >
                        <Icon className="h-4 w-4 shrink-0 opacity-50" />
                        <span className="text-[0.8125rem]">{item.label}</span>
                      </Link>
                    );
                  })}
                  <div className="mx-4 my-1 border-b border-border" />
                </div>
              )}

              {/* Grouped results: Records + Navigation + Quick Actions */}
              {groupStartIndices.map(({ group, index: startIdx }) => {
                const nextGroup = groupStartIndices.find((g) => g.index > startIdx);
                const endIdx = nextGroup ? nextGroup.index : flatEntries.length;
                const entries = flatEntries.slice(startIdx, endIdx);

                return (
                  <div key={group} className="mb-1">
                    <p
                      className="flex items-center gap-1.5 px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40"
                    >
                      {group === "Records" && <FileSearch className="h-3 w-3" />}
                      {group}
                    </p>
                    <ul>
                      {entries.map((entry, i) => {
                        const globalIdx = startIdx + i;
                        const isSelected = globalIdx === selected;
                        if (entry.type === "record") {
                          const { item } = entry;
                          return (
                            <li key={item.id}>
                              <Link
                                href={item.href}
                                onClick={(e) => {
                                  e.preventDefault();
                                  selectRecord(item);
                                }}
                                className={`flex items-center gap-3 px-4 py-2.5 text-base ${
                                  isSelected ? "border-l-4 border-l-primary bg-muted text-foreground" : "border-l-4 border-l-transparent text-muted-foreground"
                                }`}
                              >
                                <FileSearch className="h-5 w-5 shrink-0 opacity-70" />
                                <span className="truncate">{item.doctypeLabel}: {item.name}</span>
                              </Link>
                            </li>
                          );
                        }
                        const { item } = entry;
                        const Icon = item.icon;
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={(e) => {
                                e.preventDefault();
                                selectAction(item);
                              }}
                              className={`flex items-center gap-3 px-4 py-2.5 text-base ${
                                isSelected ? "border-l-4 border-l-primary bg-muted text-foreground" : "border-l-4 border-l-transparent text-muted-foreground"
                              }`}
                            >
                              <Icon className="h-5 w-5 shrink-0 opacity-70" />
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground/40">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
