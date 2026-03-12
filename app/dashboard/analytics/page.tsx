"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { BarChart3, FolderKanban, CheckSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
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
  status?: string;
  customer?: string;
  customer_name?: string;
  docstatus?: number;
  items?: Array<{ item_group?: string; amount?: number }>;
}

interface GenericRow {
  id: string;
  [key: string]: unknown;
}

type PageState = "loading" | "error" | "empty" | "success";

/* ------------------------------------------------------------------ */
/*  Project / Task / Timesheet mappers + columns                       */
/* ------------------------------------------------------------------ */

function mapProject(d: Record<string, unknown>): GenericRow {
  return {
    id: String(d.name ?? ""),
    projectName: String(d.project_name ?? d.name ?? ""),
    status: String(d.status ?? "Open"),
    percentComplete: Number(d.percent_complete ?? 0),
    expectedEndDate: String(d.expected_end_date ?? ""),
    company: String(d.company ?? "\u2014"),
  };
}

function mapTask(d: Record<string, unknown>): GenericRow {
  return {
    id: String(d.name ?? ""),
    subject: String(d.subject ?? d.name ?? ""),
    project: String(d.project ?? "\u2014"),
    status: String(d.status ?? "Open"),
    priority: String(d.priority ?? "Medium"),
    assignedTo: String(d._assign ?? "\u2014"),
  };
}

function mapTimesheet(d: Record<string, unknown>): GenericRow {
  return {
    id: String(d.name ?? ""),
    employee: String(d.employee_name ?? d.employee ?? "\u2014"),
    totalHours: Number(d.total_hours ?? 0),
    startDate: String(d.start_date ?? ""),
    endDate: String(d.end_date ?? ""),
    status: String(d.docstatus === 1 ? "Submitted" : d.docstatus === 2 ? "Cancelled" : "Draft"),
  };
}

const projectColumns: Column<GenericRow>[] = [
  { id: "id", header: "Project ID", accessor: (r) => <span className="font-medium text-foreground">{r.id as string}</span>, sortValue: (r) => r.id },
  { id: "projectName", header: "Project Name", accessor: (r) => <span className="text-foreground">{r.projectName as string}</span>, sortValue: (r) => r.projectName as string },
  { id: "status", header: "Status", accessor: (r) => <Badge status={r.status as string}>{r.status as string}</Badge>, sortValue: (r) => r.status as string },
  { id: "percentComplete", header: "Progress", align: "right", accessor: (r) => <span className="text-muted-foreground">{r.percentComplete as number}%</span>, sortValue: (r) => r.percentComplete as number },
  { id: "expectedEndDate", header: "End Date", accessor: (r) => <span className="text-muted-foreground/60">{r.expectedEndDate as string || "\u2014"}</span>, sortValue: (r) => r.expectedEndDate as string },
];

const taskColumns: Column<GenericRow>[] = [
  { id: "id", header: "Task ID", accessor: (r) => <span className="font-medium text-foreground">{r.id as string}</span>, sortValue: (r) => r.id },
  { id: "subject", header: "Subject", accessor: (r) => <span className="text-foreground">{r.subject as string}</span>, sortValue: (r) => r.subject as string },
  { id: "project", header: "Project", accessor: (r) => <span className="text-muted-foreground">{r.project as string}</span>, sortValue: (r) => r.project as string },
  { id: "status", header: "Status", accessor: (r) => <Badge status={r.status as string}>{r.status as string}</Badge>, sortValue: (r) => r.status as string },
  { id: "priority", header: "Priority", accessor: (r) => <span className="text-muted-foreground">{r.priority as string}</span>, sortValue: (r) => r.priority as string },
];

const timesheetColumns: Column<GenericRow>[] = [
  { id: "id", header: "Timesheet #", accessor: (r) => <span className="font-medium text-foreground">{r.id as string}</span>, sortValue: (r) => r.id },
  { id: "employee", header: "Employee", accessor: (r) => <span className="text-foreground">{r.employee as string}</span>, sortValue: (r) => r.employee as string },
  { id: "totalHours", header: "Hours", align: "right", accessor: (r) => <span className="text-muted-foreground">{(r.totalHours as number).toFixed(1)}</span>, sortValue: (r) => r.totalHours as number },
  { id: "startDate", header: "Start", accessor: (r) => <span className="text-muted-foreground/60">{r.startDate as string || "\u2014"}</span>, sortValue: (r) => r.startDate as string },
  { id: "endDate", header: "End", accessor: (r) => <span className="text-muted-foreground/60">{r.endDate as string || "\u2014"}</span>, sortValue: (r) => r.endDate as string },
  { id: "status", header: "Status", accessor: (r) => <Badge status={r.status as string}>{r.status as string}</Badge>, sortValue: (r) => r.status as string },
];

const PROJECT_TYPE_CONFIG: Record<string, { doctype: string; title: string; subtitle: string; icon: React.ReactNode; columns: Column<GenericRow>[]; mapper: (d: Record<string, unknown>) => GenericRow }> = {
  project: { doctype: "Project", title: "Projects", subtitle: "Manage your projects", icon: <FolderKanban className="h-6 w-6" />, columns: projectColumns, mapper: mapProject },
  task: { doctype: "Task", title: "Tasks", subtitle: "Track project tasks", icon: <CheckSquare className="h-6 w-6" />, columns: taskColumns, mapper: mapTask },
  timesheet: { doctype: "Timesheet", title: "Timesheets", subtitle: "Track time spent on projects", icon: <Clock className="h-6 w-6" />, columns: timesheetColumns, mapper: mapTimesheet },
};

/* ------------------------------------------------------------------ */
/*  Projects list sub-view                                             */
/* ------------------------------------------------------------------ */

function ProjectsListView({ type }: { type: string }) {
  const router = useRouter();
  const config = PROJECT_TYPE_CONFIG[type]!;
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
          <Button variant="primary" onClick={() => router.push("/dashboard/analytics/new")}>+ Create New</Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              {config.icon}
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
        <Button variant="primary" onClick={() => router.push("/dashboard/analytics/new")}>+ Create New</Button>
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
              onRowClick={(record) => router.push(`/dashboard/analytics/${encodeURIComponent(record.id)}`)}
              emptyState={
                <EmptyState
                  icon={config.icon}
                  title={`No ${config.title.toLowerCase()} yet`}
                  description={`Create your first ${config.title.toLowerCase().replace(/s$/, "")} to get started.`}
                  actionLabel="Create New"
                  actionHref="/dashboard/analytics/new"
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
      <AIChatPanel module="projects" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Analytics helpers                                                  */
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

function getLast12Months(): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
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
/*  Analytics dashboard sub-view                                       */
/* ------------------------------------------------------------------ */

function AnalyticsDashboard() {
  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [salesInvoices, setSalesInvoices] = useState<RawInvoice[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<RawInvoice[]>([]);

  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setState("loading");
      setErrorMessage(null);
      try {
        const [si, pi] = await Promise.all([
          fetchDoctype("Sales Invoice", 500, ["name", "posting_date", "grand_total", "outstanding_amount", "status", "customer", "customer_name", "docstatus"]),
          fetchDoctype("Purchase Invoice", 200, ["name", "posting_date", "grand_total", "status", "docstatus"]),
        ]);
        if (cancelled) return;
        const siList = si as RawInvoice[];
        const piList = pi as RawInvoice[];

        if (siList.length === 0 && piList.length === 0) {
          setState("empty");
          return;
        }

        setSalesInvoices(siList);
        setPurchaseInvoices(piList);
        setState("success");
      } catch {
        if (!cancelled) {
          setState("error");
          setErrorMessage("Failed to load analytics data. Please try again.");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [fetchKey]);

  const loadData = () => setFetchKey((k) => k + 1);

  const revenueTrend = useMemo(() => {
    const months = getLast12Months();
    const byMonth: Record<string, number> = {};
    months.forEach((m) => { byMonth[m] = 0; });

    salesInvoices.forEach((inv) => {
      if (inv.posting_date && (inv.status === "Paid" || inv.docstatus === 1)) {
        const key = getMonthKey(inv.posting_date);
        if (byMonth[key] !== undefined) byMonth[key] += inv.grand_total ?? 0;
      }
    });

    return months.map((m) => ({ month: getMonthLabel(m), value: byMonth[m] }));
  }, [salesInvoices]);

  const maxRevTrend = useMemo(() => {
    let max = 0;
    revenueTrend.forEach((d) => { if (d.value > max) max = d.value; });
    return max > 0 ? max * 1.15 : 100;
  }, [revenueTrend]);

  const topCustomers = useMemo(() => {
    const byCustomer: Record<string, { name: string; total: number }> = {};
    salesInvoices.forEach((inv) => {
      if (inv.status === "Paid" || inv.docstatus === 1) {
        const custName = inv.customer_name ?? inv.customer ?? "Unknown";
        if (!byCustomer[custName]) byCustomer[custName] = { name: custName, total: 0 };
        byCustomer[custName].total += inv.grand_total ?? 0;
      }
    });
    return Object.values(byCustomer).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [salesInvoices]);

  const revenueByCategory = useMemo(() => {
    const byGroup: Record<string, number> = {};
    let hasItemGroups = false;

    salesInvoices.forEach((inv) => {
      if (inv.status === "Paid" || inv.docstatus === 1) {
        if (inv.items && Array.isArray(inv.items) && inv.items.length > 0) {
          inv.items.forEach((item) => {
            if (item.item_group) {
              hasItemGroups = true;
              byGroup[item.item_group] = (byGroup[item.item_group] ?? 0) + (item.amount ?? 0);
            }
          });
        }
      }
    });

    if (!hasItemGroups) {
      salesInvoices.forEach((inv) => {
        if (inv.status === "Paid" || inv.docstatus === 1) {
          const group = inv.customer_name ?? inv.customer ?? "Other";
          byGroup[group] = (byGroup[group] ?? 0) + (inv.grand_total ?? 0);
        }
      });
    }

    return Object.entries(byGroup).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [salesInvoices]);

  const totalRevenue = useMemo(
    () => salesInvoices.filter((inv) => inv.status === "Paid" || inv.docstatus === 1).reduce((sum, inv) => sum + (inv.grand_total ?? 0), 0),
    [salesInvoices]
  );

  const totalExpenses = useMemo(
    () => purchaseInvoices.filter((inv) => inv.status === "Paid" || inv.docstatus === 1).reduce((sum, inv) => sum + (inv.grand_total ?? 0), 0),
    [purchaseInvoices]
  );

  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

  const overdueCount = useMemo(
    () => salesInvoices.filter((inv) => inv.status === "Overdue" || inv.status === "Unpaid").length,
    [salesInvoices]
  );

  const outstandingTotal = useMemo(
    () => salesInvoices.filter((inv) => inv.status === "Overdue" || inv.status === "Unpaid").reduce((sum, inv) => sum + (inv.outstanding_amount ?? inv.grand_total ?? 0), 0),
    [salesInvoices]
  );

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display">Analytics</h1>
        <p className="text-sm text-muted-foreground">Reports and business intelligence</p>
      </div>
    </div>
  );

  if (state === "empty") {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={<BarChart3 className="h-6 w-6" />}
              title={MODULE_EMPTY_STATES.analytics.title}
              description={MODULE_EMPTY_STATES.analytics.description}
              actionLabel={MODULE_EMPTY_STATES.analytics.actionLabel}
              actionHref={MODULE_EMPTY_STATES.analytics.actionLink}
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full rounded-lg" /></CardContent></Card>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card><CardContent className="p-6"><Skeleton className="h-48 w-full rounded-lg" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-48 w-full rounded-lg" /></CardContent></Card>
        </div>
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
              <BarChart3 className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">Something went wrong</p>
            <p className="mt-1 text-sm text-muted-foreground">{errorMessage ?? "Failed to load analytics data."}</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={loadData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Revenue" value={formatCurrency(totalRevenue, "USD")} subtext={`${salesInvoices.filter((i) => i.status === "Paid" || i.docstatus === 1).length} paid invoices`} subtextVariant="muted" />
        <MetricCard label="Expenses" value={formatCurrency(totalExpenses, "USD")} subtext={`${purchaseInvoices.filter((i) => i.status === "Paid" || i.docstatus === 1).length} paid bills`} subtextVariant="muted" />
        <MetricCard label="Profit Margin" value={`${profitMargin.toFixed(1)}%`} subtext={totalRevenue > 0 ? `${formatCurrency(totalRevenue - totalExpenses, "USD")} net` : undefined} subtextVariant={profitMargin >= 0 ? "success" : "error"} />
        <MetricCard label="Outstanding" value={formatCurrency(outstandingTotal, "USD")} subtext={overdueCount > 0 ? `${overdueCount} invoices overdue` : "No overdue invoices"} subtextVariant={overdueCount > 0 ? "error" : "success"} />
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-xl font-semibold text-foreground font-display">Revenue Trend</p>
          <p className="mt-0.5 text-sm text-muted-foreground">Last 12 months</p>
          <div className="mt-4 h-64 min-h-[256px] w-full">
            <ResponsiveContainer width="100%" height={256}>
              <AreaChart data={revenueTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRevAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <YAxis hide domain={[0, maxRevTrend]} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value ?? 0), "USD"), "Revenue"]}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.25rem", color: "var(--foreground)" }}
                  labelStyle={{ color: "var(--muted-foreground)" }}
                />
                <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} fill="url(#fillRevAnalytics)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <p className="text-xl font-semibold text-foreground font-display">Top Customers by Revenue</p>
            {topCustomers.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No customer data available.</p>
            ) : (
              <ul className="mt-4 space-y-3 text-base">
                {topCustomers.map((c, i) => (
                  <li key={c.name} className="flex items-center justify-between">
                    <span className="text-muted-foreground/60">{i + 1}.</span>
                    <span className="flex-1 pl-2 text-foreground">{c.name}</span>
                    <span className="font-medium text-foreground">{formatCurrency(c.total, "USD")}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-xl font-semibold text-foreground font-display">Revenue by Category</p>
            {revenueByCategory.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No category data available.</p>
            ) : (
              <div className="mt-4 h-48 min-h-[192px] w-full">
                <ResponsiveContainer width="100%" height={192}>
                  <BarChart data={revenueByCategory} layout="vertical" margin={{ top: 0, right: 0, left: 80, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={80} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value ?? 0), "USD"), "Revenue"]}
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.25rem", color: "var(--foreground)" }}
                    />
                    <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component — routes based on ?type=                            */
/* ------------------------------------------------------------------ */

function AnalyticsPageContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  // Projects section in sidebar maps here via ?type=project/task/timesheet
  if (type && PROJECT_TYPE_CONFIG[type]) {
    return <ProjectsListView type={type} />;
  }

  // Default: show the Analytics dashboard with revenue trends, top customers, etc.
  return <AnalyticsDashboard />;
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display">Analytics</h1>
          <p className="text-sm text-muted-foreground">Reports and business intelligence</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    }>
      <AnalyticsPageContent />
    </Suspense>
  );
}
