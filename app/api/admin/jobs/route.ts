/**
 * GET /api/admin/jobs — queue stats from BullMQ for all queues.
 * Admin only. Returns waiting, active, completed, failed counts + oldest job age.
 */
import { NextResponse } from "next/server";
import { withPermission } from "@/lib/api/middleware";
import { emailQueue, erpSyncQueue, reportsQueue, cleanupQueue } from "@/lib/jobs/queue";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { securityHeaders } from "@/lib/security-headers";
import { cacheControl } from "@/lib/api/cache-headers";
import * as Sentry from "@sentry/nextjs";

const QUEUES = [
  { name: "email", queue: emailQueue },
  { name: "erp-sync", queue: erpSyncQueue },
  { name: "reports", queue: reportsQueue },
  { name: "cleanup", queue: cleanupQueue },
];

export async function GET(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const hdrs = () => ({
    ...securityHeaders(),
    "X-Response-Time": `${Date.now() - start}ms`,
    "Cache-Control": cacheControl.private(),
  });

  try {
    const permCheck = await withPermission(request, "admin:*");
    if (!permCheck.ok) return permCheck.response;

    const stats = await Promise.all(
      QUEUES.map(async ({ name, queue }) => {
        const [waitingCount, activeCount, completedCount, failedCount, failedJobs] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getFailed(0, 49), // last 50 failed jobs
        ]);

        // Oldest waiting job
        const waiting = await queue.getWaiting(0, 0);
        const oldestWaitingMs = waiting[0]?.timestamp
          ? Date.now() - (waiting[0].timestamp as number)
          : null;

        return {
          queue: name,
          waiting: waitingCount,
          active: activeCount,
          completed: completedCount,
          failed: failedCount,
          oldestWaitingMs,
          failedJobs: failedJobs.slice(0, 10).map((job) => ({
            id: job.id,
            name: job.name,
            data: job.data,
            failedReason: job.failedReason,
            attemptsMade: job.attemptsMade,
            timestamp: job.timestamp,
          })),
        };
      })
    );

    return NextResponse.json(apiSuccess({ queues: stats }, meta()), { headers: hdrs() });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(apiError("SERVER_ERROR", "An unexpected error occurred", undefined, meta()), { status: 500, headers: hdrs() });
  }
}
