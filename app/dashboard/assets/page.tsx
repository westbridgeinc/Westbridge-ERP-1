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
import { formatCurrency } from "@/lib/locale/currency";
import { Package } from "lucide-react";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { useErpList } from "@/lib/queries/useErpList";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AssetRow {
  id: string;
  assetName: string;
  assetCategory: string;
  status: string;
  grossPurchaseAmount: number;
  location: string;
}

interface AssetCategoryRow {
  id: string;
  categoryName: string;
}

/* ------------------------------------------------------------------ */
/*  Mappers                                                            */
/* ------------------------------------------------------------------ */

function mapErpAsset(d: Record<string, unknown>): AssetRow {
  return {
    id: String(d.name ?? ""),
    assetName: String(d.asset_name ?? d.name ?? ""),
    assetCategory: String(d.asset_category ?? "\u2014"),
    status: String(d.status ?? "Draft").trim(),
    grossPurchaseAmount: Number(d.gross_purchase_amount ?? 0),
    location: String(d.location ?? "\u2014"),
  };
}

function mapErpAssetCategory(d: Record<string, unknown>): AssetCategoryRow {
  return {
    id: String(d.name ?? ""),
    categoryName: String(d.category_name ?? d.name ?? ""),
  };
}

/* ------------------------------------------------------------------ */
/*  Column definitions                                                 */
/* ------------------------------------------------------------------ */

const assetColumns: Column<AssetRow>[] = [
  { id: "id", header: "Asset #", accessor: (r) => <span className="font-medium text-foreground">{r.id}</span>, sortValue: (r) => r.id },
  { id: "assetName", header: "Asset Name", accessor: (r) => <span className="text-muted-foreground">{r.assetName}</span>, sortValue: (r) => r.assetName },
  { id: "assetCategory", header: "Category", accessor: (r) => <span className="text-muted-foreground">{r.assetCategory}</span>, sortValue: (r) => r.assetCategory },
  { id: "status", header: "Status", accessor: (r) => <Badge status={r.status}>{r.status}</Badge> },
  { id: "grossPurchaseAmount", header: "Purchase Amount", align: "right", accessor: (r) => <span className="font-medium text-foreground">{formatCurrency(r.grossPurchaseAmount, "USD")}</span>, sortValue: (r) => r.grossPurchaseAmount },
  { id: "location", header: "Location", accessor: (r) => <span className="text-muted-foreground">{r.location}</span>, sortValue: (r) => r.location },
];

const assetCategoryColumns: Column<AssetCategoryRow>[] = [
  { id: "id", header: "ID", accessor: (r) => <span className="font-medium text-foreground">{r.id}</span>, sortValue: (r) => r.id },
  { id: "categoryName", header: "Category Name", accessor: (r) => <span className="text-muted-foreground">{r.categoryName}</span>, sortValue: (r) => r.categoryName },
];

/* ------------------------------------------------------------------ */
/*  Config by type                                                     */
/* ------------------------------------------------------------------ */

const TYPE_CONFIG = {
  default: { doctype: "Asset", title: "Assets", subtitle: "Manage your company assets" },
  category: { doctype: "Asset Category", title: "Asset Categories", subtitle: "Manage asset categories" },
} as const;

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

function AssetsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? "default";
  const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.default;
  const isCategory = type === "category";

  const [page, setPage] = useState(0);
  const { data: rawList = [], hasMore, page: currentPage, isLoading: loading, isError, error: queryError, refetch } = useErpList(config.doctype, { page });

  const data = useMemo(() => {
    const list = rawList as Record<string, unknown>[];
    if (isCategory) return list.map(mapErpAssetCategory);
    return list.map(mapErpAsset);
  }, [rawList, isCategory]);
  const error = queryError instanceof Error ? queryError.message : isError ? `Failed to load ${config.title.toLowerCase()}.` : null;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display">{config.title}</h1>
            <p className="text-sm text-muted-foreground">{config.subtitle}</p>
          </div>
          <Button variant="primary" onClick={() => router.push("/dashboard/assets/new")}>+ Create New</Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Package className="h-6 w-6" />
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
        <Button variant="primary" onClick={() => router.push("/dashboard/assets/new")}>+ Create New</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <SkeletonTable rows={6} columns={isCategory ? 2 : 6} />
          ) : isCategory ? (
            <DataTable
              columns={assetCategoryColumns}
              data={data as AssetCategoryRow[]}
              keyExtractor={(r) => r.id}
              onRowClick={(record) => router.push(`/dashboard/assets/${encodeURIComponent(record.id)}`)}
              emptyState={
                <EmptyState
                  icon={<Package className="h-6 w-6" />}
                  title="No asset categories yet"
                  description="Add your first asset category to organize your assets."
                  actionLabel="Add Category"
                  actionHref="/dashboard/assets/new"
                  supportLine={EMPTY_STATE_SUPPORT_LINE}
                />
              }
              pageSize={20}
            />
          ) : (
            <DataTable
              columns={assetColumns}
              data={data as unknown as AssetRow[]}
              keyExtractor={(r) => r.id}
              onRowClick={(record) => router.push(`/dashboard/assets/${encodeURIComponent(record.id)}`)}
              emptyState={
                <EmptyState
                  icon={<Package className="h-6 w-6" />}
                  title="No assets yet"
                  description="Add your first asset to start tracking company assets."
                  actionLabel="Add Asset"
                  actionHref="/dashboard/assets/new"
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
      <AIChatPanel module="assets" />
    </div>
  );
}

export default function AssetsPage() {
  return (
    <Suspense fallback={null}>
      <AssetsPageContent />
    </Suspense>
  );
}
