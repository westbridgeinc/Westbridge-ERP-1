"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { MODULE_EMPTY_STATES, EMPTY_STATE_SUPPORT_LINE } from "@/lib/dashboard/empty-state-config";
import { formatCurrency } from "@/lib/locale/currency";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { useErpList } from "@/lib/queries/useErpList";
import { CrmPipelineClient } from "./_components/CrmPipelineClient";
import type { Deal } from "./_components/CrmPipelineClient";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GenericRow {
  id: string;
  [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/*  Mappers                                                            */
/* ------------------------------------------------------------------ */

function mapErpCustomer(d: Record<string, unknown>): GenericRow {
  return {
    id: String(d.name ?? ""),
    customerName: String(d.customer_name ?? d.name ?? ""),
    customerType: String(d.customer_type ?? "\u2014"),
    territory: String(d.territory ?? "\u2014"),
  };
}

function mapErpLead(d: Record<string, unknown>): GenericRow {
  return {
    id: String(d.name ?? ""),
    leadName: String(d.lead_name ?? d.name ?? ""),
    company: String(d.company_name ?? d.company ?? "\u2014"),
    source: String(d.source ?? "\u2014"),
    status: String(d.status ?? "Open"),
  };
}

function mapErpOpportunity(d: Record<string, unknown>): Deal {
  const name = String(d.name ?? "");
  const company = String(d.party_name ?? d.opportunity_from ?? "\u2014");
  const amount = Number(d.opportunity_amount ?? 0);
  const contact = String(d.contact_person ?? d.contact_display ?? "\u2014");
  const created = d.creation ?? d.modified;
  const date = created ? String(created) : "";
  const status = String(d.status ?? "Open").trim();
  return { name, company, amount, contact, date, status };
}

/* ------------------------------------------------------------------ */
/*  Column definitions                                                 */
/* ------------------------------------------------------------------ */

const customerColumns: Column<GenericRow>[] = [
  { id: "id", header: "Customer ID", accessor: (r) => <span className="font-medium text-foreground">{r.id as string}</span>, sortValue: (r) => r.id },
  { id: "customerName", header: "Customer Name", accessor: (r) => <span className="text-foreground">{r.customerName as string}</span>, sortValue: (r) => r.customerName as string },
  { id: "customerType", header: "Type", accessor: (r) => <span className="text-muted-foreground">{r.customerType as string}</span>, sortValue: (r) => r.customerType as string },
  { id: "territory", header: "Territory", accessor: (r) => <span className="text-muted-foreground">{r.territory as string}</span>, sortValue: (r) => r.territory as string },
];

const leadColumns: Column<GenericRow>[] = [
  { id: "id", header: "Lead ID", accessor: (r) => <span className="font-medium text-foreground">{r.id as string}</span>, sortValue: (r) => r.id },
  { id: "leadName", header: "Lead Name", accessor: (r) => <span className="text-foreground">{r.leadName as string}</span>, sortValue: (r) => r.leadName as string },
  { id: "company", header: "Company", accessor: (r) => <span className="text-muted-foreground">{r.company as string}</span>, sortValue: (r) => r.company as string },
  { id: "source", header: "Source", accessor: (r) => <span className="text-muted-foreground">{r.source as string}</span>, sortValue: (r) => r.source as string },
  { id: "status", header: "Status", accessor: (r) => <Badge status={r.status as string}>{r.status as string}</Badge>, sortValue: (r) => r.status as string },
];

/* ------------------------------------------------------------------ */
/*  Config by type                                                     */
/* ------------------------------------------------------------------ */

const TYPE_CONFIG = {
  default: { doctype: "Customer", title: "Customers", subtitle: "Manage your customers" },
  lead: { doctype: "Lead", title: "Leads", subtitle: "Track and manage leads" },
  opportunity: { doctype: "Opportunity", title: "Opportunities", subtitle: "Track deals through your sales pipeline" },
} as const;

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

function CRMPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? "default";
  const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.default;
  const isOpportunity = type === "opportunity";

  const [page, setPage] = useState(0);
  const { data: rawList = [], hasMore, page: currentPage, isLoading: loading, isError, error: queryError, refetch } = useErpList(config.doctype, { page });

  const data = useMemo(() => {
    const list = rawList as Record<string, unknown>[];
    if (isOpportunity) return list.map(mapErpOpportunity);
    if (type === "lead") return list.map(mapErpLead);
    return list.map(mapErpCustomer);
  }, [rawList, isOpportunity, type]);
  const error = queryError instanceof Error ? queryError.message : isError ? `Failed to load ${config.title.toLowerCase()}.` : null;

  /* ---- Opportunity renders the pipeline view ---- */
  if (isOpportunity && !loading && !error) {
    return <CrmPipelineClient deals={data as Deal[]} />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display">{config.title}</h1>
            <p className="text-sm text-muted-foreground">{config.subtitle}</p>
          </div>
          <Button variant="primary" onClick={() => router.push("/dashboard/crm/new")}>+ Create New</Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Briefcase className="h-6 w-6" />
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
        <Button variant="primary" onClick={() => router.push("/dashboard/crm/new")}>+ Create New</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <SkeletonTable rows={6} columns={type === "lead" ? 5 : 4} />
          ) : (
            <DataTable<GenericRow>
              columns={type === "lead" ? leadColumns : customerColumns}
              data={data as GenericRow[]}
              keyExtractor={(r) => r.id}
              onRowClick={(record) => router.push(`/dashboard/crm/${encodeURIComponent(record.id)}`)}
              emptyState={
                <EmptyState
                  icon={<Briefcase className="h-6 w-6" />}
                  title={MODULE_EMPTY_STATES.crm.title}
                  description={MODULE_EMPTY_STATES.crm.description}
                  actionLabel={MODULE_EMPTY_STATES.crm.actionLabel}
                  actionHref={MODULE_EMPTY_STATES.crm.actionLink}
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

export default function CRMPage() {
  return (
    <Suspense fallback={null}>
      <CRMPageContent />
    </Suspense>
  );
}
