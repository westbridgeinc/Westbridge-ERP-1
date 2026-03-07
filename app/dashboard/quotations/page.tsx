"use client";

import { useState, useEffect, useCallback } from "react";
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

interface QuotationRow {
  id: string;
  customer: string;
  amount: number;
  validUntil: string;
  status: string;
}

function fmtDate(d: string): string {
  if (!d) return "—";
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
  const [data, setData] = useState<QuotationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    fetch("/api/erp/list?doctype=Quotation")
      .then((res) => { if (!res.ok) throw new Error(res.status === 401 ? "Session expired. Please sign in again." : "Failed to load quotations."); return res.json(); })
      .then((json) => { const raw = (json?.data ?? []) as QuotationRow[]; setData(raw); setError(null); })
      .catch((err: Error) => { setError(err.message); setData([]); })
      .finally(() => setLoading(false));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchData();
  }, [fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Quotations</h1>
            <p className="text-sm text-muted-foreground">Sales quotations and proposals</p>
          </div>
          <Button variant="primary">+ Create New</Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={load} className="mt-4">Retry</Button>
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
        <Button variant="primary">+ Create New</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? <SkeletonTable rows={6} columns={5} /> : (
            <DataTable
              columns={columns}
              data={data}
              keyExtractor={(r) => r.id}
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
        </CardContent>
      </Card>
      <AIChatPanel module="crm" />
    </div>
  );
}
