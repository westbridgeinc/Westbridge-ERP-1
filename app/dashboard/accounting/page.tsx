"use client";

export const dynamic = "force-dynamic";

/**
 * Accounting / GL overview page.
 *
 * NOTE: this is one of the original pages from the v0.4 sprint and hasn't been
 * refactored to the current component patterns yet. Specifically:
 *   - still uses raw fetch() instead of useErpList()
 *   - summary cards are inline JSX rather than using the shared MetricCard component
 *   - no error boundary — a failed ERP fetch shows a generic message with no retry UI
 *
 * It works and we're not breaking anything, but if you're adding a feature here
 * please migrate it to the new patterns at the same time. See CONTRIBUTING.md §4.
 *
 * TODO: also needs a "Reconciliation" section once we wire up the GL entry endpoints.
 *       Currently blocked on ERPNext permission scoping for Journal Entry doctype.
 */

import { useState, useCallback, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard, SkeletonChart } from "@/components/ui/Skeleton";
import { MODULE_EMPTY_STATES, EMPTY_STATE_SUPPORT_LINE } from "@/lib/dashboard/empty-state-config";
import { formatCurrency } from "@/lib/locale/currency";
import { AIChatPanel } from "@/components/ai/AIChatPanel";

/* ------------------------------------------------------------------ */
/*  Sample data — displayed when ERP accounts are present but the      */
/*  GL endpoints are not yet wired up. Clearly labelled in the UI.     */
/* ------------------------------------------------------------------ */

const barData = [
  { month: "Sep", revenue: 2.8, expenses: 1.8 },
  { month: "Oct", revenue: 3.1, expenses: 2.0 },
  { month: "Nov", revenue: 2.9, expenses: 1.9 },
  { month: "Dec", revenue: 3.4, expenses: 2.2 },
  { month: "Jan", revenue: 3.0, expenses: 2.0 },
  { month: "Feb", revenue: 3.2, expenses: 2.1 },
];

const aging = [
  { label: "Current", amount: 1.2, total: 2.8 },
  { label: "1-30 days", amount: 0.8, total: 2.8 },
  { label: "31-60 days", amount: 0.45, total: 2.8 },
  { label: "61-90 days", amount: 0.2, total: 2.8 },
  { label: "90+ days", amount: 0.15, total: 2.8 },
];

const metrics = [
  { label: "Revenue YTD", value: 18_400_000, variant: "default" as const },
  { label: "Expenses YTD", value: 12_100_000, variant: "default" as const },
  { label: "Net Profit", value: 6_300_000, variant: "success" as const },
];

/* ------------------------------------------------------------------ */
/*  Metric card                                                        */
/* ------------------------------------------------------------------ */

function MetricCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: "default" | "success";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">
        {variant === "success" ? (
          <span className="text-success">{formatCurrency(value, "USD")}</span>
        ) : (
          formatCurrency(value, "USD")
        )}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom tooltip for Recharts                                        */
/* ------------------------------------------------------------------ */

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-muted-foreground">
            {entry.name}: {formatCurrency(entry.value * 1_000_000, "USD")}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  States                                                             */
/* ------------------------------------------------------------------ */

type PageState = "loading" | "error" | "empty" | "success";

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AccountingPage() {
  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/erp/list?doctype=Account&limit_page_length=1")
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          setState("empty");
          return;
        }
        return res.json();
      })
      .then((json) => {
        if (cancelled || json === undefined) return;
        const data = json?.data;
        const hasAccounts = Array.isArray(data) && data.length > 0;
        setState(hasAccounts ? "success" : "empty");
      })
      .catch(() => {
        if (!cancelled) setState("empty");
      });
    return () => { cancelled = true; };
  }, []);

  const retry = useCallback(() => {
    setErrorMessage(null);
    setState("loading");
    // Re-run the same fetch used in the initial useEffect
    fetch("/api/erp/list?doctype=Account&limit_page_length=1")
      .then((res) => {
        if (!res.ok) { setState("empty"); return; }
        return res.json();
      })
      .then((json) => {
        if (json === undefined) return;
        const hasAccounts = Array.isArray(json?.data) && json.data.length > 0;
        setState(hasAccounts ? "success" : "empty");
      })
      .catch(() => {
        setState("error");
        setErrorMessage("Failed to load accounting data.");
      });
  }, []);

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Accounting</h1>
        <p className="text-sm text-muted-foreground">General ledger and financial overview</p>
      </div>
      <Button variant="primary">+ Create New</Button>
    </div>
  );

  /* ---------- Empty state (no chart of accounts) ---------- */
  if (state === "empty") {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={<Calculator className="h-6 w-6" />}
              title={MODULE_EMPTY_STATES.accounting.title}
              description={MODULE_EMPTY_STATES.accounting.description}
              actionLabel={MODULE_EMPTY_STATES.accounting.actionLabel}
              actionHref={MODULE_EMPTY_STATES.accounting.actionLink}
              supportLine={EMPTY_STATE_SUPPORT_LINE}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------- Loading state ---------- */
  if (state === "loading") {
    return (
      <div className="space-y-6">
        {header}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <Card>
          <CardContent className="p-6">
            <SkeletonChart height={256} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <SkeletonChart height={180} />
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------- Error state ---------- */
  if (state === "error") {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Calculator className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">Something went wrong</p>
            <p className="mt-1 text-sm text-muted-foreground">{errorMessage ?? "Failed to load accounting data."}</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={retry}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------- Success state ---------- */
  return (
    <div className="space-y-6">
      {header}
      <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning">
        <span className="shrink-0">⚠</span>
        <span>
          <strong>Sample data</strong> — financial figures shown here are illustrative. Full GL reconciliation will be available once ERP Journal Entry endpoints are connected.
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {metrics.map((m) => (
          <MetricCard
            key={m.label}
            label={m.label}
            value={m.value}
            variant={m.variant}
          />
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
        <p className="text-base font-semibold text-foreground">
          Revenue vs Expenses
        </p>
        <p className="text-sm text-muted-foreground/60">
          Monthly (Sep &ndash; Feb)
        </p>
        <div className="mt-4 h-64 min-h-[256px] w-full">
          <ResponsiveContainer width="100%" height={256}>
            <BarChart
              data={barData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground) / 0.6)" }}
              />
              <YAxis
                hide
                domain={[0, 4]}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "var(--muted)" }}
              />
              <Legend
                wrapperStyle={{ color: "var(--muted-foreground)", fontSize: 12 }}
              />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="var(--primary)"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="var(--border)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
        <p className="text-base font-semibold text-foreground">
          Accounts Receivable Aging
        </p>
        <div className="mt-4 space-y-3">
          {aging.map((row) => (
            <div key={row.label} className="flex items-center gap-4">
              <span className="w-24 text-sm text-muted-foreground">
                {row.label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${(row.amount / row.total) * 100}%`,
                  }}
                />
              </div>
              <span className="w-24 text-right text-sm font-medium text-foreground">
                {formatCurrency(row.amount * 1_000_000, "USD")}
              </span>
            </div>
          ))}
        </div>
        </CardContent>
      </Card>
      <AIChatPanel module="finance" />
    </div>
  );
}
