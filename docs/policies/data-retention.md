# Data Retention Policy

This document describes data retention for SOC 2 CC6.5, P4.1.

## Retention Periods

| Data | Retention | Reference |
|------|-----------|-----------|
| Audit logs | 365 days | `lib/data-retention.ts` — `AUDIT_LOGS_DAYS` |
| Expired sessions | Deleted 30 days after expiry | `SESSIONS_EXPIRED_DAYS` |
| Soft-deleted records | Permanently removed after 90 days | `SOFT_DELETED_DAYS` (config only) |

## Cleanup Procedures

- **Master script**: `scripts/data-retention.ts` — deletes audit logs older than 365 days and expired/idle sessions older than 30 days. **Run daily via cron** (e.g. `0 2 * * * npx tsx scripts/data-retention.ts`).
- **Audit-only**: `scripts/cleanup-audit-logs.ts` — `npm run audit:cleanup`.
- **Sessions-only**: `scripts/cleanup-sessions.ts` — `npm run sessions:cleanup`.

All scripts log counts of deleted records.

## Implementation

- **Config**: `lib/data-retention.ts` — `DATA_RETENTION` constants.
- **Scripts**: `scripts/data-retention.ts`, `scripts/cleanup-audit-logs.ts`, `scripts/cleanup-sessions.ts`.
