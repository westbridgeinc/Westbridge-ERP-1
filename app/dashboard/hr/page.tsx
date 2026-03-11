"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { useErpList } from "@/lib/queries/useErpList";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Employee {
  id: string;
  name: string;
  designation: string;
  department: string;
  status: "Active" | "Inactive";
  dateJoined: string;
}

interface HRStats {
  total: number;
  active: number;
  inactive: number;
}

/* ------------------------------------------------------------------ */
/*  Mapper & Stats                                                     */
/* ------------------------------------------------------------------ */

function mapErpEmployee(r: Record<string, unknown>, i: number): Employee {
  return {
    id: String(r.name ?? `EMP-${i}`),
    name: String(r.employee_name ?? r.name ?? ""),
    designation: String(r.designation ?? "\u2014"),
    department: String(r.department ?? "\u2014"),
    status: String(r.status ?? "") === "Active" ? "Active" : "Inactive",
    dateJoined: String(r.date_of_joining ?? ""),
  };
}

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
  const router = useRouter();
  const [page, setPage] = useState(0);
  const {
    data: rawList = [],
    hasMore,
    page: currentPage,
    isLoading: loading,
    isError,
    error: queryError,
    refetch,
  } = useErpList("Employee", {
    page,
    limit: 100,
    fields: ["name", "employee_name", "designation", "department", "status", "date_of_joining"],
  });

  const employees = useMemo(
    () => (rawList as Record<string, unknown>[]).map(mapErpEmployee),
    [rawList],
  );
  const error = queryError instanceof Error ? queryError.message : isError ? "Failed to load employees." : null;
  const stats = useMemo(() => deriveStats(employees), [employees]);

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display">HR</h1>
        <p className="text-sm text-muted-foreground">Employee directory and management</p>
      </div>
      <Button variant="primary" onClick={() => router.push("/dashboard/hr/new")}>+ Create New</Button>
    </div>
  );

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <UserCog className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">Something went wrong</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button variant="primary" size="sm" onClick={() => refetch()}>Retry</Button>
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
            onRowClick={(record) => router.push(`/dashboard/hr/${encodeURIComponent(record.id)}`)}
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
      <AIChatPanel module="hr" />
    </div>
  );
}
