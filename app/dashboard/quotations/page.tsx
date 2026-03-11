"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { MODULE_EMPTY_STATES, EMPTY_STATE_SUPPORT_LINE } from "@/lib/dashboard/empty-state-config";
import { formatCurrency } from "@/lib/locale/currency";
import { FileBarChart } from "lucide-react";
import { formatDateLong } from "@/lib/locale/date";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { useErpList } from "@/lib/queries/useErpList";

interface QuotationRow {
  id: string;
  customer: string;
  amount: number;
  validUntil: string;
  status: string;
}

function mapErpQuotation(d: Record<string, unknown>): QuotationRow {
  return {
    id: String(d.name ?? ""),
    customer: String(d.party_name ?? d.customer_name ?? "\u2014"),
    amount: Number(d.grand_total ?? d.net_total ?? 0),
    validUntil: String(d.valid_till ?? ""),
    status: String(d.status ?? d.docstatus === 1 ? "Submitted" : "Draft").trim(),
  };
}

function fmtDate(d: string): string {
  if (!d) return "\u2014";
  try { return formatDateLong(d); } catch { return d; }
}

const columns: Column<QuotationRow>[] = [
  { id: "id", header: "Quote #", accessor: (r) => <span className="font-medium text-foreground">{r.id}</span>, sortValue: (r) => r.id },
  { id: "customer", header: "Customer", accessor: (r) => <span className="text-muted-foreground">{r.customer}</span>, sortValue: (r) => r.customer },
  { id: "amount", header: "Amount", align: "right", accessor: (r) => <span className="font-medium text-foreground">{formatCurrency(r.amount, "USD")}</span>, sortValue: (r) => r.amount },
  { id: "validUntil", header: "Valid Until", accessor: (r) => <span className="text-muted-foreground/60">{fmtDate(r.validUntil)}</span>, sortValue: (r) => r.validUntil },
  { id: "status", header: "Status", accessor: (r) => <Badge status={r.status}>{r.status}</Badge> },
];

export default function QuotationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const { data: rawList = [], hasMore, page: currentPage, isLoading: loading, isError, error: queryError, refetch } = useErpList("Quotation", { page });
  const data = useMemo(() => (rawList as Record<string, unknown>[]).map(mapErpQuotation), [rawList]);
  const error = queryError instanceof Error ? queryError.message : isError ? "Failed to load quotations." : null;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display">Quotations</h1>
            <p className="text-sm text-muted-foreground">Sales quotations and proposals</p>
          </div>
          <Button variant="primary" onClick={() => router.push("/dashboard/quotations/new")}>+ Create New</Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <FileBarChart className="h-6 w-6" />
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Quotations</h1>
          <p className="text-sm text-muted-foreground">Sales quotations and proposals</p>
        </div>
        <Button variant="primary" onClick={() => router.push("/dashboard/quotations/new")}>+ Create New</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? <SkeletonTable rows={6} columns={5} /> : (
            <DataTable
              columns={columns}
              data={data}
              keyExtractor={(r) => r.id}
              onRowClick={(record) => router.push(`/dashboard/quotations/${encodeURIComponent(record.id)}`)}
              emptyState={
                <EmptyState
                  icon={<FileBarChart className="h-6 w-6" />}
                  title={MODULE_EMPTY_STATES.quotations.title}
                  description={MODULE_EMPTY_STATES.quotations.description}
                  actionLabel={MODULE_EMPTY_STATES.quotations.actionLabel}
                  actionHref={MODULE_EMPTY_STATES.quotations.actionLink}
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
      <AIChatPanel module="crm" />
    </div>
  );
}
