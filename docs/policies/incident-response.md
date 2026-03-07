# Security Incident Response Policy

This document describes incident detection and response for SOC 2 CC7.2, CC7.3.

## Detected Event Types

- **brute_force**: Account locked after 5 failed login attempts. Logged from `app/api/auth/login/route.ts`.
- **session_hijack**: Session fingerprint (User-Agent) mismatch. Logged from `lib/services/session.service.ts` in `validateSession()`.
- **csrf_attack**: CSRF token validation failed on a state-changing request. Logged from `app/api/erp/doc/route.ts`.
- **unauthorized_access**: RBAC rejection (e.g. member attempting admin action). Logged from `app/api/erp/doc/route.ts` and `app/api/erp/list/route.ts`.

## Reporting

- **Structured logs**: Each event is logged via `lib/logger` with type, userId, accountId, ipAddress, details, timestamp.
- **Sentry**: `lib/security-monitor.ts` — `reportSecurityEvent()` sends a message to Sentry with level `error` and tags/extra for correlation.
- **Escalation**: Sentry alerts notify the team; investigation follows using audit logs and context in Sentry.

## Implementation

- **Module**: `lib/security-monitor.ts` — `reportSecurityEvent(event)`.
- **Integration**: Login (lockout), session validation (fingerprint), CSRF failure, RBAC failure routes call `reportSecurityEvent()` in addition to audit logging.
