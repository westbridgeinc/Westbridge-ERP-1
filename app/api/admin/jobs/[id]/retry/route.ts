/**
 * POST /api/admin/jobs/:id/retry?queue=email
 * Retries a specific failed BullMQ job. Admin only.
 */
import { NextResponse } from "next/server";
import { withPermission } from "@/lib/api/middleware";
import { emailQueue, erpSyncQueue, reportsQueue, cleanupQueue } from "@/lib/jobs/queue";
import type { Queue } from "bullmq";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { securityHeaders } from "@/lib/security-headers";
import * as Sentry from "@sentry/nextjs";

const QUEUES: Record<string, Queue> = {
  email: emailQueue,
  "erp-sync": erpSyncQueue,
  reports: reportsQueue,
  cleanup: cleanupQueue,
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const hdrs = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });

  try {
    const permCheck = await withPermission(request, "admin:*");
    if (!permCheck.ok) return permCheck.response;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const queueName = searchParams.get("queue");

    if (!queueName || !QUEUES[queueName]) {
      return NextResponse.json(
        apiError("BAD_REQUEST", `Unknown queue. Valid: ${Object.keys(QUEUES).join(", ")}`, undefined, meta()),
        { status: 400, headers: hdrs() }
      );
    }

    const queue = QUEUES[queueName]!;
    const job = await queue.getJob(id);

    if (!job) {
      return NextResponse.json(apiError("NOT_FOUND", "Job not found", undefined, meta()), { status: 404, headers: hdrs() });
    }

    await job.retry();

    return NextResponse.json(apiSuccess({ retried: true, jobId: id }, meta()), { headers: hdrs() });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(apiError("SERVER_ERROR", "An unexpected error occurred", undefined, meta()), { status: 500, headers: hdrs() });
  }
}
