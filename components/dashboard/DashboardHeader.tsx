"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, Menu } from "lucide-react";
import { ROUTES } from "@/lib/config/site";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/Button";
import { useSidebar } from "@/components/ui/sidebar";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { NotificationPanel, useNotifications } from "@/components/dashboard/NotificationPanel";
import { ShortcutsModal } from "@/components/dashboard/ShortcutsModal";
import { useShortcuts } from "@/components/dashboard/ShortcutsContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";

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
  dashboard: "Dashboard",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const [openCommand, setOpenCommand] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const { setOpenMobile, isMobile } = useSidebar();
  const { openShortcuts, setOpenShortcuts, openShortcutsModal } = useShortcuts();
  const { notifications, unreadCount, fetchNotifications, markAllRead, markRead, loading } = useNotifications();

  useKeyboardShortcuts({
    onOpenCommand: () => setOpenCommand(true),
    onOpenNotifications: () => setOpenNotifications((v) => !v),
    onOpenShortcuts: openShortcutsModal,
  });

  useEffect(() => {
    if (openNotifications) fetchNotifications();
  }, [openNotifications, fetchNotifications]);

  const segments = pathname?.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean) ?? [];
  const breadcrumbItems = segments.length === 0 ? [] : ["dashboard", ...segments];

  return (
    <>
      <header className="sticky top-0 z-[9] flex h-14 shrink-0 items-center gap-4 border-b bg-card px-4 backdrop-blur supports-[backdrop-filter]:bg-card/95">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setOpenMobile(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
          )}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={ROUTES.dashboard}>Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbItems.slice(1).map((segment, i) => {
                const href = `${ROUTES.dashboard}/${breadcrumbItems.slice(1, i + 2).join("/")}`;
                const label = LABELS[segment] ?? segment;
                const isLast = i === breadcrumbItems.length - 2;
                return (
                  <span key={segment} className="flex items-center gap-1.5">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage>{label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={href}>{label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex"
            onClick={() => setOpenCommand(true)}
            aria-label="Search (Cmd+K)"
          >
            <Search className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpenNotifications((v) => !v)}
            aria-label="Notifications"
            className="relative"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 size-2 rounded-full bg-destructive" />
            )}
          </Button>
        </div>
      </header>
      <CommandPalette open={openCommand} onClose={() => setOpenCommand(false)} />
      <NotificationPanel
        open={openNotifications}
        onClose={() => setOpenNotifications(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
        onMarkRead={markRead}
        loading={loading}
      />
      <ShortcutsModal open={openShortcuts} onClose={() => setOpenShortcuts(false)} />
    </>
  );
}
