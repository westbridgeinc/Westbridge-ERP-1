"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MoreHorizontal,
  Pencil,
  Send,
  Printer,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface FieldDef {
  key: string;
  label: string;
  value?: React.ReactNode;
  /** If not provided, data[key] is rendered as string */
  format?: (val: unknown) => React.ReactNode;
}

export interface DetailSection {
  label: string;
  fields: FieldDef[];
}

export interface LineItemColumn {
  id: string;
  header: string;
  accessor: (row: Record<string, unknown>) => React.ReactNode;
}

export interface TimelineEvent {
  id: string;
  date: string;
  label: string;
  description?: string;
}

export interface ErpDetailPageProps {
  title: string;
  doctype: string;
  name: string;
  data: Record<string, unknown>;
  sections: DetailSection[];
  status?: string;
  /** Badge variant based on status */
  statusVariant?: "default" | "secondary" | "destructive" | "outline" | "success";
  backHref: string;
  onEdit?: () => void;
  onSubmit?: () => void;
  onPrint?: () => void;
  onDuplicate?: () => void;
  /** Optional line items table */
  lineItems?: Record<string, unknown>[];
  lineItemColumns?: LineItemColumn[];
  /** Optional timeline/activity */
  timeline?: TimelineEvent[];
  /** Extra actions in overflow menu */
  extraActions?: { label: string; onClick: () => void }[];
}

function formatDefault(val: unknown): React.ReactNode {
  if (val == null || val === "") return "—";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (val instanceof Date) return val.toLocaleDateString();
  return String(val);
}

export function ErpDetailPage({
  title,
  data,
  sections,
  status,
  statusVariant = "default",
  backHref,
  onEdit,
  onSubmit,
  onPrint,
  onDuplicate,
  lineItems = [],
  lineItemColumns = [],
  timeline = [],
  extraActions = [],
}: ErpDetailPageProps) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    }
    if (overflowOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [overflowOpen]);

  const hasActions = onEdit || onSubmit || onPrint || onDuplicate || extraActions.length > 0;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link href={backHref} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              {status != null && (
                <Badge variant={statusVariant}>{status}</Badge>
              )}
            </div>
          </div>
        </div>
        {hasActions && (
          <div className="flex flex-wrap items-center gap-2">
            {onEdit && (
              <Button variant="outline" size="default" onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {onSubmit && (
              <Button variant="default" size="default" onClick={onSubmit}>
                <Send className="mr-2 h-4 w-4" />
                Submit
              </Button>
            )}
            {onPrint && (
              <Button variant="outline" size="default" onClick={onPrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            )}
            {onDuplicate && (
              <Button variant="outline" size="default" onClick={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </Button>
            )}
            {extraActions.length > 0 && (
              <div className="relative inline-block" ref={overflowRef}>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setOverflowOpen((v) => !v)}
                  aria-expanded={overflowOpen}
                  aria-haspopup="true"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More actions</span>
                </Button>
                {overflowOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-md border border-border bg-popover py-1 shadow-md">
                    {extraActions.map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => {
                          a.onClick();
                          setOverflowOpen(false);
                        }}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document body: sections as cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((sec) => (
          <Card key={sec.label}>
            <CardHeader className="pb-2">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {sec.label}
              </h2>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sec.fields.map((f) => {
                const raw = data[f.key];
                const val = f.value !== undefined ? f.value : formatDefault(raw);
                const display = f.format ? f.format(raw) : val;
                return (
                  <div key={f.key} className="space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {f.label}
                    </p>
                    <p className="text-sm font-normal text-foreground">
                      {display}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Line items table */}
      {lineItems.length > 0 && lineItemColumns.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Line items
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {lineItemColumns.map((col) => (
                    <TableHead
                      key={col.id}
                      className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      {col.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((row, i) => (
                  <TableRow key={i}>
                    {lineItemColumns.map((col) => (
                      <TableCell key={col.id} className="text-sm">
                        {col.accessor(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Timeline / activity */}
      {timeline.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Activity
            </h2>
          </CardHeader>
          <CardContent>
            <div className="relative border-l-2 border-border pl-6">
              {timeline.map((evt, i) => (
                <div key={evt.id} className={cn("relative pb-6", i === timeline.length - 1 && "pb-0")}>
                  <span className="absolute -left-[9px] top-1 h-2 w-2 rounded-full bg-primary" />
                  <p className="text-xs text-muted-foreground">{evt.date}</p>
                  <p className="font-medium text-foreground">{evt.label}</p>
                  {evt.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{evt.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
