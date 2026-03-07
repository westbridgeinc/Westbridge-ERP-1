"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  FileText,
  FileBarChart,
  DollarSign,
  Users,
  Receipt,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WelcomeModal } from "@/components/dashboard/WelcomeModal";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { formatCurrency } from "@/lib/locale/currency";
import { cn } from "@/lib/utils";
import { AIChatPanel } from "@/components/ai/AIChatPanel";

const WELCOMED_KEY = "wb_welcomed";

interface RevenuePoint {
  month: string;
  value: number;
}

interface ActivityItem {
  text: string;
  time: string;
  type: "success" | "error" | "info" | "default";
}

interface DashboardData {
  revenueMTD: number;
  revenueChange: number;
  outstandingCount: number;
  openDealsCount: number;
  employeeCount: number;
  employeeDelta: number;
  revenueData: RevenuePoint[];
  activity: ActivityItem[];
}

async function fetchDashboardData(): Promise<DashboardData> {
  const res = await fetch("/api/erp/dashboard");
  if (!res.ok) {
    throw new Error(res.status === 401 ? "Session expired. Please sign in again." : "Failed to load dashboard data.");
  }
  const json = await res.json();
  return json.data as DashboardData;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function trendArrow(value: number): string {
  if (value > 0) return `↑ +${value}%`;
  if (value < 0) return `↓ ${value}%`;
  return "No change";
}

function activityDotColor(type: ActivityItem["type"]): string {
  switch (type) {
    case "success": return "bg-green-500";
    case "error": return "bg-destructive";
    case "info": return "bg-primary";
    default: return "bg-muted-foreground";
  }
}

const QUICK_ACTIONS = [
  { label: "New Invoice", href: "/dashboard/invoices", icon: FileText },
  { label: "Add Expense", href: "/dashboard/expenses", icon: DollarSign },
  { label: "Create Quote", href: "/dashboard/quotations", icon: FileBarChart },
];

type ErpStatus = "connected" | "syncing" | "error";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);
  const [erpStatus, setErpStatus] = useState<ErpStatus>("syncing");
  const checklistRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setShowWelcome(typeof window !== "undefined" ? localStorage.getItem(WELCOMED_KEY) !== "true" : false);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardData();
      setData(result);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    function checkErp() {
      fetch("/api/health/ready", { cache: "no-store" })
        .then((r) => setErpStatus(r.ok ? "connected" : "error"))
        .catch(() => setErpStatus("error"));
    }
    checkErp();
    const interval = setInterval(checkErp, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (error && !data) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{getGreeting()}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening at your account</p>
        <Card className="mt-8 border-destructive/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={loadData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{getGreeting()}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening at your account</p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div>
      <WelcomeModal
        open={showWelcome === true}
        onClose={() => setShowWelcome(false)}
        onGetStarted={() => {
          setShowWelcome(false);
          requestAnimationFrame(() => checklistRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{getGreeting()}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening at your account</p>
        </div>
        {erpStatus === "connected" && (
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
            ERP Connected
          </span>
        )}
        {erpStatus === "syncing" && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Connecting…
          </span>
        )}
        {erpStatus === "error" && (
          <span className="rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
            ERP Offline
          </span>
        )}
      </div>
      <OnboardingChecklist checklistRef={checklistRef} />

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data.revenueMTD, "USD")}</p>
            <p className={cn("mt-1 text-xs", data.revenueChange >= 0 ? "text-emerald-500" : "text-destructive")}>{trendArrow(data.revenueChange)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <p className="text-sm font-medium text-muted-foreground">Active Users</p>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-foreground">{data.employeeCount}</p>
            <p className={cn("mt-1 text-xs", data.employeeDelta >= 0 ? "text-emerald-500" : "text-destructive")}>{data.employeeDelta !== 0 ? trendArrow(data.employeeDelta) : "No change"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <p className="text-sm font-medium text-muted-foreground">Invoices</p>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-foreground">{data.outstandingCount} open</p>
            <p className={cn("mt-1 text-xs", data.outstandingCount > 0 ? "text-destructive" : "text-emerald-500")}>{data.outstandingCount > 0 ? "Requires follow-up" : "All clear"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-foreground">{data.openDealsCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">In pipeline</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <p className="font-serif text-lg font-semibold">Revenue</p>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Last 6 months</p>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height={256}>
            <AreaChart data={data.revenueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis hide domain={[0, 4]} />
              <Tooltip
                formatter={(value) => [value != null ? `${Number(value)}M` : "—", "Revenue"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6 }}
              />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#fillRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.activity.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No recent activity to display.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.activity.map((a, i) => (
                  <li key={i} className="flex items-center gap-3 px-6 py-3">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", activityDotColor(a.type))} />
                    <span className="flex-1 text-sm text-foreground">{a.text}</span>
                    <span className="text-xs text-muted-foreground">{a.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Button key={action.href} variant="outline" className="h-9 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent" asChild>
                  <Link href={action.href}>
                    <action.icon className="mr-2 h-4 w-4 shrink-0" />
                    {action.label}
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <AIChatPanel module="general" />
    </div>
  );
}
