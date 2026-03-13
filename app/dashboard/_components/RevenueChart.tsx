"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

interface RevenuePoint {
  month: string;
  value: number;
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div
      className="mt-8 rounded-xl border border-border bg-card p-6"
      role="figure"
      aria-label="Revenue chart — last 6 months"
    >
      <p className="font-display text-lg font-semibold text-foreground">Revenue</p>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Last 6 months</p>
      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height={256}>
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis hide domain={[0, 4]} />
            <Tooltip
              formatter={(value) => [value != null ? `${Number(value)}M` : "\u2014", "Revenue"]}
              contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6 }}
            />
            <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} fill="url(#fillRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
