"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MODULE_EMPTY_STATES, EMPTY_STATE_SUPPORT_LINE } from "@/lib/dashboard/empty-state-config";

const revData = [
  { month: "Mar", value: 2.1 }, { month: "Apr", value: 2.4 }, { month: "May", value: 2.6 },
  { month: "Jun", value: 2.8 }, { month: "Jul", value: 2.9 }, { month: "Aug", value: 3.0 },
  { month: "Sep", value: 2.8 }, { month: "Oct", value: 3.1 }, { month: "Nov", value: 2.9 },
  { month: "Dec", value: 3.4 }, { month: "Jan", value: 3.0 }, { month: "Feb", value: 3.2 },
];

const topCustomers = [
  { name: "Republic Bank GY", revenue: "4.2M" },
  { name: "Demerara Shipping Co", revenue: "2.8M" },
  { name: "New Amsterdam Builders", revenue: "2.1M" },
  { name: "Georgetown Hardware Ltd", revenue: "1.9M" },
  { name: "Linden Mining Corp", revenue: "1.5M" },
];

const byCategory = [
  { name: "Construction", value: 8.2 }, { name: "Retail", value: 4.1 },
  { name: "Services", value: 3.5 }, { name: "Manufacturing", value: 2.8 }, { name: "Other", value: 1.4 },
];

export default function AnalyticsPage() {
  const [hasData, setHasData] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/erp/dashboard")
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          setHasData(false);
          return;
        }
        return res.json();
      })
      .then((json) => {
        if (cancelled || json === undefined) return;
        const d = json?.data;
        const revenue = Number(d?.revenueMTD ?? 0);
        const activity = Array.isArray(d?.activity) ? d.activity : [];
        setHasData(revenue > 0 || activity.length > 0);
      })
      .catch(() => {
        if (!cancelled) setHasData(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (hasData === false) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground">Reports and business intelligence</p>
          </div>
          <Button variant="primary" className="pointer-events-none opacity-60">+ Create New</Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={<BarChart3 className="h-6 w-6" />}
              title={MODULE_EMPTY_STATES.analytics.title}
              description={MODULE_EMPTY_STATES.analytics.description}
              actionLabel={MODULE_EMPTY_STATES.analytics.actionLabel}
              actionHref={MODULE_EMPTY_STATES.analytics.actionLink}
              supportLine={EMPTY_STATE_SUPPORT_LINE}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Reports and business intelligence</p>
        </div>
        <Button variant="primary" className="pointer-events-none opacity-60">+ Create New</Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Revenue" value="USD 3.2M" subtext="↑ 8% vs last quarter" subtextVariant="success" />
        <MetricCard label="Expenses" value="USD 2.1M" subtext="↑ 3% vs last quarter" subtextVariant="error" />
        <MetricCard label="Profit Margin" value="34.4%" subtext="↑ 2.1pp" subtextVariant="success" />
        <MetricCard label="Outstanding" value="USD 1.8M" subtext="12 invoices overdue" subtextVariant="error" />
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-xl font-semibold text-foreground">Revenue Trend</p>
          <p className="mt-0.5 text-sm text-muted-foreground">Last 12 months</p>
        <div className="mt-4 h-64 min-h-[256px] w-full">
          <ResponsiveContainer width="100%" height={256}>
            <AreaChart data={revData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillRevAnalytics" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground) / 0.6)" }} />
              <YAxis hide domain={[0, 4]} />
              <Tooltip
                formatter={(value) => [value != null ? `${Number(value)}M` : "—", "Revenue"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.25rem", color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#fillRevAnalytics)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
          <p className="text-xl font-semibold text-foreground">Top Customers by Revenue</p>
          <ul className="mt-4 space-y-3 text-base">
            {topCustomers.map((c, i) => (
              <li key={c.name} className="flex items-center justify-between">
                <span className="text-muted-foreground/60">{i + 1}.</span>
                <span className="flex-1 pl-2 text-foreground">{c.name}</span>
                <span className="font-medium text-foreground">USD {c.revenue}</span>
              </li>
            ))}
          </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
          <p className="text-xl font-semibold text-foreground">Revenue by Category</p>
          <div className="mt-4 h-48 min-h-[192px] w-full">
            <ResponsiveContainer width="100%" height={192}>
              <BarChart data={byCategory} layout="vertical" margin={{ top: 0, right: 0, left: 80, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={80} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground) / 0.6)" }} />
                <Tooltip
                  formatter={(value) => [`${Number(value)}M`, "Revenue"]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.25rem", color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

