"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Briefcase } from "lucide-react";
import { MODULE_EMPTY_STATES, EMPTY_STATE_SUPPORT_LINE } from "@/lib/dashboard/empty-state-config";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/locale/currency";
import { formatDate } from "@/lib/locale/date";
import { AIChatPanel } from "@/components/ai/AIChatPanel";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Deal = {
  name: string;
  company: string;
  amount: number;
  contact: string;
  date: string;
  status: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

const DEFAULT_STAGES = ["Open", "Quotation", "Negotiation", "Won", "Lost"];

/* ------------------------------------------------------------------ */
/*  Skeleton loading state                                             */
/* ------------------------------------------------------------------ */

function KanbanSkeleton() {
  return (
    <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="min-w-[280px] flex-1 rounded-xl border border-border bg-muted p-3"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="h-4 w-20 animate-pulse rounded bg-border" />
            <div className="h-3 w-16 animate-pulse rounded bg-border" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CRMPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setFetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/erp/list?doctype=Opportunity`, { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          throw new Error("Session expired. Please sign in again.");
        }
        if (!res.ok) throw new Error("Failed to load pipeline.");
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        const raw = (json?.data ?? []) as Record<string, unknown>[];
        setDeals(raw.map(mapErpOpportunity));
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setDeals([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  const columns = useMemo(() => {
    const statuses = Array.from(new Set(deals.map((d) => d.status).filter(Boolean)));
    const order = statuses.length
      ? statuses.sort((a, b) => {
          const ia = DEFAULT_STAGES.indexOf(a);
          const ib = DEFAULT_STAGES.indexOf(b);
          if (ia === -1 && ib === -1) return a.localeCompare(b);
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        })
      : DEFAULT_STAGES;
    return order.map((status) => {
      const items = deals.filter((d) => d.status === status);
      const total = items.reduce((sum, d) => sum + d.amount, 0);
      return {
        id: status,
        title: status,
        count: items.length,
        total,
        deals: items,
      };
    });
  }, [deals]);

  /* ---------- Error state ---------- */
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display">CRM Pipeline</h1>
            <p className="text-sm text-muted-foreground">Track deals through your sales pipeline</p>
          </div>
          <Button variant="primary" asChild><Link href="/dashboard/crm/new">+ Create New</Link></Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Briefcase className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">Something went wrong</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={retry}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------- Main render ---------- */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">CRM Pipeline</h1>
          <p className="text-sm text-muted-foreground">Track deals through your sales pipeline</p>
        </div>
        <Button variant="primary" asChild><Link href="/dashboard/crm/new">+ Create New</Link></Button>
      </div>
      {loading ? (
        <KanbanSkeleton />
      ) : deals.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
            icon={<Users className="h-6 w-6" />}
            title={MODULE_EMPTY_STATES.crm.title}
            description={MODULE_EMPTY_STATES.crm.description}
            actionLabel={MODULE_EMPTY_STATES.crm.actionLabel}
            actionHref={MODULE_EMPTY_STATES.crm.actionLink}
            supportLine={EMPTY_STATE_SUPPORT_LINE}
          />
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <div
              key={col.id}
              className="min-w-[280px] flex-1 rounded-xl border border-border/70 bg-muted/50 p-3"
            >
              {/* Column header */}
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground font-display">
                    {col.title}
                  </h2>
                  <Badge status={col.title}>{col.count}</Badge>
                </div>
                <span className="text-xs font-medium text-muted-foreground/70">
                  {col.total > 0 ? formatCurrency(col.total, "USD") : "\u2014"}
                </span>
              </div>

              {/* Deal cards */}
              <div className="space-y-3">
                {col.deals.map((deal) => (
                  <div
                    key={deal.name}
                    onClick={() => router.push(`/dashboard/crm/${encodeURIComponent(deal.name)}`)}
                    className="cursor-pointer rounded-lg border border-border/70 bg-card p-4 transition-all duration-150 hover:border-primary/20 hover:shadow-sm"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {deal.company}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {deal.amount > 0 ? formatCurrency(deal.amount, "USD") : "\u2014"}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground/60">
                        {deal.contact}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          {initials(deal.contact)}
                        </span>
                        <span className="text-xs text-muted-foreground/60">
                          {deal.date ? formatDate(deal.date) : "\u2014"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {col.deals.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground/60">
                    No deals
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <AIChatPanel module="crm" />
    </div>
  );
}
