# Rollback Runbook

## When to Rollback

- Error rate increases >5% after deploy
- Health checks fail within 5 minutes of deploy
- Critical business flow broken (login, invoicing, billing)

## Rollback Steps

### Docker (Self-hosted)

```bash
# 1. Identify last good image tag
docker images westbridge --format "table {{.Tag}}\t{{.CreatedAt}}" | head -5

# 2. Roll back
docker-compose stop app
docker tag westbridge:<previous_sha> westbridge:latest
docker-compose up -d app

# 3. Verify
curl https://app.westbridge.app/api/health/ready
```

### Vercel

```bash
# 1. Open Vercel dashboard → Deployments
# 2. Find last successful deployment
# 3. Click "..." → "Promote to Production"
```

### Database Migration Rollback

Migrations are forward-only. To "rollback":

1. Write a new migration that reverses the change
2. Test in staging first
3. Deploy the new migration

**Never** use `prisma migrate reset` in production — it drops all data.

## Post-Rollback

1. Confirm error rate returns to baseline
2. Open an incident ticket for root cause analysis
3. Write a regression test before re-deploying the reverted code
