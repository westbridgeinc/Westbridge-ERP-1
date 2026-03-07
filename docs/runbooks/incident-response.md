# Incident Response Runbook

## Severity Levels

| Severity | Description | Response Time | Escalation |
|----------|-------------|---------------|------------|
| P0 — Critical | Production down, data loss, security breach | Immediate | On-call + CTO |
| P1 — High | Major feature broken, >20% error rate | < 30 min | On-call engineer |
| P2 — Medium | Degraded performance, partial outage | < 2 hours | Team lead |
| P3 — Low | Minor bug, cosmetic issue | Next sprint | Ticket |

## Detection

1. **Automated**: Uptime monitors, Sentry alerts, `GET /api/health` failure
2. **User-reported**: Support ticket → triage within 15 minutes
3. **Internal**: Engineer discovers → immediately declare incident

## Response Steps

### 1. Declare the Incident
```bash
# Create incident channel in Slack: #incident-YYYY-MM-DD-[description]
# Announce: "Incident declared. Severity: P{N}. On-call: @engineer"
```

### 2. Assess Impact
```bash
# Check health endpoints
curl https://app.westbridge.app/api/health | jq .
curl https://app.westbridge.app/api/health/ready | jq .

# Check error rate in Sentry
# Check metrics dashboard: /api/metrics
```

### 3. Mitigate
- **Database down**: Check `docker-compose.yml` postgres service, check connection strings
- **Redis down**: App degrades gracefully (rate limiting fails closed)
- **ERPNext down**: Dashboard shows degraded state, retry after ERPNext recovers
- **High error rate**: Check Sentry for root cause, consider rollback (see rollback.md)

### 4. Communicate
- Every 30 minutes: status update in incident channel
- Customer-facing: update status page

### 5. Resolve & Postmortem
- Confirm health checks green
- Document root cause + fix in postmortem within 48 hours
- Add regression test to prevent recurrence
