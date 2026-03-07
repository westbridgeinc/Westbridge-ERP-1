"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Bell, FileText, UserPlus, Menu } from "lucide-react";
import { DashboardBreadcrumbs } from "./DashboardBreadcrumbs";
import { CommandPalette } from "./CommandPalette";
import { NotificationPanel, useNotifications } from "./NotificationPanel";
import { ShortcutsModal } from "./ShortcutsModal";
import { useShortcuts } from "./ShortcutsContext";
import { useSidebar } from "./SidebarContext";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";

export function DashboardTopbar() {
  const [openCommand, setOpenCommand] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const { setMobileOpen } = useSidebar();
  const { openShortcuts, setOpenShortcuts, openShortcutsModal } = useShortcuts();
  const {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAllRead,
    markRead,
  } = useNotifications();

  useKeyboardShortcuts({
    onOpenCommand: () => setOpenCommand(true),
    onOpenNotifications: () => setOpenNotifications((v) => !v),
    onOpenShortcuts: openShortcutsModal,
  });

  useEffect(() => {
    if (openNotifications) fetchNotifications();
  }, [openNotifications, fetchNotifications]);

  return (
    <>
      <header className="sticky top-0 z-[9] flex items-center justify-between gap-2 border-b border-border bg-background py-4 md:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <DashboardBreadcrumbs />
        </div>
        <button
          type="button"
          onClick={() => setOpenCommand(true)}
          className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-left text-base text-muted-foreground/60 transition-colors hover:bg-muted md:px-4"
        >
          <Search className="h-4 w-4 shrink-0 opacity-70" />
          <span className="hidden sm:inline">Search modules, records…</span>
          <kbd className="ml-auto hidden rounded border border-border px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
            ⌘K
          </kbd>
        </button>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/dashboard/invoices"
            prefetch={true}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">New Invoice</span>
          </Link>
          <Link
            href="/dashboard/crm"
            prefetch={true}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">New Contact</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpenNotifications(true)}
            className="relative rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>
      <CommandPalette open={openCommand} onClose={() => setOpenCommand(false)} />
      <ShortcutsModal open={openShortcuts} onClose={() => setOpenShortcuts(false)} />
      <NotificationPanel
        open={openNotifications}
        onClose={() => setOpenNotifications(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
        onMarkRead={markRead}
        loading={loading}
      />
    </>
  );
}
