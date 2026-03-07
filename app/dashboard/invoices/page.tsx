"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/locale/currency";
import { formatDate } from "@/lib/locale/date";
import type { CurrencyCode } from "@/lib/constants";
import { MODULE_EMPTY_STATES, EMPTY_STATE_SUPPORT_LINE } from "@/lib/dashboard/empty-state-config";
import { FileText } from "lucide-react";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { useErpList } from "@/lib/queries/useErpList";

/* ---------- types ---------- */

interface InvoiceRow {
  id: string;
  customer: string;
  amount: number;
  currency: CurrencyCode;
  status: string;
  date: string;
  dueDate: string;
}

/* ---------- ERP mapper ---------- */

function mapErpInvoice(d: Record<string, unknown>): InvoiceRow {
  const name = (d.name as string) ?? "";
  const customer = (d.customer_name as string) ?? (d.customer as string) ?? "\u2014";
  const amount = Number(d.grand_total ?? d.outstanding_amount ?? 0);
  const currency = ((d.currency as string) ?? "USD") as CurrencyCode;
  const status = String(d.status ?? "Draft").trim();
  const date = (d.posting_date as string) ?? "";
  const dueDate = (d.due_date as string) ?? "";
  return { id: name, customer, amount, currency, status, date, dueDate };
}

/* ---------- filters ---------- */

const FILTERS = ["All", "Draft", "Unpaid", "Paid", "Overdue"] as const;

/* ---------- column definitions ---------- */

const columns: Column<InvoiceRow>[] = [
  {
    id: "id",
    header: "Invoice #",
    accessor: (row) => (
      <span className="font-medium text-foreground">{row.id}</span>
    ),
    sortValue: (row) => row.id,
  },
  {
    id: "customer",
    header: "Customer",
    accessor: (row) => (
      <span className="text-muted-foreground">{row.customer}</span>
    ),
    sortValue: (row) => row.customer,
  },
  {
    id: "amount",
    header: "Amount",
    align: "right",
    accessor: (row) => (
      <span className="font-medium text-foreground">
        {formatCurrency(row.amount, row.currency)}
      </span>
    ),
    sortValue: (row) => row.amount,
  },
  {
    id: "status",
    header: "Status",
    accessor: (row) => <Badge status={row.status}>{row.status}</Badge>,
    sortValue: (row) => row.status,
  },
  {
    id: "date",
    header: "Date",
    accessor: (row) => (
      <span className="text-muted-foreground/60">
        {row.date ? formatDate(row.date) : "\u2014"}
      </span>
    ),
    sortValue: (row) => row.date,
  },
  {
    id: "dueDate",
    header: "Due Date",
    accessor: (row) => (
      <span className="text-muted-foreground/60">
        {row.dueDate ? formatDate(row.dueDate) : "\u2014"}
      </span>
    ),
    sortValue: (row) => row.dueDate,
  },
];

/* ---------- component ---------- */

export default function InvoicesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const { data: rawList = [], hasMore, page: currentPage, isLoading: loading, isError: isErrorState, error: queryError, refetch } = useErpList("Sales Invoice", { page });
  const invoices = useMemo(() => (rawList as Record<string, unknown>[]).map(mapErpInvoice), [rawList]);
  const error = queryError instanceof Error ? queryError.message : isErrorState ? "Failed to load invoices." : null;

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchFilter = filter === "All" || inv.status === filter;
      const matchSearch =
        !search ||
        inv.id.toLowerCase().includes(search.toLowerCase()) ||
        inv.customer.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [invoices, filter, search]);

  const handleCreateInvoice = useCallback(() => {
    router.push("/dashboard/invoices/new");
  }, [router]);

  /* --- error state --- */
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Invoices</h1>
            <p className="text-sm text-muted-foreground">Manage and track invoices</p>
          </div>
          <Button variant="primary" onClick={handleCreateInvoice}>+ Create New</Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-xl font-semibold text-foreground">Something went wrong</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">{error}</p>
            <Button variant="primary" className="mt-6" onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* --- loading state --- */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Invoices</h1>
            <p className="text-sm text-muted-foreground">Manage and track invoices</p>
          </div>
          <Button variant="primary" disabled>+ Create New</Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <SkeletonTable rows={8} columns={6} />
          </CardContent>
        </Card>
      </div>
    );
  }

  /* --- empty state (no invoices at all) --- */
  if (invoices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Invoices</h1>
            <p className="text-sm text-muted-foreground">Manage and track invoices</p>
          </div>
          <Button variant="primary" onClick={handleCreateInvoice}>+ Create New</Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title={MODULE_EMPTY_STATES.invoices.title}
              description={MODULE_EMPTY_STATES.invoices.description}
              actionLabel={MODULE_EMPTY_STATES.invoices.actionLabel}
              actionHref={MODULE_EMPTY_STATES.invoices.actionLink}
              supportLine={EMPTY_STATE_SUPPORT_LINE}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  /* --- success state --- */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">Manage and track invoices</p>
        </div>
        <Button variant="primary" onClick={handleCreateInvoice}>+ Create New</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
            <Input
              type="search"
              placeholder="Search invoices..."
              className="w-80"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex gap-2">
              {FILTERS.map((f) => {
                const isActive = filter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>
          <DataTable<InvoiceRow>
            columns={columns}
            data={filtered}
            keyExtractor={(row) => row.id}
            emptyTitle="No matching invoices"
            emptyDescription="Try adjusting your search or filter criteria."
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
      <AIChatPanel module="finance" />
    </div>
  );
}
