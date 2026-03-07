# System Availability Policy

This document describes availability and monitoring for SOC 2 CC7.1, A1.2.

## Health Check

- **Endpoint**: GET `/api/health`. Returns JSON with `data.status`, `data.uptime_seconds`, `data.version`, and `data.checks` for each dependency.
- **Checks**: Each check has `status` (`ok` | `error`) and `latency_ms`.
  - **database**: Critical. If failed, response status is 503 (unhealthy).
  - **redis**: Non-critical. If failed, status is "degraded" but 200.
  - **erpnext**: Non-critical. If failed, status is "degraded" but 200.
- **Status**: `healthy` (all ok), `degraded` (non-critical failure), `unhealthy` (critical failure). HTTP 503 when status is unhealthy.

## Uptime Tracking

- **Implementation**: `lib/uptime.ts` — `getUptimeSeconds()` (time since process start). Used in health response as `uptime_seconds`.

## Monitoring

- **Errors**: Sentry captures exceptions and security events.
- **Request logging**: Structured request logging (e.g. `lib/request-logger.ts`) for audit and debugging.

## References

- `app/api/health/route.ts`, `lib/uptime.ts`, `lib/logger.ts`, Sentry configuration.
