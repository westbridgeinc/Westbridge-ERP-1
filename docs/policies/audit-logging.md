# Audit Logging Policy

This document describes audit logging for SOC 2 CC7.1, CC7.2.

## Events Logged

All security-relevant events are written to the `AuditLog` table with action, severity, outcome, and request context (IP, User-Agent).

**Auth**: `auth.login.success`, `auth.login.failure`, `auth.login.rate_limited`, `auth.login.account_locked`, `auth.login.account_lockout`, `auth.logout`, `auth.session.invalid`, `auth.session.expired`, `auth.session.idle_timeout`, `auth.session.revoked_oldest`.

**Account**: `account.created`, `account.signup.failure`, `account.signup.rate_limited`.

**ERP**: `erp.doc.read`, `erp.doc.create`, `erp.doc.create.forbidden`, `erp.doc.create.csrf_failed`, `erp.list.read`, `erp.list.forbidden`.

**Payment**: `payment.webhook.success`, `payment.webhook.invalid_signature`, `payment.webhook.rate_limited`.

**Audit**: `audit.log.accessed` (when audit logs are viewed).

## Retention

- **Period**: 365 days minimum (SOC 2).
- **Cleanup**: `scripts/cleanup-audit-logs.ts` or `scripts/data-retention.ts`; run daily via cron.

## Access

- **Who**: Account owners only. Enforced by `requireOwner()` in `app/api/audit/route.ts`.
- **Endpoint**: GET `/api/audit` with pagination and filters (action, severity, from, to).

## Implementation

- **Schema**: `prisma/schema.prisma` — AuditLog (timestamp, accountId, userId, action, resource, resourceId, ipAddress, userAgent, severity, outcome).
- **Service**: `lib/services/audit.service.ts` — `logAudit()`, `auditContext(request)`.
