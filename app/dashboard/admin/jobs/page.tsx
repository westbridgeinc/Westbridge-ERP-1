"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, Play, AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FailedJob {
  id: string;
  name: string;
  data: Record<string, unknown>;
  failedReason: string;
  attemptsMade: number;
  timestamp: number;
}

interface QueueStats {
  queue: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  oldestWaitingMs: number | null;
  failedJobs: FailedJob[];
}

function msToAge(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${Math.round(ms / 3_600_000)}h`;
}

export default function AdminJobsPage() {
  const [queues, setQueues] = useState<QueueStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [expandedQueue, setExpandedQueue] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/jobs`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 403) {
          toast.error("Admin access required to view job queues.");
          return;
        }
        throw new Error("Failed to load queue stats");
      }
      const data = (await res.json()) as { data: { queues: QueueStats[] } };
      setQueues(data.data.queues);
    } catch {
      toast.error("Could not load queue stats. Are the workers running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
    const interval = setInterval(() => void fetchStats(), 15_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  async function retryJob(jobId: string, queueName: string) {
    setRetrying(jobId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/jobs/${jobId}/retry?queue=${queueName}`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Retry failed");
      toast.success(`Job ${jobId} queued for retry`);
      await fetchStats();
    } catch {
      toast.error("Failed to retry job");
    } finally {
      setRetrying(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-display">Job Queues</h1>
          <p className="text-sm text-muted-foreground mt-1">
            BullMQ queue status. Auto-refreshes every 15 seconds.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetchStats()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {queues.map((q) => (
          <Card
            key={q.queue}
            className={`cursor-pointer transition-colors ${expandedQueue === q.queue ? "ring-2 ring-primary" : "hover:bg-muted/30"}`}
            onClick={() => setExpandedQueue(expandedQueue === q.queue ? null : q.queue)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium capitalize">{q.queue}</CardTitle>
              <CardDescription className="text-xs">
                Oldest: {msToAge(q.oldestWaitingMs)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-muted-foreground">Waiting</span>
                  <span className="ml-auto font-mono font-medium">{q.waiting}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />
                  <span className="text-muted-foreground">Active</span>
                  <span className="ml-auto font-mono font-medium">{q.active}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-success" />
                  <span className="text-muted-foreground">Done</span>
                  <span className="ml-auto font-mono font-medium">{q.completed}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-muted-foreground">Failed</span>
                  <Badge
                    variant={q.failed > 0 ? "destructive" : "secondary"}
                    className="ml-auto text-xs px-1.5 py-0"
                  >
                    {q.failed}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {expandedQueue && (() => {
        const q = queues.find((x) => x.queue === expandedQueue);
        if (!q || q.failedJobs.length === 0) {
          return (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                No failed jobs in <span className="font-medium">{expandedQueue}</span>
              </CardContent>
            </Card>
          );
        }
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Failed jobs — <span className="capitalize">{expandedQueue}</span>
              </CardTitle>
              <CardDescription>Showing last {q.failedJobs.length} failures</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Job ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead className="text-center">Attempts</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {q.failedJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[8rem]">
                        {job.id}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{job.name}</TableCell>
                      <TableCell className="text-sm text-destructive max-w-xs truncate" title={job.failedReason}>
                        {job.failedReason}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">{job.attemptsMade}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(job.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void retryJob(job.id, expandedQueue)}
                          disabled={retrying === job.id}
                        >
                          {retrying === job.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Play className="h-3.5 w-3.5 mr-1" />
                          )}
                          Retry
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
