/**
 * GET /api/erp/dashboard
 * Aggregates the metrics shown on the main dashboard page:
 *   - Revenue MTD (Sales Invoices, status=Paid)
 *   - Outstanding invoice count
 *   - Open sales orders count
 *   - Employee count
 *   - 6-month revenue trend
 *   - Recent activity feed
 *
 * If ERPNext is unreachable (offline, cold start, demo mode) we return
 * deterministic demo data so the dashboard never renders blank.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/services/session.service";
import { list } from "@/lib/services/erp.service";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { securityHeaders } from "@/lib/security-headers";
import { checkTieredRateLimit, getClientIdentifier, rateLimitHeaders } from "@/lib/api/rate-limit-tiers";
import { COOKIE } from "@/lib/constants";
import { prisma } from "@/lib/data/prisma";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

interface RevenuePoint { month: string; value: number }
interface ActivityItem { text: string; time: string; type: "success" | "error" | "info" | "default" }

interface DashboardPayload {
  revenueMTD: number;
  revenueChange: number;
  outstandingCount: number;
  openDealsCount: number;
  employeeCount: number;
  employeeDelta: number;
  revenueData: RevenuePoint[];
  activity: ActivityItem[];
}

// ─── Demo / fallback data ─────────────────────────────────────────────────────
// Returned when ERPNext is unreachable so the page always renders.
const DEMO_DATA: DashboardPayload = {
  revenueMTD: 48250,
  revenueChange: 12,
  outstandingCount: 7,
  openDealsCount: 14,
  employeeCount: 23,
  employeeDelta: 2,
  revenueData: [
    { month: "Sep", value: 1.8 },
    { month: "Oct", value: 2.1 },
    { month: "Nov", value: 2.4 },
    { month: "Dec", value: 1.9 },
    { month: "Jan", value: 3.1 },
    { month: "Feb", value: 3.4 },
  ],
  activity: [
    { text: "Invoice #SI-00041 paid — $4,200", time: "2h ago", type: "success" },
    { text: "New sales order from Massy Distribution", time: "4h ago", type: "info" },
    { text: "Purchase order approved — $12,500", time: "6h ago", type: "success" },
    { text: "Payroll run completed for 23 employees", time: "1d ago", type: "success" },
    { text: "Invoice #SI-00039 overdue — $1,800", time: "2d ago", type: "error" },
  ],
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Real data aggregation ────────────────────────────────────────────────────

async function buildDashboardData(
  sessionId: string,
  accountId: string,
  erpnextCompany: string | null
): Promise<DashboardPayload> {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  // Parallel ERP fetches — any individual failure falls back gracefully
  const [invoicesRes, ordersRes, employeesRes] = await Promise.allSettled([
    list("Sales Invoice", sessionId, { limit_page_length: "100" }, accountId, erpnextCompany),
    list("Sales Order", sessionId, { limit_page_length: "50", filters: JSON.stringify([["Sales Order", "status", "in", ["Draft", "To Deliver and Bill", "To Bill", "To Deliver"]]]) }, accountId, erpnextCompany),
    list("Employee", sessionId, { limit_page_length: "100", fields: JSON.stringify(["name", "date_of_joining", "status"]) }, accountId, erpnextCompany),
  ]);

  // If all three calls failed, bail out to demo data
  const anySucceeded = [invoicesRes, ordersRes, employeesRes].some((r) => r.status === "fulfilled" && r.value.ok);
  if (!anySucceeded) return DEMO_DATA;

  // Revenue MTD — sum paid invoices this month
  const invoices = invoicesRes.status === "fulfilled" && invoicesRes.value.ok
    ? (invoicesRes.value.data as Record<string, unknown>[])
    : [];

  let revenueMTD = 0;
  let outstandingCount = 0;

  for (const inv of invoices) {
    const status = String(inv.status ?? "");
    const postingDate = String(inv.posting_date ?? "");
    const grandTotal = Number(inv.grand_total ?? 0);

    if (status === "Paid" && postingDate >= firstOfMonth) {
      revenueMTD += grandTotal;
    }
    if (status === "Unpaid" || status === "Overdue") {
      outstandingCount++;
    }
  }

  // 6-month revenue trend
  const revenueByMonth: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    revenueByMonth[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = 0;
  }
  for (const inv of invoices) {
    if (String(inv.status ?? "") !== "Paid") continue;
    const month = String(inv.posting_date ?? "").slice(0, 7);
    if (month in revenueByMonth) {
      revenueByMonth[month] += Number(inv.grand_total ?? 0);
    }
  }
  const revenueData: RevenuePoint[] = Object.entries(revenueByMonth).map(([key, val]) => {
    const [, m] = key.split("-");
    return { month: MONTH_LABELS[parseInt(m, 10) - 1], value: parseFloat((val / 1_000_000).toFixed(2)) };
  });

  // Revenue change (last month vs month before)
  const monthValues = Object.values(revenueByMonth);
  const prevMonth = monthValues[monthValues.length - 2] ?? 0;
  const currMonth = monthValues[monthValues.length - 1] ?? 0;
  const revenueChange = prevMonth > 0
    ? Math.round(((currMonth - prevMonth) / prevMonth) * 100)
    : 0;

  // Open sales orders
  const openDealsCount =
    ordersRes.status === "fulfilled" && ordersRes.value.ok
      ? (ordersRes.value.data as unknown[]).length
      : DEMO_DATA.openDealsCount;

  // Employee count (active employees only)
  const employees =
    employeesRes.status === "fulfilled" && employeesRes.value.ok
      ? (employeesRes.value.data as Record<string, unknown>[])
      : [];
  const activeEmployees = employees.filter((e) => String(e.status ?? "") !== "Left");
  const employeeCount = activeEmployees.length || DEMO_DATA.employeeCount;

  // Delta: employees who joined this month
  const employeeDelta = activeEmployees.filter((e) => {
    const joined = String(e.date_of_joining ?? "");
    return joined >= firstOfMonth;
  }).length;

  // Activity feed — recent invoices + orders
  const activityItems: ActivityItem[] = [];
  for (const inv of invoices.slice(0, 8)) {
    const status = String(inv.status ?? "");
    if (status === "Paid") {
      activityItems.push({
        text: `Invoice ${String(inv.name ?? "")} paid — $${Number(inv.grand_total ?? 0).toLocaleString()}`,
        time: formatRelativeTime(String(inv.modified ?? inv.creation ?? "")),
        type: "success",
      });
    } else if (status === "Overdue") {
      activityItems.push({
        text: `Invoice ${String(inv.name ?? "")} overdue — $${Number(inv.outstanding_amount ?? inv.grand_total ?? 0).toLocaleString()}`,
        time: formatRelativeTime(String(inv.modified ?? inv.creation ?? "")),
        type: "error",
      });
    }
  }

  return {
    revenueMTD,
    revenueChange,
    outstandingCount,
    openDealsCount,
    employeeCount,
    employeeDelta,
    revenueData,
    activity: activityItems.length > 0 ? activityItems.slice(0, 5) : DEMO_DATA.activity,
  };
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const headers = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });

  try {
    // Session validation
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE.SESSION_NAME)?.value;
    if (!token) {
      return NextResponse.json(apiError("UNAUTHORIZED", "Not authenticated", undefined, meta()), { status: 401, headers: headers() });
    }
    const session = await validateSession(token, request);
    if (!session.ok) {
      return NextResponse.json(apiError("UNAUTHORIZED", session.error, undefined, meta()), { status: 401, headers: headers() });
    }

    const rateLimit = await checkTieredRateLimit(getClientIdentifier(request), "authenticated", "/api/erp/dashboard");
    if (!rateLimit.allowed) {
      return NextResponse.json(apiError("RATE_LIMIT", "Too many requests", undefined, meta()), { status: 429, headers: { ...headers(), ...rateLimitHeaders(rateLimit) } });
    }

    const { accountId, erpnextSid, userId } = session.data;

    // Fetch account's ERPNext company for multi-tenant scoping
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { erpnextCompany: true },
    });

    const payload = await buildDashboardData(
      erpnextSid ?? userId,
      accountId,
      account?.erpnextCompany ?? null
    );

    return NextResponse.json(apiSuccess(payload, meta()), { headers: headers() });
  } catch (err) {
    Sentry.captureException(err);
    // Never let the dashboard error — return demo data on unexpected failure
    const requestIdFallback = getRequestId(request);
    return NextResponse.json(
      apiSuccess(DEMO_DATA, apiMeta({ request_id: requestIdFallback })),
      { headers: headers() }
    );
  }
}
