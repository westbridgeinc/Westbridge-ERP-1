"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { EMPTY_STATE_SUPPORT_LINE } from "@/lib/dashboard/empty-state-config";
import { Factory } from "lucide-react";
import { formatDateLong } from "@/lib/locale/date";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { useErpList } from "@/lib/queries/useErpList";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WorkOrderRow {
  id: string;
  productionItem: string;
  qty: number;
  status: string;
  plannedStartDate: string;
}

interface BOMRow {
  id: string;
  itemName: string;
  quantity: number;
  isActive: string;
  isDefault: string;
}

interface GenericRow {
  id: string;
  [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/*  Mappers                                                            */
/* ------------------------------------------------------------------ */

function mapWorkOrder(d: Record<string, unknown>): WorkOrderRow {
  return {
    id: String(d.name ?? ""),
    productionItem: String(d.production_item ?? d.item_name ?? "\u2014"),
    qty: Number(d.qty ?? 0),
    status: String(d.status ?? "Draft").trim(),
    plannedStartDate: String(d.planned_start_date ?? ""),
  };
}

function mapBOM(d: Record<string, unknown>): BOMRow {
  return {
    id: String(d.name ?? ""),
    itemName: String(d.item_name ?? d.item ?? "\u2014"),
    quantity: Number(d.quantity ?? 0),
    isActive: d.is_active ? "Yes" : "No",
    isDefault: d.is_default ? "Yes" : "No",
  };
}

function mapWorkstation(d: Record<string, unknown>): GenericRow {
  return {
    id: String(d.name ?? ""),
    workstationName: String(d.workstation_name ?? d.name ?? ""),
    workstationType: String(d.workstation_type ?? "\u2014"),
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtDate(d: string): string {
  if (!d) return "\u2014";
  try { return formatDateLong(d); } catch { return d; }
}

/* ------------------------------------------------------------------ */
/*  Column definitions                                                 */
/* ------------------------------------------------------------------ */

const workOrderColumns: Column<WorkOrderRow>[] = [
  { id: "id", header: "Work Order #", accessor: (r) => <span className="font-medium text-foreground">{r.id}</span>, sortValue: (r) => r.id },
  { id: "productionItem", header: "Production Item", accessor: (r) => <span className="text-muted-foreground">{r.productionItem}</span>, sortValue: (r) => r.productionItem },
  { id: "qty", header: "Qty", align: "right", accessor: (r) => <span className="text-muted-foreground">{r.qty.toLocaleString()}</span>, sortValue: (r) => r.qty },
  { id: "status", header: "Status", accessor: (r) => <Badge status={r.status}>{r.status}</Badge> },
  { id: "plannedStartDate", header: "Planned Start", accessor: (r) => <span className="text-muted-foreground/60">{fmtDate(r.plannedStartDate)}</span>, sortValue: (r) => r.plannedStartDate },
];

const bomColumns: Column<BOMRow>[] = [
  { id: "id", header: "BOM #", accessor: (r) => <span className="font-medium text-foreground">{r.id}</span>, sortValue: (r) => r.id },
  { id: "itemName", header: "Item Name", accessor: (r) => <span className="text-muted-foreground">{r.itemName}</span>, sortValue: (r) => r.itemName },
  { id: "quantity", header: "Quantity", align: "right", accessor: (r) => <span className="text-muted-foreground">{r.quantity.toLocaleString()}</span>, sortValue: (r) => r.quantity },
  { id: "isActive", header: "Active", accessor: (r) => <Badge status={r.isActive === "Yes" ? "Active" : "Inactive"}>{r.isActive}</Badge>, sortValue: (r) => r.isActive },
  { id: "isDefault", header: "Default", accessor: (r) => <Badge status={r.isDefault === "Yes" ? "Active" : "Inactive"}>{r.isDefault}</Badge>, sortValue: (r) => r.isDefault },
];

const workstationColumns: Column<GenericRow>[] = [
  { id: "id", header: "Workstation ID", accessor: (r) => <span className="font-medium text-foreground">{r.id as string}</span>, sortValue: (r) => r.id },
  { id: "workstationName", header: "Name", accessor: (r) => <span className="text-muted-foreground">{r.workstationName as string}</span>, sortValue: (r) => r.workstationName as string },
  { id: "workstationType", header: "Type", accessor: (r) => <span className="text-muted-foreground">{r.workstationType as string}</span>, sortValue: (r) => r.workstationType as string },
];

/* ------------------------------------------------------------------ */
/*  Config by type                                                     */
/* ------------------------------------------------------------------ */

const TYPE_CONFIG = {
  default: { doctype: "Work Order", title: "Work Orders", subtitle: "Manage production work orders" },
  bom: { doctype: "BOM", title: "Bill of Materials", subtitle: "Manage bills of materials for production" },
  workstation: { doctype: "Workstation", title: "Workstations", subtitle: "Manage your workstations" },
} as const;

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

function ManufacturingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? "default";
  const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.default;
  const isWorkOrder = type === "default" || !type;
  const isBOM = type === "bom";

  const [page, setPage] = useState(0);
  const { data: rawList = [], hasMore, page: currentPage, isLoading: loading, isError, error: queryError, refetch } = useErpList(config.doctype, { page });

  const data = useMemo(() => {
    const list = rawList as Record<string, unknown>[];
    if (isWorkOrder) return list.map(mapWorkOrder);
    if (isBOM) return list.map(mapBOM);
    return list.map(mapWorkstation);
  }, [rawList, isWorkOrder, isBOM]);
  const error = queryError instanceof Error ? queryError.message : isError ? `Failed to load ${config.title.toLowerCase()}.` : null;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display">{config.title}</h1>
            <p className="text-sm text-muted-foreground">{config.subtitle}</p>
          </div>
          <Button variant="primary" onClick={() => router.push("/dashboard/manufacturing/new")}>+ Create New</Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Factory className="h-6 w-6" />
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
        <Button variant="primary" onClick={() => router.push("/dashboard/manufacturing/new")}>+ Create New</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <SkeletonTable rows={6} columns={isWorkOrder ? 5 : isBOM ? 5 : 3} />
          ) : isWorkOrder ? (
            <DataTable<WorkOrderRow>
              columns={workOrderColumns}
              data={data as WorkOrderRow[]}
              keyExtractor={(r) => r.id}
              onRowClick={(record) => router.push(`/dashboard/manufacturing/${encodeURIComponent(record.id)}`)}
              emptyState={
                <EmptyState
                  icon={<Factory className="h-6 w-6" />}
                  title="No work orders yet"
                  description="Create your first work order to start managing production."
                  actionLabel="New Work Order"
                  actionHref="/dashboard/manufacturing/new"
                  supportLine={EMPTY_STATE_SUPPORT_LINE}
                />
              }
              pageSize={20}
            />
          ) : isBOM ? (
            <DataTable<BOMRow>
              columns={bomColumns}
              data={data as BOMRow[]}
              keyExtractor={(r) => r.id}
              onRowClick={(record) => router.push(`/dashboard/manufacturing/${encodeURIComponent(record.id)}`)}
              emptyState={
                <EmptyState
                  icon={<Factory className="h-6 w-6" />}
                  title="No bills of materials yet"
                  description="Create your first BOM to define production materials."
                  actionLabel="New BOM"
                  actionHref="/dashboard/manufacturing/new"
                  supportLine={EMPTY_STATE_SUPPORT_LINE}
                />
              }
              pageSize={20}
            />
          ) : (
            <DataTable<GenericRow>
              columns={workstationColumns}
              data={data as GenericRow[]}
              keyExtractor={(r) => r.id}
              onRowClick={(record) => router.push(`/dashboard/manufacturing/${encodeURIComponent(record.id)}`)}
              emptyState={
                <EmptyState
                  icon={<Factory className="h-6 w-6" />}
                  title="No workstations yet"
                  description="Add your first workstation to organize production."
                  actionLabel="New Workstation"
                  actionHref="/dashboard/manufacturing/new"
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
      <AIChatPanel module="manufacturing" />
    </div>
  );
}

export default function ManufacturingPage() {
  return (
    <Suspense fallback={null}>
      <ManufacturingPageContent />
    </Suspense>
  );
}
