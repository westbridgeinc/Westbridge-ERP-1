# ADR-004: Result<T, E> pattern over thrown exceptions

## Status: Accepted
## Date: 2025-01-01

## Context
Service functions can fail in expected ways (invalid input, not found, ERP unreachable). Two options: throw errors and catch at the call site, or return typed Result types.

## Decision
All service functions return `Result<T, string>` (from `lib/utils/result.ts`). Unexpected errors are still caught with a top-level try/catch in API routes and reported to Sentry.

## Consequences
- **Positive**: Callers are forced to handle failure cases at the type level — no unhandled rejection surprises.
- **Positive**: Consistent error propagation pattern throughout `lib/services/`.
- **Negative**: More verbose than `try/catch` for simple cases.
- **Trade-off**: Unexpected errors (DB down, OOM) still propagate as exceptions — caught by API route wrappers.
