"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Calculator,
  Receipt,
  Users,
  FileBarChart,
  Package,
  Truck,
  UserCog,
  DollarSign,
  BarChart3,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Keyboard,
} from "lucide-react";
import { ROUTES } from "@/lib/config/site";
import { useShortcuts } from "@/components/dashboard/ShortcutsContext";
import { useSidebar } from "@/components/dashboard/SidebarContext";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/Tooltip";

/** Placeholder until /api/auth/me or session context provides real user. */
const PLACEHOLDER_USER = { name: "Admin", email: "admin@acme.gy" };

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

function getGradientFromEmail(email: string): string {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = ((h << 5) - h + email.charCodeAt(i)) | 0;
  const hue = Math.abs(h % 360);
  return `linear-gradient(135deg, hsl(${hue}, 47%, 38%), hsl(${hue}, 47%, 26%))`;
}

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { label: "Accounting", href: "/dashboard/accounting", icon: Calculator },
  { label: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { label: "CRM", href: "/dashboard/crm", icon: Users },
  { label: "Quotations", href: "/dashboard/quotations", icon: FileBarChart },
  { label: "Inventory", href: "/dashboard/inventory", icon: Package },
  { label: "Procurement", href: "/dashboard/procurement", icon: Truck },
  { label: "HR", href: "/dashboard/hr", icon: UserCog },
  { label: "Payroll", href: "/dashboard/payroll", icon: DollarSign },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

const sections = [
  { title: "OVERVIEW", items: [nav[0]] },
  { title: "FINANCE", items: nav.slice(1, 4) },
  { title: "SALES", items: nav.slice(4, 6) },
  { title: "OPERATIONS", items: nav.slice(6, 8) },
  { title: "PEOPLE", items: nav.slice(8, 10) },
  { title: "REPORTS", items: nav.slice(10, 11) },
];

const SIDEBAR_WIDTH = 240;

function SidebarProfile({
  user,
  isCollapsed,
  onNavClick,
}: {
  user: { name: string; email: string };
  isCollapsed: boolean;
  onNavClick?: () => void;
}) {
  const router = useRouter();
  const { openShortcutsModal } = useShortcuts();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    try {
      const csrfRes = await fetch(`${API_BASE}/api/csrf`, { credentials: "include" });
      const csrfData = await csrfRes.json().catch(() => ({}));
      const token = csrfData?.data?.token ?? csrfData?.token;
      if (token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: { "X-CSRF-Token": token },
        });
      }
    } finally {
      router.push(ROUTES.login);
      router.refresh();
    }
  }

  const initials = getInitials(user.name);
  const gradient = getGradientFromEmail(user.email);

  const avatarEl = (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white transition-opacity"
      style={{ background: gradient }}
    >
      {initials}
    </div>
  );

  const avatarButton = (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-90"
      aria-expanded={open}
      aria-haspopup="true"
      aria-label="Account menu"
    >
      {avatarEl}
    </button>
  );

  const dropdown = open && (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="absolute left-0 bottom-full mb-1 w-56 rounded-lg border border-border bg-card py-1 shadow-lg"
    >
      <div className="border-b border-border px-3 py-2">
        <p className="truncate text-[0.9375rem] font-medium text-foreground">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground/60">{user.email}</p>
      </div>
      <Link
        href="/dashboard/settings"
        prefetch={true}
        onClick={() => { setOpen(false); onNavClick?.(); }}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/50"
      >
        <Settings className="h-4 w-4" />
        Account settings
      </Link>
      <button
        type="button"
        onClick={() => { setOpen(false); openShortcutsModal(); onNavClick?.(); }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/50"
      >
        <Keyboard className="h-4 w-4" />
        Keyboard shortcuts
      </button>
      <button
        type="button"
        onClick={handleSignOut}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/50"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </motion.div>
  );

  if (isCollapsed) {
    return (
      <div ref={containerRef} className="relative flex flex-col items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                {avatarButton}
                <div className="absolute left-full top-0 z-10 ml-1">
                  <AnimatePresence>{dropdown}</AnimatePresence>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Account</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
      >
        {avatarEl}
        <span className="min-w-0 truncate text-[0.9375rem] font-medium">
          {user.name}
        </span>
      </button>
      <div className="absolute left-0 bottom-full z-10 mb-1">
        <AnimatePresence>{dropdown}</AnimatePresence>
      </div>
      <Link
        href="/dashboard/settings"
        prefetch={true}
        onClick={onNavClick}
        className="flex items-center gap-2 px-3 py-2 text-[0.9375rem] font-medium text-muted-foreground transition-opacity hover:opacity-100"
      >
        <Settings className="h-4 w-4" />
        Settings
      </Link>
    </div>
  );
}

function SidebarContent({ onNavClick, forceExpanded }: { onNavClick?: () => void; forceExpanded?: boolean }) {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const isCollapsed = forceExpanded ? false : collapsed;

  return (
    <div className="flex h-full flex-col p-3">
      <Link href="/dashboard" prefetch={true} className="flex items-center gap-2.5 px-1 py-2" onClick={onNavClick}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          W
        </div>
        {!isCollapsed && (
          <motion.span
            className="font-semibold text-sm tracking-wide text-sidebar-foreground font-display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            WESTBRIDGE
          </motion.span>
        )}
      </Link>
      <div className="my-3 border-t border-sidebar-border" />
      <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden">
        {sections.map((sec, secIdx) => (
          <div key={sec.title}>
            {!isCollapsed && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
                {sec.title}
              </p>
            )}
            <div className="space-y-0.5">
              {sec.items.map((item, idxInSec) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                const staggerDelay = 0.04 * (secIdx * 6 + idxInSec);
                const linkEl = (
                  <Link
                    href={item.href}
                    prefetch={true}
                    onClick={onNavClick}
                    className={`relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-[background-color,color] duration-150 ease-out ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}
                    style={{ justifyContent: isCollapsed ? "center" : "flex-start" }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 h-5 w-[2.5px] -translate-y-1/2 rounded-r-full bg-primary"
                        transition={{ type: "tween", duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                      />
                    )}
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2 : 1.75} />
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15, delay: staggerDelay }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </Link>
                );
                return isCollapsed ? (
                  <TooltipProvider key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div key={item.href}>{linkEl}</div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border pt-3">
        <SidebarProfile
          user={PLACEHOLDER_USER}
          isCollapsed={isCollapsed}
          onNavClick={onNavClick}
        />
        <button
          type="button"
          onClick={toggle}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg py-1.5 text-xs text-muted-foreground/50 transition-colors hover:bg-sidebar-accent/50 hover:text-muted-foreground"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const { mobileOpen, setMobileOpen, collapsed } = useSidebar();

  const desktopSidebar = (
    <aside
      className="fixed left-0 top-0 z-10 hidden h-screen border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out md:block"
      style={{ width: collapsed ? 64 : SIDEBAR_WIDTH }}
    >
      <SidebarContent />
    </aside>
  );

  const mobileDrawer = (
    <AnimatePresence>
      {mobileOpen && (
        <>
          <motion.div
            role="button"
            tabIndex={-1}
            aria-label="Close menu"
            className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
          />
          <motion.aside
            className="fixed left-0 top-0 z-30 h-screen w-[240px] border-r border-sidebar-border bg-sidebar md:hidden"
            initial={{ x: -SIDEBAR_WIDTH }}
            animate={{ x: 0 }}
            exit={{ x: -SIDEBAR_WIDTH }}
            transition={{ type: "tween", duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent onNavClick={() => setMobileOpen(false)} forceExpanded />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {desktopSidebar}
      {mobileDrawer}
    </>
  );
}
