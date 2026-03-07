"use client";

import { useState, useMemo, useCallback } from "react";
import { Receipt } from "lucide-react";
import { useErpList } from "@/lib/queries/useErpList";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/locale/currency";
import { formatDate } from "@/lib/locale/date";
import { MODULE_EMPTY_STATES, EMPTY_STATE_SUPPORT_LINE } from "@/lib/dashboard/empty-state-config";
import { AIChatPanel } from "@/components/ai/AIChatPanel";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ExpenseRow = {
  name: string;
  postingDate: string;
  description: string;
  category: string;
  amount: number;
  submittedBy: string;
  status: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function mapErpExpense(d: Record<string, unknown>): ExpenseRow {
  const amount = Number(
    d.total_sanctioned_amount ?? d.total_claimed_amount ?? d.grand_total ?? 0
  );
  return {
    name: String(d.name ?? ""),
    postingDate: String(d.posting_date ?? d.creation ?? ""),
    description: String(d.remark ?? d.employee_remarks ?? "Expense claim"),
    category: String(d.expense_type ?? "\u2014"),
    amount,
    submittedBy: String(d.employee_name ?? d.owner ?? "\u2014"),
    status: String(d.status ?? "Draft").trim(),
  };
}

/* ------------------------------------------------------------------ */
/*  Table columns                                                      */
/* ------------------------------------------------------------------ */

const expenseColumns: Column<ExpenseRow>[] = [
  {
    id: "date",
    header: "Date",
    accessor: (row) => (row.postingDate ? formatDate(row.postingDate) : "\u2014"),
    sortValue: (row) => row.postingDate || "",
    width: "120px",
  },
  {
    id: "description",
    header: "Description",
    accessor: (row) => row.description,
    sortValue: (row) => row.description,
  },
  {
    id: "category",
    header: "Category",
    accessor: (row) => (
      <span className="text-muted-foreground">{row.category}</span>
    ),
    sortValue: (row) => row.category,
    width: "140px",
  },
  {
    id: "amount",
    header: "Amount",
    accessor: (row) => (
      <span className="font-medium text-foreground">
        {row.amount > 0 ? formatCurrency(row.amount, "USD") : "\u2014"}
      </span>
    ),
    sortValue: (row) => row.amount,
    align: "right",
    width: "140px",
  },
  {
    id: "submittedBy",
    header: "Submitted By",
    accessor: (row) => (
      <span className="text-muted-foreground">{row.submittedBy}</span>
    ),
    sortValue: (row) => row.submittedBy,
    width: "160px",
  },
  {
    id: "status",
    header: "Status",
    accessor: (row) => <Badge status={row.status}>{row.status}</Badge>,
    sortValue: (row) => row.status,
    width: "120px",
  },
];

/* ------------------------------------------------------------------ */
/*  Metric card                                                        */
/* ------------------------------------------------------------------ */

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-4">
      <p className="text-sm text-muted-foreground/60">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ExpensesPage() {
  const [page, setPage] = useState(0);
  const { data: rawList = [], hasMore, page: currentPage, isLoading: loading, isError: isErrorState, error: queryError, refetch } = useErpList("Expense Claim", { page });
  const rows = useMemo(() => (rawList as Record<string, unknown>[]).map(mapErpExpense), [rawList]);
  const error = queryError instanceof Error ? queryError.message : isErrorState ? "Failed to load expense claims." : null;

  const retry = useCallback(() => {
    refetch();
  }, [refetch]);

  const totalAmount = useMemo(
    () => rows.reduce((sum, r) => sum + r.amount, 0),
    [rows]
  );
  const pendingCount = useMemo(
    () => rows.filter((r) => r.status === "Pending").length,
    [rows]
  );

  /* ---------- Error state ---------- */
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Expenses</h1>
            <p className="text-sm text-muted-foreground">Expense claims and approvals</p>
          </div>
          <Button variant="primary">+ Add Expense</Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Receipt className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">Something went wrong</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={retry}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------- Main render ---------- */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground">Expense claims and approvals</p>
        </div>
        <Button variant="primary">+ Add Expense</Button>
      </div>
      {loading ? (
        <div className="flex gap-6">
          <SkeletonCard className="flex-1" />
          <SkeletonCard className="flex-1" />
          <SkeletonCard className="flex-1" />
        </div>
      ) : (
        <div className="flex gap-6">
          <MetricCard label="Total claims" value={formatCurrency(totalAmount, "USD")} />
          <MetricCard label="Pending" value={pendingCount} />
          <MetricCard label="Total" value={rows.length} />
        </div>
      )}
      <Card>
        <CardContent className="p-0">
          <DataTable<ExpenseRow>
            columns={expenseColumns}
            data={rows}
            keyExtractor={(row) => row.name}
            loading={loading}
            emptyTitle={MODULE_EMPTY_STATES.expenses.title}
            emptyDescription={MODULE_EMPTY_STATES.expenses.description}
            emptyState={
              <EmptyState
                icon={<Receipt className="h-6 w-6" />}
                title={MODULE_EMPTY_STATES.expenses.title}
                description={MODULE_EMPTY_STATES.expenses.description}
                actionLabel={MODULE_EMPTY_STATES.expenses.actionLabel}
                actionHref={MODULE_EMPTY_STATES.expenses.actionLink}
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
