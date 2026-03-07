# Access Control Policy

This document describes logical access controls implemented for SOC 2 CC6.1.

## Role-Based Access Control (RBAC)

- **Roles**: `owner`, `admin`, `member`. Hierarchy: owner > admin > member.
- **Implementation**: `lib/auth.ts` — `requireRole()`, `requireOwnerOrAdmin()`, `requireOwner()`.
- **Usage**: ERP doc create and list routes enforce roles; audit log access is owner-only (`app/api/audit/route.ts`).

## Session Management

- **Expiry**: Sessions expire after 7 days (`lib/services/session.service.ts` — `SESSION_EXPIRY_DAYS`).
- **Idle timeout**: 30 minutes without activity; session is invalidated (`validateSession()` checks `lastActiveAt`).
- **Concurrent sessions**: Maximum 5 active sessions per user; oldest is revoked when creating a new one (`createSession()`).
- **Session binding**: User-Agent fingerprint is stored and validated on each request to detect session hijack (`session.service.ts`).

## Account Lockout

- **Threshold**: 5 failed login attempts.
- **Lockout duration**: 15 minutes (`lockedUntil` on User model).
- **Implementation**: `app/api/auth/login/route.ts` — checks `lockedUntil`, increments `failedLoginAttempts`, resets on success.

## Password Requirements

- **Policy**: Minimum 10 characters, maximum 128; must include uppercase, lowercase, number, and special character.
- **Implementation**: `lib/password-policy.ts` — `validatePassword()`. Actual authentication is delegated to ERPNext; this provides client-side pre-check where password is set (e.g. change-password flows).

## References

- `prisma/schema.prisma` — User (`failedLoginAttempts`, `lockedUntil`), Session (`lastActiveAt`, `fingerprint`).
- `lib/auth.ts`, `lib/services/session.service.ts`, `app/api/auth/login/route.ts`, `app/api/audit/route.ts`.
