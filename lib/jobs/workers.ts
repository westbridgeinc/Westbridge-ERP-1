/**
 * BullMQ workers — consume jobs from each queue.
 * Run this file in a separate Node.js process alongside the Next.js app:
 *   node -r tsconfig-paths/register lib/jobs/workers.ts
 *
 * Or use the `scripts/start-workers.sh` helper.
 */
import { Worker } from "bullmq";
import { createHash } from "crypto";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { getRedis } from "@/lib/redis";
import { prisma } from "@/lib/data/prisma";
import { publish } from "@/lib/realtime";
import { sendNotification } from "@/lib/notifications/notification.service";
import { deleteExpiredSessions } from "@/lib/services/session.service";
import type { EmailJobData, ErpSyncJobData, ReportJobData, CleanupJobData } from "@/lib/jobs/queue";

const connection = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6380),
  password: process.env.REDIS_PASSWORD,
};

// ─── Email worker ─────────────────────────────────────────────────────────────

const emailWorker = new Worker<EmailJobData>(
  "email",
  async (job) => {
    const result = await sendEmail(job.data);
    if (!result.ok) throw new Error(result.error);
    logger.info("Email sent", { to: job.data.to, subject: job.data.subject, jobId: job.id });
  },
  { connection, concurrency: 5 }
);

emailWorker.on("failed", (job, err) => {
  logger.error("Email job failed", { jobId: job?.id, error: err.message });
});

// ─── ERP sync worker ─────────────────────────────────────────────────────────

const REPORT_TYPE_TO_DOCTYPE: Record<string, string> = {
  invoices:   "Sales Invoice",
  orders:     "Sales Order",
  expenses:   "Expense Claim",
  inventory:  "Item",
  employees:  "Employee",
  payroll:    "Salary Slip",
};

const erpSyncWorker = new Worker<ErpSyncJobData>(
  "erp-sync",
  async (job) => {
    const { accountId, doctype, name, erpnextSessionId } = job.data;
    const redis = getRedis();

    logger.info("ERP sync: starting", { accountId, doctype, name, jobId: job.id });

    // Fetch the latest version of the document from ERPNext
    const { erpGet } = await import("@/lib/data/erpnext.client");
    const result = await erpGet(doctype, name, erpnextSessionId);

    if (!result.ok) {
      logger.warn("ERP sync: fetch failed", { accountId, doctype, name, error: result.error });
      throw new Error(`ERPNext fetch failed: ${result.error}`);
    }

    // Compare with cached version to avoid redundant publishes
    const cacheKey = `erp:doc:${accountId}:${doctype}:${name}`;
    const newHash = createHash("sha256").update(JSON.stringify(result.data)).digest("hex");

    if (redis) {
      const cachedHash = await redis.get(`${cacheKey}:hash`);
      if (cachedHash === newHash) {
        logger.debug("ERP sync: doc unchanged, skipping publish", { accountId, doctype, name });
        return;
      }
      // Update cache
      await redis.set(cacheKey, JSON.stringify(result.data), "EX", 300); // 5 min TTL
      await redis.set(`${cacheKey}:hash`, newHash, "EX", 300);
    }

    // Notify connected clients that this document was updated
    await publish(accountId, {
      type: "erp.doc_updated",
      payload: { doctype, name },
      timestamp: new Date().toISOString(),
    });

    logger.info("ERP sync: complete", { accountId, doctype, name });
  },
  {
    connection,
    concurrency: 3,
  }
);

erpSyncWorker.on("failed", (job, err) => {
  logger.error("ERP sync job failed", {
    jobId: job?.id,
    doctype: job?.data?.doctype,
    name: job?.data?.name,
    error: err.message,
    attemptsMade: job?.attemptsMade,
  });
});

// ─── Reports worker ───────────────────────────────────────────────────────────

const reportsWorker = new Worker<ReportJobData>(
  "reports",
  async (job) => {
    const { accountId, reportType, params, requestedBy } = job.data;
    const reportId = `${reportType}-${Date.now()}`;

    logger.info("Report generation started", { accountId, reportType, requestedBy, reportId, jobId: job.id });
    await job.updateProgress(10);

    const doctype = REPORT_TYPE_TO_DOCTYPE[reportType];
    if (!doctype) {
      throw new Error(`Unknown report type: ${reportType}`);
    }

    // Resolve the ERP session for this account (Session links to User, not Account directly)
    const session = await prisma.session.findFirst({
      where: {
        user: { accountId },
        expiresAt: { gt: new Date() },
        erpnextSid: { not: null },
      },
      select: { erpnextSid: true },
      orderBy: { lastActiveAt: "desc" },
    });

    if (!session?.erpnextSid) {
      throw new Error("No active ERP session for report generation");
    }

    const { erpList } = await import("@/lib/data/erpnext.client");
    const result = await erpList(doctype, session.erpnextSid, {
      limit_page_length: "500",
    });

    await job.updateProgress(60);

    if (!result.ok) {
      throw new Error(`ERPNext list failed: ${result.error}`);
    }

    // Basic aggregation: count by status and compute total if grand_total exists
    const rows = result.data as Array<Record<string, unknown>>;
    const counts: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      const status = String(row.status ?? "Unknown");
      counts[status] = (counts[status] ?? 0) + 1;
      if (typeof row.grand_total === "number") total += row.grand_total;
    }

    const reportData = {
      reportType,
      doctype,
      params,
      generatedAt: new Date().toISOString(),
      rowCount: rows.length,
      summary: { counts, total },
      // Intentionally not embedding raw rows — callers should fetch via /api/erp/list
    };

    await job.updateProgress(80);

    // Persist result in Redis for 24 hours
    const redis = getRedis();
    if (redis) {
      await redis.set(
        `report:${accountId}:${reportId}`,
        JSON.stringify(reportData),
        "EX",
        24 * 60 * 60
      );
    }

    // Notify the requesting user
    await sendNotification({
      accountId,
      type: "report_ready",
      title: "Your report is ready",
      body: `The ${reportType} report has finished generating. ${rows.length} records processed.`,
      severity: "info",
      metadata: { reportId, reportType },
    });

    await job.updateProgress(100);
    logger.info("Report generation complete", { accountId, reportType, reportId, rows: rows.length });
  },
  { connection }
);

reportsWorker.on("failed", (job, err) => {
  logger.error("Reports job failed", {
    jobId: job?.id,
    reportType: job?.data?.reportType,
    error: err.message,
  });
});

// ─── Cleanup worker ───────────────────────────────────────────────────────────

const cleanupWorker = new Worker<CleanupJobData>(
  "cleanup",
  async (job) => {
    if (job.data.task === "sessions") {
      await deleteExpiredSessions();
      // Also delete sessions inactive for 30 days
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { count } = await prisma.session.deleteMany({
        where: { lastActiveAt: { lt: cutoff } },
      });
      logger.info("Session cleanup complete", { deletedInactive: count });
    }

    if (job.data.task === "audit_logs") {
      // Data retention policy: delete audit logs older than 90 days
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const { count } = await prisma.auditLog.deleteMany({
        where: { timestamp: { lt: cutoff } },
      });
      logger.info("Audit log cleanup complete", { deleted: count, olderThan: cutoff.toISOString() });
    }
  },
  { connection }
);

cleanupWorker.on("failed", (job, err) => {
  logger.error("Cleanup job failed", { task: job?.data?.task, error: err.message });
});

logger.info("Job workers started", { queues: ["email", "erp-sync", "reports", "cleanup"] });

// Graceful shutdown
async function shutdown() {
  await Promise.all([
    emailWorker.close(),
    erpSyncWorker.close(),
    reportsWorker.close(),
    cleanupWorker.close(),
  ]);
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
