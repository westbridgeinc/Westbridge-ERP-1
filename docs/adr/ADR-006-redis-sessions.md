# ADR-006: Redis for sessions and rate limiting

## Status: Accepted
## Date: 2025-01-01

## Context
Rate limiting and feature flag state need a shared, low-latency store that works across multiple Next.js instances.

## Decision
Use Redis (via ioredis) for: rate limiting (sorted sets), feature flags (JSON strings), caching (strings with TTL), real-time pub/sub (notifications), BullMQ job queues.

## Consequences
- **Positive**: Sub-millisecond read/write for hot paths (rate limit checks, flag evaluations).
- **Positive**: Redis Pub/Sub enables real-time SSE across multiple server instances.
- **Negative**: Redis is a required dependency in production — see `docker-compose.yml`.
- **Resilience**: Rate limiter and feature flags fail-closed when Redis is unavailable. Caching fails-open (returns null = DB fallback).
