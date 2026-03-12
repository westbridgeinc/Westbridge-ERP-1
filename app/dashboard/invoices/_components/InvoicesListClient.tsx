"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/locale/currency";
import { formatDate } from "@/lib/locale/date";
import type { CurrencyCode } from "@/lib/constants";
import { MODULE_EMPTY_STATES, EMPTY_STATE_SUPPORT_LINE } from "@/lib/dashboard/empty-state-config";
import { FileText } from "lucide-react";
import { AIChatPanel } from "@/components/ai/AIChatPanel";

/* ---------- types ---------- */

export interface InvoiceRow {
  id: string;
  customer: string;
  amount: number;
  currency: CurrencyCode;
  status: string;
  date: string;
  dueDate: string;
}

/* ---------- filters ---------- */

const FILTERS = ["All", "Draft", "Unpaid", "Paid", "Overdue"] as const;

/* ---------- column definitions ---------- */

function buildColumns(dateLabel: string, dueDateLabel: string, idLabel: string): Column<InvoiceRow>[] {
  return [
    {
      id: "id",
      header: idLabel,
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
      align: "right" as const,
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
      header: dateLabel,
      accessor: (row) => (
        <span className="text-muted-foreground/60">
          {row.date ? formatDate(row.date) : "\u2014"}
        </span>
      ),
      sortValue: (row) => row.date,
    },
    {
      id: "dueDate",
      header: dueDateLabel,
      accessor: (row) => (
        <span className="text-muted-foreground/60">
          {row.dueDate ? formatDate(row.dueDate) : "\u2014"}
        </span>
      ),
      sortValue: (row) => row.dueDate,
    },
  ];
}

/* ---------- component ---------- */

interface InvoicesListClientProps {
  invoices: InvoiceRow[];
  currentPage: number;
  hasMore: boolean;
  title?: string;
  subtitle?: string;
  dateLabel?: string;
  dueDateLabel?: string;
  searchPlaceholder?: string;
  type?: string;
}

export function InvoicesListClient({
  invoices,
  currentPage,
  hasMore,
  title = "Invoices",
  subtitle = "Manage and track invoices",
  dateLabel = "Date",
  dueDateLabel = "Due Date",
  searchPlaceholder = "Search invoices...",
  type = "invoice",
}: InvoicesListClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const isOrder = type === "order";
  const idLabel = isOrder ? "Order #" : "Invoice #";
  const columns = useMemo(() => buildColumns(dateLabel, dueDateLabel, idLabel), [dateLabel, dueDateLabel, idLabel]);

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

  /* --- empty state (no invoices at all) --- */
  if (invoices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button variant="primary" onClick={handleCreateInvoice}>+ Create New</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
            <Input
              type="search"
              placeholder={searchPlaceholder}
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
            onRowClick={(record) => router.push(`/dashboard/invoices/${encodeURIComponent(record.id)}`)}
            emptyTitle="No matching invoices"
            emptyDescription="Try adjusting your search or filter criteria."
            pageSize={20}
          />
          <div className="flex items-center justify-between border-t border-border px-4 py-2">
            <span className="text-sm text-muted-foreground">Page {currentPage + 1}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => router.push(`?type=${type}&page=${currentPage - 1}`)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => router.push(`?type=${type}&page=${currentPage + 1}`)}>
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
