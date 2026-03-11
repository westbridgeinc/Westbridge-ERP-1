"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
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
import { useErpList } from "@/lib/queries/useErpList";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PayrollRecord {
  id: string;
  employee: string;
  period: string;
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
/*  Mapper & Stats                                                     */
/* ------------------------------------------------------------------ */

function mapErpSalarySlip(r: Record<string, unknown>, i: number): PayrollRecord {
  const docstatus = Number(r.docstatus ?? 0);
  const status: PayrollRecord["status"] =
    docstatus === 1 ? "Processed" : docstatus === 2 ? "Rejected" : "Pending";
  return {
    id: String(r.name ?? `PAY-${i}`),
    employee: String(r.employee_name ?? r.name ?? ""),
    period: String(r.start_date ?? ""),
    grossPay: Number(r.gross_pay ?? 0),
    deductions: Number(r.total_deduction ?? 0),
    netPay: Number(r.net_pay ?? 0),
    status,
  };
}

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
    accessor: (row) => <span className="font-medium text-foreground">{row.employee}</span>,
    sortValue: (row) => row.employee,
  },
  {
    id: "period",
    header: "Period",
    accessor: (row) => <span className="text-muted-foreground">{formatDate(row.period)}</span>,
    sortValue: (row) => row.period,
  },
  {
    id: "grossPay",
    header: "Gross Pay",
    align: "right",
    accessor: (row) => <span className="text-muted-foreground">{formatCurrency(row.grossPay)}</span>,
    sortValue: (row) => row.grossPay,
  },
  {
    id: "deductions",
    header: "Deductions",
    align: "right",
    accessor: (row) => <span className="text-muted-foreground/60">{formatCurrency(row.deductions)}</span>,
    sortValue: (row) => row.deductions,
  },
  {
    id: "netPay",
    header: "Net Pay",
    align: "right",
    accessor: (row) => <span className="font-medium text-foreground">{formatCurrency(row.netPay)}</span>,
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
  const [page, setPage] = useState(0);
  const {
    data: rawList = [],
    hasMore,
    page: currentPage,
    isLoading: loading,
    isError,
    error: queryError,
    refetch,
  } = useErpList("Salary Slip", {
    page,
    limit: 100,
    fields: ["name", "employee_name", "start_date", "gross_pay", "total_deduction", "net_pay", "docstatus"],
  });

  const records = useMemo(
    () => (rawList as Record<string, unknown>[]).map(mapErpSalarySlip),
    [rawList],
  );
  const error = queryError instanceof Error ? queryError.message : isError ? "Failed to load payroll data." : null;
  const stats = useMemo(() => deriveStats(records), [records]);

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display">Payroll</h1>
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
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <DollarSign className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">Something went wrong</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button variant="primary" size="sm" onClick={() => refetch()}>Retry</Button>
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
      <AIChatPanel module="hr" />
    </div>
  );
}
