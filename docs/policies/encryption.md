# Data Encryption Policy

This document describes encryption controls for SOC 2 CC6.5, CC6.7.

## Encryption at Rest

- **PII fields**: AES-256-GCM for encrypting sensitive data when required. Key derived from `ENCRYPTION_KEY` (scrypt). Implementation: `lib/encryption.ts` — `encrypt()`, `decrypt()`. Environment: `ENCRYPTION_KEY` must be set (e.g. `openssl rand -base64 32`).

## Encryption in Transit

- **HTTPS**: Enforced in production; HSTS and security headers applied via `lib/security-headers.ts`.

## Session and Token Handling

- **Session token**: Stored as SHA-256 hash only; raw token sent to client in HTTP-only cookie. See `lib/services/session.service.ts` — `hashToken()`.
- **CSRF token**: Signed/validated using HMAC with `CSRF_SECRET`. See `lib/csrf.ts`.

## Passwords

- **Handling**: Passwords are not stored by this application; authentication is delegated to ERPNext. Password policy (length, complexity) is enforced client-side where applicable via `lib/password-policy.ts`.

## Data Classification

- **PII**: Marked in Prisma schema with `/// @pii - Personal Identifiable Information` on fields such as User.email, User.name, AuditLog.ipAddress, AuditLog.userAgent, Session.ipAddress, Session.userAgent.

## References

- `lib/encryption.ts`, `lib/csrf.ts`, `lib/security-headers.ts`, `lib/password-policy.ts`, `prisma/schema.prisma`.
