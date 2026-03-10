"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

export interface ErpListPageFilter {
  value: string;
  label: string;
}

export interface ErpListPageProps<T> {
  title: string;
  doctype: string;
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  keyExtractor: (row: T) => string;
  /** e.g. "New Invoice" */
  createLabel?: string;
  onCreateClick?: () => void;
  /** e.g. [{ value: "All", label: "All" }, { value: "Draft", label: "Draft" }] */
  filters?: ErpListPageFilter[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  onBulkDelete?: (keys: Set<string>) => void;
  onBulkExportCsv?: (keys: Set<string>) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  emptyIcon?: ReactNode;
  pageSizeOptions?: number[];
  /** Custom mobile card renderer; default shows first 3 columns */
  mobileCardRenderer?: (row: T) => ReactNode;
}

const DEFAULT_PAGE_SIZES = [10, 25, 50];

export function ErpListPage<T>({
  title,
  doctype,
  columns,
  data,
  loading = false,
  keyExtractor,
  createLabel,
  onCreateClick,
  filters,
  filterValue = "All",
  onFilterChange,
  searchPlaceholder,
  searchValue = "",
  onSearchChange,
  onRowClick,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  onBulkDelete,
  onBulkExportCsv,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  emptyIcon,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  mobileCardRenderer,
}: ErpListPageProps<T>) {
  const [pageSize, setPageSize] = useState(pageSizeOptions[0] ?? 10);

  const filteredData = data;
  const hasSelection = selectedKeys && selectedKeys.size > 0;
  const bulkActions = (onBulkDelete || onBulkExportCsv) && selectable;

  const handleEmptyTitle = emptyTitle ?? `No ${doctype.toLowerCase()}s found`;
  const handleEmptyDesc = emptyDescription ?? `Create your first ${doctype.toLowerCase()}`;

  if (loading) {
    return (
      <div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {createLabel && (
            <Button variant="default" size="default" disabled>
              {createLabel}
            </Button>
          )}
        </div>
        <div className="mt-6 overflow-hidden rounded-md border border-border bg-card">
          <SkeletonTable rows={10} columns={columns.length} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {createLabel && onCreateClick && (
          <Button variant="default" size="default" onClick={onCreateClick}>
            {createLabel}
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {searchPlaceholder !== undefined && (
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="h-9 w-64 text-sm"
          />
        )}
        {filters && filters.length > 0 && onFilterChange && (
          <div className="flex gap-2">
            {filters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => onFilterChange(f.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors",
                  filterValue === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
        {pageSizeOptions.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v))}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {bulkActions && hasSelection && (
        <div className="mt-4 flex items-center gap-3 rounded-md border border-border bg-muted/50 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            {selectedKeys!.size} selected
          </span>
          {onBulkDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onBulkDelete(selectedKeys!)}
            >
              Delete selected
            </Button>
          )}
          {onBulkExportCsv && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkExportCsv(selectedKeys!)}
            >
              Export CSV
            </Button>
          )}
        </div>
      )}

      {/* Data table */}
      <div className="mt-4 overflow-hidden rounded-md border border-border bg-card">
        <DataTable<T>
          columns={columns}
          data={filteredData}
          keyExtractor={keyExtractor}
          loading={false}
          emptyTitle={handleEmptyTitle}
          emptyDescription={handleEmptyDesc}
          emptyActionLabel={emptyActionLabel}
          onEmptyAction={onEmptyAction}
          selectable={selectable}
          selectedKeys={selectedKeys}
          onSelectionChange={onSelectionChange}
          onRowClick={onRowClick}
          pageSize={pageSize}
          mobileCardRenderer={mobileCardRenderer}
          emptyState={
            filteredData.length === 0 ? (
              <EmptyState
                icon={emptyIcon}
                title={handleEmptyTitle}
                description={handleEmptyDesc}
                actionLabel={emptyActionLabel}
                onAction={onEmptyAction}
              />
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
