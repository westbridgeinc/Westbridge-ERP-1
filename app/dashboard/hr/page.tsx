"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { UserCog } from "lucide-react";
import { MODULE_EMPTY_STATES, EMPTY_STATE_SUPPORT_LINE } from "@/lib/dashboard/empty-state-config";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/locale/date";
import { AIChatPanel } from "@/components/ai/AIChatPanel";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Employee {
  id: string;
  name: string;
  designation: string;
  department: string;
  status: "Active" | "Inactive";
  dateJoined: string; // ISO date
}

interface HRStats {
  total: number;
  active: number;
  inactive: number;
}

/* ------------------------------------------------------------------ */
/*  No local demo data — real data comes from /api/erp/list            */
/* ------------------------------------------------------------------ */

function deriveStats(employees: Employee[]): HRStats {
  const active = employees.filter((e) => e.status === "Active").length;
  return { total: employees.length, active, inactive: employees.length - active };
}

/* ------------------------------------------------------------------ */
/*  Columns                                                            */
/* ------------------------------------------------------------------ */

const columns: Column<Employee>[] = [
  {
    id: "name",
    header: "Name",
    accessor: (row) => (
      <span className="font-medium text-foreground">{row.name}</span>
    ),
    sortValue: (row) => row.name,
  },
  {
    id: "designation",
    header: "Designation",
    accessor: (row) => (
      <span className="text-muted-foreground">{row.designation}</span>
    ),
    sortValue: (row) => row.designation,
  },
  {
    id: "department",
    header: "Department",
    accessor: (row) => (
      <span className="text-muted-foreground">{row.department}</span>
    ),
    sortValue: (row) => row.department,
  },
  {
    id: "status",
    header: "Status",
    accessor: (row) => <Badge status={row.status}>{row.status}</Badge>,
    sortValue: (row) => row.status,
  },
  {
    id: "dateJoined",
    header: "Date Joined",
    accessor: (row) => (
      <span className="text-muted-foreground/60">{formatDate(row.dateJoined)}</span>
    ),
    sortValue: (row) => row.dateJoined,
  },
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function HRPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        '/api/erp/list?doctype=Employee&limit_page_length=100&fields=["name","employee_name","designation","department","status","date_of_joining"]',
        { signal }
      );
      if (!res.ok) { setEmployees([]); return; }
      const json = await res.json();
      const raw: Record<string, unknown>[] = Array.isArray(json?.data) ? json.data : [];
      const mapped: Employee[] = raw.map((r, i) => ({
        id: String(r.name ?? `EMP-${i}`),
        name: String(r.employee_name ?? r.name ?? ""),
        designation: String(r.designation ?? "—"),
        department: String(r.department ?? "—"),
        status: String(r.status ?? "") === "Active" ? "Active" : "Inactive",
        dateJoined: String(r.date_of_joining ?? ""),
      }));
      setEmployees(mapped);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchEmployees(controller.signal);
    return () => controller.abort();
  }, []);

  const stats = useMemo(() => deriveStats(employees), [employees]);

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">HR</h1>
        <p className="text-sm text-muted-foreground">Employee directory and management</p>
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
            <Button variant="outline" size="sm" onClick={() => fetchEmployees(new AbortController().signal)}>Retry</Button>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="min-h-[88px] rounded-xl border border-border bg-card p-6 animate-pulse" />
          ))}
        </div>
        <Card>
          <CardContent className="p-0">
            <SkeletonTable rows={8} columns={5} />
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---- Success / Empty states ---- */
  return (
    <div className="space-y-6">
      {header}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Total Employees" value={stats.total} />
        <MetricCard label="Active" value={stats.active} subtextVariant="success" />
        <MetricCard label="Inactive" value={stats.inactive} subtextVariant="muted" />
      </div>
      <Card>
        <CardContent className="p-0">
          <DataTable<Employee>
        columns={columns}
        data={employees}
        keyExtractor={(r) => r.id}
        loading={false}
        emptyState={
          <EmptyState
            icon={<UserCog className="h-6 w-6" />}
            title={MODULE_EMPTY_STATES.hr.title}
            description={MODULE_EMPTY_STATES.hr.description}
            actionLabel={MODULE_EMPTY_STATES.hr.actionLabel}
            actionHref={MODULE_EMPTY_STATES.hr.actionLink}
            supportLine={EMPTY_STATE_SUPPORT_LINE}
          />
        }
        pageSize={20}
          />
        </CardContent>
      </Card>
      <AIChatPanel module="hr" />
    </div>
  );
}
