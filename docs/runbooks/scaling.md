# Scaling Runbook

## When to Scale

| Signal | Threshold | Action |
|--------|-----------|--------|
| CPU usage | > 80% for 10+ minutes | Add replicas (see below) |
| Memory | > 85% of allocated | Increase container memory or add replicas |
| p99 latency | > 2 seconds | Profile hot paths, then scale if infra-bound |
| Redis memory | > 75% | Increase Redis instance size or enable eviction |
| DB connections | > 80% of `max_connections` | Add read replica or increase pool size |

## Scaling the Next.js Application

### Railway
```bash
# Via CLI
railway scale --replicas 3

# Or via dashboard: Settings → Deploy → Replicas
```

Horizontal scaling is stateless — sessions are Redis-backed, so any replica can
serve any request. No sticky sessions needed.

**Before scaling:** confirm the bottleneck is CPU/memory and not a single slow DB query.
Use `/api/metrics` (Prometheus) to check `http_request_duration_seconds_p99`.

### Environment-level rate limits
When adding replicas, the rate limiter already handles multi-instance correctly
because it uses Redis as the shared counter. No configuration changes needed.

## Scaling Redis

Redis is the shared state layer (sessions, cache, rate limits, pub/sub).
Scale before memory hits 75%.

### Railway Redis
```bash
# Upgrade instance tier in Railway dashboard → Redis → Settings → Plan
# No downtime — Railway handles the upgrade
```

### Self-hosted
```bash
# Increase maxmemory in redis.conf
# Restart with: systemctl restart redis
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## Adding a PostgreSQL Read Replica

Use a read replica for `GET /api/audit` and analytics queries to offload the primary.

1. In Railway: Databases → PostgreSQL → Add Read Replica
2. Set `DATABASE_REPLICA_URL` environment variable
3. Update Prisma client to use replica for read-only queries:
   ```typescript
   // In lib/data/prisma.ts — use replica for read-only models
   const replicaClient = new PrismaClient({
     datasources: { db: { url: process.env.DATABASE_REPLICA_URL } },
   });
   ```

## Database Connection Pool

Default Prisma connection pool is `min=2, max=10`.

For high-concurrency scenarios:
```
DATABASE_URL="postgresql://...?connection_limit=20&pool_timeout=30"
```

Don't exceed 80% of PostgreSQL's `max_connections` (`SHOW max_connections;`).

## Recognising False Alarms

- High CPU spike lasting < 2 minutes: likely a cron job or cold start. Wait and observe.
- Memory spike then drop: likely garbage collection. Only act on sustained elevation.
- Latency spike on a single endpoint: check for a slow query, not an infra problem.

## After Scaling

1. Verify `/api/health` returns healthy on all replicas
2. Watch p99 latency in Grafana for 15 minutes
3. Update the capacity planning doc if baseline requirements changed
