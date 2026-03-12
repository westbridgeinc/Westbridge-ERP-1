"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MODULE_EMPTY_STATES, EMPTY_STATE_SUPPORT_LINE } from "@/lib/dashboard/empty-state-config";
import { formatCurrency } from "@/lib/locale/currency";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { useErpList } from "@/lib/queries/useErpList";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RawInvoice {
  name?: string;
  grand_total?: number;
  outstanding_amount?: number;
  posting_date?: string;
  due_date?: string;
  status?: string;
  customer?: string;
  customer_name?: string;
  docstatus?: number;
}

interface RawPayment {
  name?: string;
  paid_amount?: number;
  posting_date?: string;
  party?: string;
  party_name?: string;
  payment_type?: string;
  mode_of_payment?: string;
}

interface GenericRow {
  id: string;
  [key: string]: unknown;
}

type PageState = "loading" | "error" | "empty" | "success";

/* ------------------------------------------------------------------ */
/*  List-view mappers + columns                                        */
/* ------------------------------------------------------------------ */

function mapJournalEntry(d: Record<string, unknown>): GenericRow {
  return {
    id: String(d.name ?? ""),
    postingDate: String(d.posting_date ?? ""),
    voucherType: String(d.voucher_type ?? "\u2014"),
    totalDebit: Number(d.total_debit ?? 0),
    totalCredit: Number(d.total_credit ?? 0),
    status: String(d.docstatus === 1 ? "Submitted" : d.docstatus === 2 ? "Cancelled" : "Draft"),
  };
}

function mapAccount(d: Record<string, unknown>): GenericRow {
  return {
    id: String(d.name ?? ""),
    accountName: String(d.account_name ?? d.name ?? ""),
    accountType: String(d.account_type ?? "\u2014"),
    rootType: String(d.root_type ?? "\u2014"),
    isGroup: d.is_group ? "Yes" : "No",
  };
}

function mapPaymentEntry(d: Record<string, unknown>): GenericRow {
  return {
    id: String(d.name ?? ""),
    postingDate: String(d.posting_date ?? ""),
    paymentType: String(d.payment_type ?? "\u2014"),
    partyName: String(d.party_name ?? d.party ?? "\u2014"),
    paidAmount: Number(d.paid_amount ?? 0),
    modeOfPayment: String(d.mode_of_payment ?? "\u2014"),
  };
}

const journalColumns: Column<GenericRow>[] = [
  { id: "id", header: "Entry #", accessor: (r) => <span className="font-medium text-foreground">{r.id as string}</span>, sortValue: (r) => r.id },
  { id: "postingDate", header: "Date", accessor: (r) => <span className="text-muted-foreground/60">{r.postingDate as string}</span>, sortValue: (r) => r.postingDate as string },
  { id: "voucherType", header: "Voucher Type", accessor: (r) => <span className="text-muted-foreground">{r.voucherType as string}</span>, sortValue: (r) => r.voucherType as string },
  { id: "totalDebit", header: "Debit", align: "right", accessor: (r) => <span className="font-medium text-foreground">{formatCurrency(r.totalDebit as number, "USD")}</span>, sortValue: (r) => r.totalDebit as number },
  { id: "totalCredit", header: "Credit", align: "right", accessor: (r) => <span className="font-medium text-foreground">{formatCurrency(r.totalCredit as number, "USD")}</span>, sortValue: (r) => r.totalCredit as number },
  { id: "status", header: "Status", accessor: (r) => <Badge status={r.status as string}>{r.status as string}</Badge>, sortValue: (r) => r.status as string },
];

const accountColumns: Column<GenericRow>[] = [
  { id: "id", header: "Account ID", accessor: (r) => <span className="font-medium text-foreground">{r.id as string}</span>, sortValue: (r) => r.id },
  { id: "accountName", header: "Account Name", accessor: (r) => <span className="text-foreground">{r.accountName as string}</span>, sortValue: (r) => r.accountName as string },
  { id: "accountType", header: "Type", accessor: (r) => <span className="text-muted-foreground">{r.accountType as string}</span>, sortValue: (r) => r.accountType as string },
  { id: "rootType", header: "Root Type", accessor: (r) => <span className="text-muted-foreground">{r.rootType as string}</span>, sortValue: (r) => r.rootType as string },
  { id: "isGroup", header: "Group", accessor: (r) => <span className="text-muted-foreground/60">{r.isGroup as string}</span>, sortValue: (r) => r.isGroup as string },
];

const paymentColumns: Column<GenericRow>[] = [
  { id: "id", header: "Payment #", accessor: (r) => <span className="font-medium text-foreground">{r.id as string}</span>, sortValue: (r) => r.id },
  { id: "postingDate", header: "Date", accessor: (r) => <span className="text-muted-foreground/60">{r.postingDate as string}</span>, sortValue: (r) => r.postingDate as string },
  { id: "paymentType", header: "Type", accessor: (r) => <span className="text-muted-foreground">{r.paymentType as string}</span>, sortValue: (r) => r.paymentType as string },
  { id: "partyName", header: "Party", accessor: (r) => <span className="text-muted-foreground">{r.partyName as string}</span>, sortValue: (r) => r.partyName as string },
  { id: "paidAmount", header: "Amount", align: "right", accessor: (r) => <span className="font-medium text-foreground">{formatCurrency(r.paidAmount as number, "USD")}</span>, sortValue: (r) => r.paidAmount as number },
  { id: "modeOfPayment", header: "Mode", accessor: (r) => <span className="text-muted-foreground/60">{r.modeOfPayment as string}</span>, sortValue: (r) => r.modeOfPayment as string },
];

const LIST_TYPE_CONFIG: Record<string, { doctype: string; title: string; subtitle: string; columns: Column<GenericRow>[]; mapper: (d: Record<string, unknown>) => GenericRow }> = {
  journal: { doctype: "Journal Entry", title: "Journal Entries", subtitle: "General ledger journal entries", columns: journalColumns, mapper: mapJournalEntry },
  coa: { doctype: "Account", title: "Chart of Accounts", subtitle: "Your account structure", columns: accountColumns, mapper: mapAccount },
  payment: { doctype: "Payment Entry", title: "Payment Entries", subtitle: "Payments received and made", columns: paymentColumns, mapper: mapPaymentEntry },
};

/* ------------------------------------------------------------------ */
/*  List sub-view component                                            */
/* ------------------------------------------------------------------ */

function AccountingListView({ type }: { type: string }) {
  const router = useRouter();
  const config = LIST_TYPE_CONFIG[type]!;
  const [page, setPage] = useState(0);
  const { data: rawList = [], hasMore, page: currentPage, isLoading: loading, isError, error: queryError, refetch } = useErpList(config.doctype, { page });
  const data = useMemo(() => (rawList as Record<string, unknown>[]).map(config.mapper), [rawList, config.mapper]);
  const error = queryError instanceof Error ? queryError.message : isError ? `Failed to load ${config.title.toLowerCase()}.` : null;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display">{config.title}</h1>
            <p className="text-sm text-muted-foreground">{config.subtitle}</p>
          </div>
          <Button variant="primary" onClick={() => router.push("/dashboard/accounting/new")}>+ Create New</Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Calculator className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">Something went wrong</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{config.title}</h1>
          <p className="text-sm text-muted-foreground">{config.subtitle}</p>
        </div>
        <Button variant="primary" onClick={() => router.push("/dashboard/accounting/new")}>+ Create New</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <SkeletonTable rows={6} columns={config.columns.length} />
          ) : (
            <DataTable<GenericRow>
              columns={config.columns}
              data={data}
              keyExtractor={(r) => r.id}
              onRowClick={(record) => router.push(`/dashboard/accounting/${encodeURIComponent(record.id)}`)}
              emptyState={
                <EmptyState
                  icon={<Calculator className="h-6 w-6" />}
                  title={`No ${config.title.toLowerCase()} yet`}
                  description={`Create your first ${config.title.toLowerCase().replace(/s$/, "")} to get started.`}
                  actionLabel="Create New"
                  actionHref="/dashboard/accounting/new"
                  supportLine={EMPTY_STATE_SUPPORT_LINE}
                />
              }
              pageSize={20}
            />
          )}
          <div className="flex items-center justify-between border-t border-border px-4 py-2">
            <span className="text-sm text-muted-foreground">Page {currentPage + 1}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <AIChatPanel module="finance" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard helpers                                                  */
/* ------------------------------------------------------------------ */

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string): string {
  const [, m] = key.split("-");
  return MONTH_NAMES[parseInt(m, 10) - 1] ?? key;
}

function getLast6Months(): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function daysBetween(from: string, to: Date): number {
  const a = new Date(from);
  return Math.floor((to.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
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
            {entry.name}: {formatCurrency(entry.value, "USD")}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Fetch helper                                                       */
/* ------------------------------------------------------------------ */

async function fetchDoctype(doctype: string, limit: number, fields?: string[]): Promise<unknown[]> {
  const qs = new URLSearchParams({ doctype, limit: String(limit) });
  if (fields) qs.set("fields", JSON.stringify(fields));
  const res = await fetch(`${API_BASE}/api/erp/list?${qs.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  return (body?.data as unknown[]) ?? [];
}

/* ------------------------------------------------------------------ */
/*  Dashboard sub-view                                                 */
/* ------------------------------------------------------------------ */

function AccountingDashboard() {
  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [salesInvoices, setSalesInvoices] = useState<RawInvoice[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<RawInvoice[]>([]);
  const [payments, setPayments] = useState<RawPayment[]>([]);

  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setState("loading");
      setErrorMessage(null);
      try {
        const [si, pi, pe] = await Promise.all([
          fetchDoctype("Sales Invoice", 200, ["name", "posting_date", "due_date", "grand_total", "outstanding_amount", "status", "customer_name", "docstatus", "modified", "creation"]),
          fetchDoctype("Purchase Invoice", 200, ["name", "posting_date", "grand_total", "status", "docstatus"]),
          fetchDoctype("Payment Entry", 50, ["name", "posting_date", "paid_amount", "party", "party_name", "payment_type", "mode_of_payment"]),
        ]);
        if (cancelled) return;
        const siList = si as RawInvoice[];
        const piList = pi as RawInvoice[];
        const peList = pe as RawPayment[];

        if (siList.length === 0 && piList.length === 0 && peList.length === 0) {
          setState("empty");
          return;
        }

        setSalesInvoices(siList);
        setPurchaseInvoices(piList);
        setPayments(peList);
        setState("success");
      } catch {
        if (!cancelled) {
          setState("error");
          setErrorMessage("Failed to load accounting data. Please try again.");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [fetchKey]);

  const loadData = () => setFetchKey((k) => k + 1);

  const now = new Date();
  const yearStart = `${now.getFullYear()}-01-01`;

  const paidSalesYTD = useMemo(
    () => salesInvoices.filter((inv) => inv.status === "Paid" && (inv.posting_date ?? "") >= yearStart),
    [salesInvoices, yearStart]
  );

  const paidPurchasesYTD = useMemo(
    () => purchaseInvoices.filter((inv) => (inv.status === "Paid" || inv.status === "Unpaid") && (inv.posting_date ?? "") >= yearStart),
    [purchaseInvoices, yearStart]
  );

  const revenueYTD = useMemo(() => paidSalesYTD.reduce((sum, inv) => sum + (inv.grand_total ?? 0), 0), [paidSalesYTD]);
  const expensesYTD = useMemo(() => paidPurchasesYTD.reduce((sum, inv) => sum + (inv.grand_total ?? 0), 0), [paidPurchasesYTD]);
  const netProfit = revenueYTD - expensesYTD;

  const barData = useMemo(() => {
    const months = getLast6Months();
    const revByMonth: Record<string, number> = {};
    const expByMonth: Record<string, number> = {};
    months.forEach((m) => { revByMonth[m] = 0; expByMonth[m] = 0; });

    salesInvoices.forEach((inv) => {
      if (inv.posting_date && (inv.status === "Paid" || inv.docstatus === 1)) {
        const key = getMonthKey(inv.posting_date);
        if (revByMonth[key] !== undefined) revByMonth[key] += inv.grand_total ?? 0;
      }
    });

    purchaseInvoices.forEach((inv) => {
      if (inv.posting_date && (inv.status === "Paid" || inv.docstatus === 1)) {
        const key = getMonthKey(inv.posting_date);
        if (expByMonth[key] !== undefined) expByMonth[key] += inv.grand_total ?? 0;
      }
    });

    return months.map((m) => ({ month: getMonthLabel(m), revenue: revByMonth[m], expenses: expByMonth[m] }));
  }, [salesInvoices, purchaseInvoices]);

  const maxBarValue = useMemo(() => {
    let max = 0;
    barData.forEach((d) => { if (d.revenue > max) max = d.revenue; if (d.expenses > max) max = d.expenses; });
    return max > 0 ? max * 1.15 : 100;
  }, [barData]);

  const agingData = useMemo(() => {
    const unpaid = salesInvoices.filter((inv) => inv.status === "Unpaid" || inv.status === "Overdue");
    const buckets = [
      { label: "Current (0-30)", amount: 0 },
      { label: "31-60 days", amount: 0 },
      { label: "61-90 days", amount: 0 },
      { label: "91-120 days", amount: 0 },
      { label: "120+ days", amount: 0 },
    ];
    const today = new Date();
    unpaid.forEach((inv) => {
      const outstanding = inv.outstanding_amount ?? inv.grand_total ?? 0;
      const dueDate = inv.due_date ?? inv.posting_date;
      if (!dueDate) return;
      const overdue = daysBetween(dueDate, today);
      if (overdue <= 30) buckets[0].amount += outstanding;
      else if (overdue <= 60) buckets[1].amount += outstanding;
      else if (overdue <= 90) buckets[2].amount += outstanding;
      else if (overdue <= 120) buckets[3].amount += outstanding;
      else buckets[4].amount += outstanding;
    });
    const total = buckets.reduce((s, b) => s + b.amount, 0);
    return { buckets, total };
  }, [salesInvoices]);

  const chartSubtitle = useMemo(() => {
    const months = getLast6Months();
    if (months.length < 2) return "";
    return `Monthly (${getMonthLabel(months[0])} \u2013 ${getMonthLabel(months[months.length - 1])})`;
  }, []);

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display">Accounting</h1>
        <p className="text-sm text-muted-foreground">General ledger and financial overview</p>
      </div>
      <Link href="/dashboard/accounting?type=journal">
        <Button variant="primary">+ New Journal Entry</Button>
      </Link>
    </div>
  );

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

  if (state === "loading") {
    return (
      <div className="space-y-6">
        {header}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full rounded-lg" /></CardContent></Card>
        <Card><CardContent className="p-6"><Skeleton className="h-44 w-full rounded-lg" /></CardContent></Card>
      </div>
    );
  }

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
            <Button variant="primary" size="sm" className="mt-4" onClick={loadData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard label="Revenue YTD" value={formatCurrency(revenueYTD, "USD")} subtext={`${paidSalesYTD.length} paid invoices`} subtextVariant="muted" />
        <MetricCard label="Expenses YTD" value={formatCurrency(expensesYTD, "USD")} subtext={`${paidPurchasesYTD.length} paid bills`} subtextVariant="muted" />
        <MetricCard label="Net Profit" value={formatCurrency(netProfit, "USD")} subtext={revenueYTD > 0 ? `${((netProfit / revenueYTD) * 100).toFixed(1)}% margin` : undefined} subtextVariant={netProfit >= 0 ? "success" : "error"} />
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-base font-semibold text-foreground font-display">Revenue vs Expenses</p>
          <p className="text-sm text-muted-foreground/60">{chartSubtitle}</p>
          <div className="mt-4 h-64 min-h-[256px] w-full">
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <YAxis hide domain={[0, maxBarValue]} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
                <Legend wrapperStyle={{ color: "var(--muted-foreground)", fontSize: 12 }} />
                <Bar dataKey="revenue" name="Revenue" fill="var(--primary)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="var(--border)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="text-base font-semibold text-foreground font-display">Accounts Receivable Aging</p>
          {agingData.total === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No outstanding receivables.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {agingData.buckets.map((row) => (
                <div key={row.label} className="flex items-center gap-4">
                  <span className="w-28 text-sm text-muted-foreground">{row.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${agingData.total > 0 ? (row.amount / agingData.total) * 100 : 0}%` }} />
                  </div>
                  <span className="w-28 text-right text-sm font-medium text-foreground">{formatCurrency(row.amount, "USD")}</span>
                  <span className="w-12 text-right text-xs text-muted-foreground">{agingData.total > 0 ? `${((row.amount / agingData.total) * 100).toFixed(0)}%` : "0%"}</span>
                </div>
              ))}
              <div className="flex items-center gap-4 border-t border-border pt-2">
                <span className="w-28 text-sm font-medium text-foreground">Total</span>
                <div className="h-2 flex-1" />
                <span className="w-28 text-right text-sm font-semibold text-foreground">{formatCurrency(agingData.total, "USD")}</span>
                <span className="w-12 text-right text-xs text-muted-foreground">100%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {payments.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <p className="text-base font-semibold text-foreground font-display">Recent Payments</p>
            <div className="mt-4 space-y-2">
              {payments.slice(0, 10).map((pe) => (
                <div key={pe.name} className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-2.5">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{pe.party_name ?? pe.party ?? "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">
                      {pe.posting_date ?? ""} {pe.payment_type ? `\u00b7 ${pe.payment_type}` : ""} {pe.mode_of_payment ? `\u00b7 ${pe.mode_of_payment}` : ""}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(pe.paid_amount ?? 0, "USD")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AIChatPanel module="finance" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component — routes based on ?type=                            */
/* ------------------------------------------------------------------ */

export default function AccountingPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  if (type && LIST_TYPE_CONFIG[type]) {
    return <AccountingListView type={type} />;
  }

  return <AccountingDashboard />;
}
