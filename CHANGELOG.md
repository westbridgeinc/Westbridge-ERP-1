# Changelog

All notable changes to Westbridge are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]
- Migrate invoices/expenses pages to React Query (`useErpList`)
- Wire up BullMQ Dashboard behind `/admin/queues`
- LRU eviction for L1 cache (replace plain `Map`)
- Flag invalidation via SSE on flag toggle (TD-04)

---

## [0.9.0] — 2026-02-14
### Added
- Real-time SSE stream (`/api/events/stream`) — accounts get live invoice/notification pushes
- In-app notification service (Redis-backed, 30-day TTL per account)
- `useRealtimeEvents` hook for dashboard components
- Server-Sent Events reconnection with exponential backoff on client

### Changed
- `/api/health` now returns `degraded` status when non-critical checks fail, instead of `unhealthy`
- Improved `pino` log redaction — `authorization` header and nested `*.password` paths now redacted

### Fixed
- Session fingerprint collision on shared-NAT offices (use first 3 IP octets, not full IP)
- `validateSession` hot-path debounce was updating `lastActiveAt` on every request — now 60s minimum

---

## [0.8.0] — 2026-01-20
### Added
- OpenTelemetry tracing (`@opentelemetry/sdk-node`) with auto-instrumentation for HTTP, Prisma, Redis
- Prometheus metrics endpoint at `/api/metrics` (protected by `METRICS_TOKEN`)
- `/api/health/ready` and `/api/health/live` for Kubernetes probes
- SLO definitions and error budget tracking (`lib/slo.ts`)
- Feature flags system — Redis-backed, deterministic percentage rollouts, admin API at `/api/admin/flags`
- A/B experimentation infrastructure with Chi-squared significance (`lib/experiments.ts`)

### Changed
- `pino` replaces custom console wrapper — structured JSON in prod, pretty-print in dev
- Prometheus `westbridge_http_request_duration_ms` now uses buckets optimised for our p99 distribution

### Fixed
- `lib/ratelimit.ts` pipeline race: INCR and PEXPIRE now in a single Redis pipeline (was two separate calls)

---

## [0.7.2] — 2026-01-08
### Security
- HTML injection in email templates — added `esc()` escaping to all user-supplied values
- CSRF validation added to `/api/invite/accept`, `/api/auth/reset-password`, `/api/auth/forgot-password`
- Rate limiting on `GET /api/invite` token-validation endpoint (20 req/min)
- API key generation now uses `crypto.getRandomValues()` — replaced `Math.random()` which is not cryptographically secure

### Fixed
- ERPNext password-update calls now send `Authorization: token key:secret` header
- Added `ERPNEXT_API_KEY` and `ERPNEXT_API_SECRET` to `.env.example`

---

## [0.7.1] — 2025-12-19
### Security
- Delete `lib/twocheckout.ts` and `lib/twocheckout.test.ts` (deprecated, plaintext credential leak)
- Middleware replaced with proper session validation via `/api/auth/validate`
- Auto-user-creation gated to first user only — all subsequent users must be invited

---

## [0.7.0] — 2025-12-10
### Added
- Password reset flow: forgot-password page, reset-password page, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- Invite flow: invite page, `POST /api/invite`, `GET /api/invite`, `POST /api/invite/accept`
- Transactional email via Resend — invite, password-reset, account-activated templates
- Multi-tenancy enforcement: all ERPNext queries scoped by `erpnextCompany` on the account

### Changed
- `prisma db push` replaced with `prisma migrate deploy` everywhere (Docker entrypoint, CI, setup script)
- `ENCRYPTION_KEY` now requires a 64-char hex string; removed `scryptSync` derivation

### Fixed
- `lib/twocheckout.client.ts` IPN signature comparison now uses `timingSafeEqual` — timing oracle closed
- Session `erpnextSid` encrypted at rest (AES-256-GCM)

---

## [0.6.1] — 2025-11-27
### Fixed
- `tsconfig.json` — added `"types": ["node"]` to resolve babel__core ambient type pollution (blocked clean CI)
- `docker-compose.yml` ports now bound to `127.0.0.1` to prevent accidental external exposure

---

## [0.6.0] — 2025-11-14
### Added
- `CSRF_SECRET`-based double-submit CSRF protection on all state-mutating endpoints
- `lib/security-headers.ts` — nonce-based strict CSP, HSTS, Referrer-Policy, Permissions-Policy
- Billing service: `createAccount` now uses Prisma `$transaction` to prevent race conditions
- Account-activated email when IPN marks account paid

### Changed
- `DEFAULT_CURRENCY` set to `"USD"` throughout — all GYD references removed
- API rewrites proxy in `next.config.ts` removed (was forwarding unauthenticated requests to ERPNext)

---

## [0.5.0] — 2025-10-30
### Added
- `shadcn/ui` Neutral theme applied throughout dashboard
- Settings page rebuilt: Profile, Notifications, Billing, Security, Appearance, Team tabs
- `DataTable` component with client-side sort, pagination, and empty states
- `PageHeader`, `EmptyState`, `SkeletonTable` reusable components
- Dark/light theme toggle

### Changed
- Inline `style={{ color: "var(--color-*)" }}` props converted to Tailwind classes
- Raw `<input>`, `<button>`, `<table>` tags replaced with shadcn equivalents

---

## [0.4.0] — 2025-10-03
### Added
- Invoices page with status filters, search, and DataTable
- Expenses page with category badges and running totals
- Analytics page with summary cards (placeholder charts)
- ERP list/doc API routes with `ALLOWED_DOCTYPES` allowlist and `order_by` sanitisation

### Changed
- Dashboard home page — metric cards, Recent Activity, Quick Actions sections

---

## [0.3.0] — 2025-09-12
### Added
- Signup flow with plan selection and password policy validation
- Login page with "forgot password?" link
- Session management — 7-day expiry, 30-min idle timeout, max 5 concurrent sessions
- `lib/password-policy.ts` — zxcvbn-style strength scoring

---

## [0.2.0] — 2025-08-21
### Added
- Initial ERPNext integration — `lib/data/erpnext.client.ts`, `lib/services/erp.service.ts`
- Marketing site: homepage, pricing page (USD plans), modules page
- 2Checkout IPN webhook handler
- Docker Compose setup for local development

---

## [0.1.0] — 2025-07-28
### Added
- Project scaffold: Next.js 15 App Router, Prisma + PostgreSQL, Tailwind CSS
- Basic auth: login endpoint, session cookie, middleware
- `.env.example` and `docker-compose.yml`
- CI skeleton (GitHub Actions)
