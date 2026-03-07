# ADR-003: Session-based auth over JWT

## Status: Accepted
## Date: 2025-01-01

## Context
We needed an authentication strategy. Options: JWT (stateless), database sessions (stateful), hybrid (JWT + session table).

## Decision
Use database-backed sessions stored in PostgreSQL via Prisma. Session tokens are SHA-256 hashed before storage. ERPNext SIDs are AES-256-GCM encrypted at rest.

## Consequences
- **Positive**: Immediate session revocation on logout or security incident — no JWT expiry lag.
- **Positive**: Session binding to IP subnet + User-Agent fingerprint prevents session hijacking.
- **Positive**: Audit trail shows exact session activity.
- **Negative**: Every authenticated request requires a DB read (mitigated by `lastActiveAt` debounce and caching).
- **Negative**: Does not scale to stateless serverless edge functions — acceptable for our workload.
