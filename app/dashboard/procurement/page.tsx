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
import { Truck } from "lucide-react";
import { formatDateLong } from "@/lib/locale/date";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { useErpList } from "@/lib/queries/useErpList";

interface PurchaseOrder {
  id: string;
  supplier: string;
  amount: number;
  orderDate: string;
  expected: string;
  status: string;
}

function mapErpPurchaseOrder(d: Record<string, unknown>): PurchaseOrder {
  return {
    id: String(d.name ?? ""),
    supplier: String(d.supplier_name ?? d.supplier ?? "\u2014"),
    amount: Number(d.grand_total ?? d.net_total ?? 0),
    orderDate: String(d.transaction_date ?? ""),
    expected: String(d.schedule_date ?? ""),
    status: String(d.status ?? "Draft").trim(),
  };
}

function fmtDate(d: string): string {
  if (!d) return "\u2014";
  try { return formatDateLong(d); } catch { return d; }
}

const columns: Column<PurchaseOrder>[] = [
  { id: "id", header: "PO #", accessor: (r) => <span className="font-medium text-foreground">{r.id}</span>, sortValue: (r) => r.id },
  { id: "supplier", header: "Supplier", accessor: (r) => <span className="text-muted-foreground">{r.supplier}</span>, sortValue: (r) => r.supplier },
  { id: "amount", header: "Amount", align: "right", accessor: (r) => <span className="font-medium text-foreground">{formatCurrency(r.amount, "USD")}</span>, sortValue: (r) => r.amount },
  { id: "orderDate", header: "Order Date", accessor: (r) => <span className="text-muted-foreground/60">{fmtDate(r.orderDate)}</span>, sortValue: (r) => r.orderDate },
  { id: "expected", header: "Expected", accessor: (r) => <span className="text-muted-foreground/60">{fmtDate(r.expected)}</span>, sortValue: (r) => r.expected },
  { id: "status", header: "Status", accessor: (r) => <Badge status={r.status}>{r.status}</Badge> },
];

export default function ProcurementPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const { data: rawList = [], hasMore, page: currentPage, isLoading: loading, isError, error: queryError, refetch } = useErpList("Purchase Order", { page });
  const data = useMemo(() => (rawList as Record<string, unknown>[]).map(mapErpPurchaseOrder), [rawList]);
  const error = queryError instanceof Error ? queryError.message : isError ? "Failed to load purchase orders." : null;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display">Procurement</h1>
            <p className="text-sm text-muted-foreground">Purchase orders and suppliers</p>
          </div>
          <Button variant="primary" onClick={() => router.push("/dashboard/procurement/new")}>+ Create New</Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Truck className="h-6 w-6" />
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Procurement</h1>
          <p className="text-sm text-muted-foreground">Purchase orders and suppliers</p>
        </div>
        <Button variant="primary" onClick={() => router.push("/dashboard/procurement/new")}>+ Create New</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <SkeletonTable rows={6} columns={6} />
          ) : (
            <DataTable
              columns={columns}
              data={data}
              keyExtractor={(r) => r.id}
              onRowClick={(record) => router.push(`/dashboard/procurement/${encodeURIComponent(record.id)}`)}
              emptyState={
                <EmptyState
                  icon={<Truck className="h-6 w-6" />}
                  title={MODULE_EMPTY_STATES.procurement.title}
                  description={MODULE_EMPTY_STATES.procurement.description}
                  actionLabel={MODULE_EMPTY_STATES.procurement.actionLabel}
                  actionHref={MODULE_EMPTY_STATES.procurement.actionLink}
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
      <AIChatPanel module="inventory" />
    </div>
  );
}
