"use client";

import { useState, useMemo, useCallback, useRef, type ReactNode, type KeyboardEvent } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Pagination } from "./Pagination";
import { SkeletonTable } from "./SkeletonTable";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  id: string;
  header: string;
  accessor: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  emptyState?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  className?: string;
  /** On viewports < 768px, rows render as cards. If provided, used for each row; otherwise first 3 columns are shown stacked. */
  mobileCardRenderer?: (row: T) => ReactNode;
}

type SortDir = "asc" | "desc" | null;

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyState,
  emptyTitle = "No results",
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  onRowClick,
  pageSize = 20,
  className = "",
  mobileCardRenderer,
}: DataTableProps<T>) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(1);
  const [focusedRow, setFocusedRow] = useState(-1);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  const handleSort = useCallback(
    (colId: string) => {
      if (sortCol === colId) {
        setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
        if (sortDir === "desc") setSortCol(null);
      } else {
        setSortCol(colId);
        setSortDir("asc");
      }
      setPage(1);
    },
    [sortCol, sortDir]
  );

  const sorted = useMemo(() => {
    if (!sortCol || !sortDir) return data;
    const col = columns.find((c) => c.id === sortCol);
    if (!col?.sortValue) return data;
    const fn = col.sortValue;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const va = fn(a);
      const vb = fn(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [data, sortCol, sortDir, columns]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const allSelected = paginated.length > 0 && paginated.every((r) => selectedKeys?.has(keyExtractor(r)));

  const toggleAll = useCallback(() => {
    if (!onSelectionChange) return;
    const next = new Set(selectedKeys);
    if (allSelected) {
      paginated.forEach((r) => next.delete(keyExtractor(r)));
    } else {
      paginated.forEach((r) => next.add(keyExtractor(r)));
    }
    onSelectionChange(next);
  }, [allSelected, paginated, selectedKeys, onSelectionChange, keyExtractor]);

  const toggleRow = useCallback(
    (key: string) => {
      if (!onSelectionChange) return;
      const next = new Set(selectedKeys);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      onSelectionChange(next);
    },
    [selectedKeys, onSelectionChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTableSectionElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedRow((prev) => Math.min(prev + 1, paginated.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedRow((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && focusedRow >= 0 && onRowClick) {
        e.preventDefault();
        onRowClick(paginated[focusedRow]);
      }
    },
    [focusedRow, paginated, onRowClick]
  );

  if (loading) {
    return <SkeletonTable rows={pageSize > 10 ? 10 : pageSize} columns={columns.length} className={className} />;
  }

  if (data.length === 0) {
    return (
      emptyState ?? (
        <div className={`rounded-lg border border-border ${className}`}>
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        </div>
      )
    );
  }

  const defaultMobileCard = (row: T) => {
    const cols = columns.slice(0, 3);
    return (
      <div className="space-y-2 py-3">
        {cols.map((col) => (
          <div key={col.id} className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {col.header}
            </span>
            <span className="text-[0.9375rem] text-foreground">
              {col.accessor(row)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
        <table className="w-full text-[0.9375rem]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {selectable && (
                <th className="w-12 py-3 pl-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded accent-primary"
                    aria-label="Select all"
                  />
                </th>
              )}
              {columns.map((col) => {
                const isSorted = sortCol === col.id;
                const sortable = !!col.sortValue;
                return (
                  <th
                    key={col.id}
                    className={`px-4 py-3 text-xs font-medium uppercase text-muted-foreground ${
                      sortable ? "cursor-pointer select-none" : ""
                    }`}
                    style={{
                      textAlign: col.align ?? "left",
                      width: col.width,
                    }}
                    onClick={sortable ? () => handleSort(col.id) : undefined}
                    aria-sort={isSorted ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {sortable && (
                        <span className="inline-flex flex-col">
                          <ChevronUp
                            className="h-3 w-3 -mb-0.5"
                            style={{ opacity: isSorted && sortDir === "asc" ? 1 : 0.25 }}
                          />
                          <ChevronDown
                            className="h-3 w-3 -mt-0.5"
                            style={{ opacity: isSorted && sortDir === "desc" ? 1 : 0.25 }}
                          />
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody
            ref={tbodyRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className="focus:outline-none"
          >
            {paginated.map((row, ri) => {
              const key = keyExtractor(row);
              const isFocused = ri === focusedRow;
              const isSelected = selectedKeys?.has(key);
              return (
                <tr
                  key={key}
                  className={`border-b border-border transition-colors duration-100 hover:bg-muted/50 ${isSelected ? "bg-primary/10" : isFocused ? "bg-muted/50" : ""} ${onRowClick ? "cursor-pointer" : ""}`}
                  style={{ cursor: onRowClick ? "pointer" : undefined }}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onMouseEnter={() => setFocusedRow(ri)}
                >
                  {selectable && (
                    <td className="py-3 pl-4">
                      <input
                        type="checkbox"
                        checked={isSelected ?? false}
                        onChange={() => toggleRow(key)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded accent-primary"
                        aria-label={`Select row ${key}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className="px-4 py-3 text-sm text-foreground"
                      style={{ textAlign: col.align ?? "left" }}
                    >
                      {col.accessor(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {paginated.map((row) => {
          const key = keyExtractor(row);
          const cardContent = mobileCardRenderer ? mobileCardRenderer(row) : defaultMobileCard(row);
          return (
            <div
              key={key}
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              className={`rounded-lg border border-border bg-background p-4 text-left transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
            >
              {cardContent}
            </div>
          );
        })}
      </div>

      {data.length > pageSize && (
        <div className="mt-4">
          <Pagination page={page} perPage={pageSize} total={data.length} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
