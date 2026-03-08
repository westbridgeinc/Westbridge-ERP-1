"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { DollarSign } from "lucide-react";
import { MODULE_EMPTY_STATES, EMPTY_STATE_SUPPORT_LINE } from "@/lib/dashboard/empty-state-config";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/locale/currency";
import { formatDate } from "@/lib/locale/date";
import { AIChatPanel } from "@/components/ai/AIChatPanel";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PayrollRecord {
  id: string;
  employee: string;
  period: string;        // ISO date or display string
  grossPay: number;
  deductions: number;
  netPay: number;
  status: "Processed" | "Pending" | "Rejected";
}

interface PayrollStats {
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  headcount: number;
}

/* ------------------------------------------------------------------ */
/*  Demo data (swap for API call in production)                        */
/* ------------------------------------------------------------------ */

const DEMO_RECORDS: PayrollRecord[] = [
  { id: "PAY-001", employee: "Priya Ramdeen", period: "2025-02-28", grossPay: 285000, deductions: 82700, netPay: 202300, status: "Processed" },
  { id: "PAY-002", employee: "Devendra Singh", period: "2025-02-28", grossPay: 320000, deductions: 92800, netPay: 227200, status: "Processed" },
  { id: "PAY-003", employee: "Shantelle Williams", period: "2025-02-28", grossPay: 310000, deductions: 89900, netPay: 220100, status: "Processed" },
  { id: "PAY-004", employee: "Rajiv Persaud", period: "2025-02-28", grossPay: 295000, deductions: 85600, netPay: 209400, status: "Processed" },
  { id: "PAY-005", employee: "Camille Thomas", period: "2025-02-28", grossPay: 268000, deductions: 77700, netPay: 190300, status: "Pending" },
  { id: "PAY-006", employee: "Akash Doobay", period: "2025-02-28", grossPay: 275000, deductions: 79800, netPay: 195200, status: "Processed" },
];

function deriveStats(records: PayrollRecord[]): PayrollStats {
  return records.reduce(
    (acc, r) => ({
      totalGross: acc.totalGross + r.grossPay,
      totalDeductions: acc.totalDeductions + r.deductions,
      totalNet: acc.totalNet + r.netPay,
      headcount: acc.headcount + 1,
    }),
    { totalGross: 0, totalDeductions: 0, totalNet: 0, headcount: 0 },
  );
}

/* ------------------------------------------------------------------ */
/*  Columns                                                            */
/* ------------------------------------------------------------------ */

const columns: Column<PayrollRecord>[] = [
  {
    id: "employee",
    header: "Employee",
    accessor: (row) => (
      <span className="font-medium text-foreground">{row.employee}</span>
    ),
    sortValue: (row) => row.employee,
  },
  {
    id: "period",
    header: "Period",
    accessor: (row) => (
      <span className="text-muted-foreground">{formatDate(row.period)}</span>
    ),
    sortValue: (row) => row.period,
  },
  {
    id: "grossPay",
    header: "Gross Pay",
    align: "right",
    accessor: (row) => (
      <span className="text-muted-foreground">{formatCurrency(row.grossPay)}</span>
    ),
    sortValue: (row) => row.grossPay,
  },
  {
    id: "deductions",
    header: "Deductions",
    align: "right",
    accessor: (row) => (
      <span className="text-muted-foreground/60">{formatCurrency(row.deductions)}</span>
    ),
    sortValue: (row) => row.deductions,
  },
  {
    id: "netPay",
    header: "Net Pay",
    align: "right",
    accessor: (row) => (
      <span className="font-medium text-foreground">
        {formatCurrency(row.netPay)}
      </span>
    ),
    sortValue: (row) => row.netPay,
  },
  {
    id: "status",
    header: "Status",
    accessor: (row) => <Badge status={row.status}>{row.status}</Badge>,
    sortValue: (row) => row.status,
  },
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function PayrollPage() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayroll = () => {
    setLoading(true);
    setError(null);

    // Simulate async fetch -- replace with real API call
    const timer = setTimeout(() => {
      try {
        setRecords(DEMO_RECORDS);
      } catch {
        setError("Failed to load payroll records.");
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  };

  useEffect(() => {
    const cleanup = fetchPayroll();
    return cleanup;
  }, []);

  const stats = useMemo(() => deriveStats(records), [records]);

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Payroll</h1>
        <p className="text-sm text-muted-foreground">Payroll runs, salary slips and deductions</p>
      </div>
      <Button variant="primary">+ Create New</Button>
    </div>
  );

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchPayroll}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-h-[88px] rounded-xl border border-border bg-card p-6 animate-pulse" />
          ))}
        </div>
        <Card>
          <CardContent className="p-0">
            <SkeletonTable rows={6} columns={6} />
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---- Success / Empty states ---- */
  return (
    <div className="space-y-6">
      {header}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard label="Employees" value={stats.headcount} />
        <MetricCard label="Total Gross" value={formatCurrency(stats.totalGross)} />
        <MetricCard label="Total Deductions" value={formatCurrency(stats.totalDeductions)} />
        <MetricCard label="Total Net Pay" value={formatCurrency(stats.totalNet)} />
      </div>
      <Card>
        <CardContent className="p-0">
          <DataTable<PayrollRecord>
        columns={columns}
        data={records}
        keyExtractor={(r) => r.id}
        loading={false}
        emptyState={
          <EmptyState
            icon={<DollarSign className="h-6 w-6" />}
            title={MODULE_EMPTY_STATES.payroll.title}
            description={MODULE_EMPTY_STATES.payroll.description}
            actionLabel={MODULE_EMPTY_STATES.payroll.actionLabel}
            actionHref={MODULE_EMPTY_STATES.payroll.actionLink}
            supportLine={EMPTY_STATE_SUPPORT_LINE}
          />
        }
        pageSize={20}
          />
        </CardContent>
      </Card>
      <AIChatPanel module="hr" />
    </div>
  );
}
