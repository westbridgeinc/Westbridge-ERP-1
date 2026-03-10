"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  Loader2,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
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

const NAVIGATION_ACTIONS: ActionItem[] = [
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
];

const QUICK_ACTIONS: ActionItem[] = [
  { label: "New Invoice", href: "/dashboard/invoices?action=new", icon: Plus, group: "Quick Actions" },
  { label: "New Quote", href: "/dashboard/quotations?action=new", icon: Plus, group: "Quick Actions" },
  { label: "New Purchase Order", href: "/dashboard/procurement?action=new", icon: Plus, group: "Quick Actions" },
];

const RECENT_KEY = "wb_cmd_recent";
const MAX_RECENT = 5;

const ALL_ACTIONS = [...NAVIGATION_ACTIONS, ...QUICK_ACTIONS];

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

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [recordResults, setRecordResults] = useState<RecordItem[]>([]);
  const [recordLoading, setRecordLoading] = useState(false);
  const recordAbortRef = useRef<AbortController | null>(null);

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

  useEffect(() => {
    if (!open) {
      setQuery("");
      setRecordResults([]);
    }
  }, [open]);

  const recentHrefs = getRecent();
  const recentItems = useMemo(
    () => recentHrefs.map((h) => ALL_ACTIONS.find((a) => a.href === h)).filter(Boolean) as ActionItem[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recentHrefs.join(",")]
  );

  const handleSelect = useCallback(
    (href: string) => {
      saveRecent(href);
      router.push(href);
      onClose();
    },
    [router, onClose]
  );

  return (
    <CommandDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <CommandInput
        placeholder="Search modules, actions, and records…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {recordLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Searching records…
            </span>
          ) : (
            "No results found."
          )}
        </CommandEmpty>

        {recordResults.length > 0 && (
          <CommandGroup heading="Records">
            {recordResults.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.doctypeLabel}: ${item.name}`}
                onSelect={() => handleSelect(item.href)}
              >
                <FileSearch className="mr-2 size-4 shrink-0 opacity-70" />
                <span className="truncate">
                  {item.doctypeLabel}: {item.name}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!query.trim() && recentItems.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recentItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={`recent-${item.href}`}
                    value={`recent-${item.label}`}
                    onSelect={() => handleSelect(item.href)}
                  >
                    <Clock className="mr-2 size-4 shrink-0 opacity-50" />
                    {item.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Navigation">
          {NAVIGATION_ACTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => handleSelect(item.href)}
              >
                <Icon className="mr-2 size-4 shrink-0 opacity-70" />
                {item.label}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          {QUICK_ACTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => handleSelect(item.href)}
              >
                <Icon className="mr-2 size-4 shrink-0 opacity-70" />
                {item.label}
              </CommandItem>
            );
          })}
        </CommandGroup>

        {recordLoading && query.trim().length >= 2 && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Searching records…
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}
