"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "@/lib/config/site";

const LABELS: Record<string, string> = {
  accounting: "Accounting",
  analytics: "Analytics",
  crm: "CRM",
  expenses: "Expenses",
  hr: "HR",
  inventory: "Inventory",
  invoices: "Invoices",
  payroll: "Payroll",
  procurement: "Procurement",
  quotations: "Quotations",
  settings: "Settings",
};

export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname?.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean) ?? [];
  if (segments.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
      <Link href={ROUTES.dashboard} prefetch={true} className="text-muted-foreground/40 transition-colors hover:opacity-100">
        Dashboard
      </Link>
      {segments.map((segment, i) => {
        const label = LABELS[segment] ?? segment;
        const href = `${ROUTES.dashboard}/${segments.slice(0, i + 1).join("/")}`;
        const isLast = i === segments.length - 1;
        return (
          <span key={segment} className="flex items-center gap-2">
            <span aria-hidden>/</span>
            {isLast ? (
              <span className="text-muted-foreground">{label}</span>
            ) : (
              <Link href={href} prefetch={true} className="text-muted-foreground/40 transition-colors hover:opacity-100">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
