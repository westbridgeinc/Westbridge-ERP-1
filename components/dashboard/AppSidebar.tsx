"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  Package,
  Calculator,
  Users,
  FolderKanban,
  Settings,
  LogOut,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { ROUTES } from "@/lib/config/site";
import { LogoLink } from "@/components/brand/Logo";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface SessionUser {
  name: string;
  email: string;
  role: string;
}

const SECTIONS = [
  {
    title: "Overview",
    icon: LayoutDashboard,
    items: [{ label: "Dashboard", href: "/dashboard" }],
  },
  {
    title: "Sales",
    icon: TrendingUp,
    items: [
      { label: "Quotations", href: "/dashboard/quotations" },
      { label: "Sales Orders", href: "/dashboard/invoices?type=order" },
      { label: "Sales Invoices", href: "/dashboard/invoices?type=invoice" },
      { label: "Customers", href: "/dashboard/crm" },
    ],
  },
  {
    title: "Purchasing",
    icon: ShoppingCart,
    items: [
      { label: "Purchase Orders", href: "/dashboard/procurement" },
      { label: "Purchase Invoices", href: "/dashboard/procurement?type=invoice" },
      { label: "Suppliers", href: "/dashboard/procurement?type=supplier" },
    ],
  },
  {
    title: "Inventory",
    icon: Package,
    items: [
      { label: "Items", href: "/dashboard/inventory" },
      { label: "Stock Entry", href: "/dashboard/inventory?type=entry" },
      { label: "Warehouses", href: "/dashboard/inventory?type=warehouse" },
    ],
  },
  {
    title: "Accounting",
    icon: Calculator,
    items: [
      { label: "Journal Entry", href: "/dashboard/accounting?type=journal" },
      { label: "Chart of Accounts", href: "/dashboard/accounting?type=coa" },
      { label: "Payment Entry", href: "/dashboard/accounting?type=payment" },
    ],
  },
  {
    title: "HR",
    icon: Users,
    items: [
      { label: "Employees", href: "/dashboard/hr" },
      { label: "Attendance", href: "/dashboard/hr?type=attendance" },
      { label: "Payroll", href: "/dashboard/payroll" },
    ],
  },
  {
    title: "Projects",
    icon: FolderKanban,
    items: [
      { label: "Projects", href: "/dashboard/analytics" },
      { label: "Tasks", href: "/dashboard/analytics?type=task" },
      { label: "Timesheets", href: "/dashboard/analytics?type=timesheet" },
    ],
  },
];

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((s) => s[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

function useSessionUser(): { user: SessionUser | null; loading: boolean } {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/validate", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { data?: { name?: string; email?: string; role?: string } }) => {
        const raw = d?.data;
        if (raw) {
          // Use the first part of the email as name fallback if name is empty
          const displayName =
            raw.name?.trim() ||
            (raw.email ? raw.email.split("@")[0].replace(/[._-]/g, " ") : "");
          setUser({
            name: displayName,
            email: raw.email ?? "",
            role: raw.role ?? "member",
          });
        }
      })
      .catch(() => {
        setUser({ name: "?", email: "—", role: "" });
      })
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [openSections, setOpenSections] = useState<string[]>(SECTIONS.map((s) => s.title));
  const { user, loading: userLoading } = useSessionUser();

  function isActive(href: string): boolean {
    const [hrefPath, hrefQuery] = href.split("?");
    if (hrefQuery) {
      // For items with ?type=..., match both path and query param
      const typeParam = new URLSearchParams(hrefQuery).get("type");
      return pathname === hrefPath && searchParams.get("type") === typeParam;
    }
    // Top-level path: match exactly or as parent
    return pathname === hrefPath || pathname.startsWith(hrefPath + "/");
  }

  async function handleSignOut() {
    try {
      const csrfRes = await fetch("/api/csrf");
      const csrfData = await csrfRes.json().catch(() => ({}));
      const token = csrfData?.data?.token ?? csrfData?.token;
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "X-CSRF-Token": token },
        });
      }
    } finally {
      router.push(ROUTES.login);
      router.refresh();
    }
  }

  const displayName = user?.name || "Loading…";
  const displayRole = user?.role || "";
  const initials = userLoading ? "…" : getInitials(user?.name || "?");

  return (
    <Sidebar className="w-[260px] min-w-[260px] data-[state=collapsed]:w-[60px] data-[state=collapsed]:min-w-[60px]">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-14 items-center justify-between gap-2 px-2">
          <LogoLink variant="mark" size="sm" className="text-foreground" />
          <SidebarTrigger className="size-8">
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {SECTIONS.map((section) => (
          <Collapsible
            key={section.title}
            open={collapsed ? false : openSections.includes(section.title)}
            onOpenChange={(open) =>
              setOpenSections((prev) =>
                open ? [...prev, section.title] : prev.filter((t) => t !== section.title)
              )
            }
          >
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="flex cursor-pointer items-center gap-2 py-1.5">
                  {!collapsed && (
                    <>
                      <section.icon className="size-4 shrink-0" />
                      <span className="flex-1 text-left">{section.title}</span>
                      <ChevronDown className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                    </>
                  )}
                  {collapsed && <section.icon className="size-4 shrink-0" />}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive(item.href)}>
                        <Link href={item.href}>
                          {collapsed ? null : item.label}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className={cn("flex flex-col gap-2 p-2", collapsed && "items-center")}>
          <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
            {userLoading ? (
              <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
            ) : (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                {initials}
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0 flex-1">
                {userLoading ? (
                  <>
                    <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
                    <div className="mt-1.5 h-2 w-14 animate-pulse rounded bg-muted" />
                  </>
                ) : (
                  <>
                    <p className="truncate text-[13px] font-medium">{displayName}</p>
                    <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                      {displayRole}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="flex-1 justify-start text-[13px]" asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 size-4" />
                  Settings
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="text-[13px]" onClick={handleSignOut}>
                <LogOut className="size-4" />
              </Button>
            </div>
          )}
          {collapsed && (
            <div className="flex flex-col gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard/settings" title="Settings">
                  <Settings className="size-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Log out">
                <LogOut className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
