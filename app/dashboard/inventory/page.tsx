"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { Package } from "lucide-react";
import { MODULE_EMPTY_STATES, EMPTY_STATE_SUPPORT_LINE } from "@/lib/dashboard/empty-state-config";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/locale/currency";
import { AIChatPanel } from "@/components/ai/AIChatPanel";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface InventoryItem {
  id: string;
  item: string;
  warehouse: string;
  qty: number;
  value: number;
  uom: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

interface InventoryStats {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

/* ------------------------------------------------------------------ */
/*  Badge variant mapping for inventory-specific statuses              */
/* ------------------------------------------------------------------ */

function inventoryBadgeVariant(status: string): "success" | "warning" | "error" {
  if (status === "Out of Stock") return "error";
  if (status === "Low Stock") return "warning";
  return "success";
}

/* ------------------------------------------------------------------ */
/*  Demo data (swap for API call in production)                        */
/* ------------------------------------------------------------------ */

const DEMO_ITEMS: InventoryItem[] = [
  { id: "ITM-001", item: "Portland Cement", warehouse: "Georgetown Main", qty: 450, value: 2250000, uom: "Bags", status: "In Stock" },
  { id: "ITM-002", item: "Demerara Gold Rum", warehouse: "Demerara Warehouse", qty: 12, value: 480000, uom: "Cases", status: "Low Stock" },
  { id: "ITM-003", item: "Galvanize Sheets", warehouse: "Georgetown Main", qty: 0, value: 0, uom: "Sheets", status: "Out of Stock" },
  { id: "ITM-004", item: "Basmati Rice", warehouse: "Berbice Store", qty: 320, value: 1280000, uom: "Bags", status: "In Stock" },
  { id: "ITM-005", item: "Car Battery", warehouse: "Georgetown Main", qty: 8, value: 320000, uom: "Units", status: "Low Stock" },
  { id: "ITM-006", item: "Printer Paper", warehouse: "Head Office", qty: 85, value: 85000, uom: "Reams", status: "In Stock" },
  { id: "ITM-007", item: "Safety Helmets", warehouse: "Georgetown Main", qty: 0, value: 0, uom: "Units", status: "Out of Stock" },
  { id: "ITM-008", item: "Diesel Fuel", warehouse: "Fuel Depot", qty: 1200, value: 3600000, uom: "Litres", status: "In Stock" },
];

function deriveStats(items: InventoryItem[]): InventoryStats {
  return items.reduce(
    (acc, item) => ({
      totalItems: acc.totalItems + 1,
      lowStock: acc.lowStock + (item.status === "Low Stock" ? 1 : 0),
      outOfStock: acc.outOfStock + (item.status === "Out of Stock" ? 1 : 0),
      totalValue: acc.totalValue + item.value,
    }),
    { totalItems: 0, lowStock: 0, outOfStock: 0, totalValue: 0 },
  );
}

/* ------------------------------------------------------------------ */
/*  Columns                                                            */
/* ------------------------------------------------------------------ */

const columns: Column<InventoryItem>[] = [
  {
    id: "item",
    header: "Item",
    accessor: (row) => (
      <span className="font-medium text-foreground">{row.item}</span>
    ),
    sortValue: (row) => row.item,
  },
  {
    id: "warehouse",
    header: "Warehouse",
    accessor: (row) => (
      <span className="text-muted-foreground">{row.warehouse}</span>
    ),
    sortValue: (row) => row.warehouse,
  },
  {
    id: "qty",
    header: "Qty",
    align: "right",
    accessor: (row) => (
      <span className="text-muted-foreground">
        {row.qty.toLocaleString()}
      </span>
    ),
    sortValue: (row) => row.qty,
  },
  {
    id: "value",
    header: "Value",
    align: "right",
    accessor: (row) => (
      <span className="font-medium text-foreground">
        {formatCurrency(row.value)}
      </span>
    ),
    sortValue: (row) => row.value,
  },
  {
    id: "uom",
    header: "UOM",
    accessor: (row) => (
      <span className="text-muted-foreground/60">{row.uom}</span>
    ),
    sortValue: (row) => row.uom,
  },
  {
    id: "status",
    header: "Status",
    accessor: (row) => (
      <Badge variant={inventoryBadgeVariant(row.status)}>{row.status}</Badge>
    ),
    sortValue: (row) =>
      row.status === "Out of Stock" ? 0 : row.status === "Low Stock" ? 1 : 2,
  },
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = () => {
    setLoading(true);
    setError(null);

    // Simulate async fetch -- replace with real API call
    const timer = setTimeout(() => {
      try {
        setItems(DEMO_ITEMS);
      } catch {
        setError("Failed to load inventory data.");
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  };

  useEffect(() => {
    const cleanup = fetchInventory();
    return cleanup;
  }, []);

  const stats = useMemo(() => deriveStats(items), [items]);

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Inventory</h1>
        <p className="text-sm text-muted-foreground">Stock levels and warehouse management</p>
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
            <Button variant="outline" size="sm" onClick={fetchInventory}>Retry</Button>
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
            <SkeletonTable rows={8} columns={6} />
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
        <MetricCard label="Total Items" value={stats.totalItems} />
        <MetricCard label="Low Stock" value={stats.lowStock} subtextVariant={stats.lowStock > 0 ? "error" : "muted"} />
        <MetricCard label="Out of Stock" value={stats.outOfStock} subtextVariant={stats.outOfStock > 0 ? "error" : "muted"} />
        <MetricCard label="Total Value" value={formatCurrency(stats.totalValue)} />
      </div>
      <Card>
        <CardContent className="p-0">
          <DataTable<InventoryItem>
        columns={columns}
        data={items}
        keyExtractor={(r) => r.id}
        loading={false}
        emptyState={
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title={MODULE_EMPTY_STATES.inventory.title}
            description={MODULE_EMPTY_STATES.inventory.description}
            actionLabel={MODULE_EMPTY_STATES.inventory.actionLabel}
            actionHref={MODULE_EMPTY_STATES.inventory.actionLink}
            supportLine={EMPTY_STATE_SUPPORT_LINE}
          />
        }
        pageSize={20}
          />
        </CardContent>
      </Card>
      <AIChatPanel module="inventory" />
    </div>
  );
}
