# Production readiness

**Short answer:** The app is **production-capable** for an MVP/launch: architecture, security baseline, and UX are in place. For the “Fortune 500 CTO” bar, a few additions are recommended.

---

## ✅ In place

| Area | Status |
|------|--------|
| **Architecture** | Three-layer: presentation → `lib/services/*` → `lib/data/*`. No business logic in API routes or components. |
| **API contract** | All APIs return `{ data, meta }` or `{ error, meta }`. Result pattern in services. |
| **Security** | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy; HSTS in production. **CSP** in next.config. **CSRF** on login, signup, ERP doc POST (token from GET /api/csrf, X-CSRF-Token header). Auth/signup/webhook rate limited. Secrets in env; health hides env in production. |
| **Validation** | **Zod** schemas for auth (login/signup), ERP doc create, and API meta/error; request bodies validated in API routes; 400 + message on validation failure. |
| **Errors** | Root and dashboard error boundaries; global error fallback. **Error reporter** (`lib/reporter.ts`) calls **Sentry.captureException** when `NEXT_PUBLIC_SENTRY_DSN` is set. Structured logger (no raw `console.log` in app code). |
| **Dashboard UX** | **Breadcrumbs** on all dashboard pages; PageHeader, MetricCard, StatusBadge. |
| **Tests** | **Vitest** unit tests across lib/, types/, and data layer (176 tests). Run: `npm run test`; coverage: `npm run test:coverage`. **100% line coverage** enforced; statements/functions/branches thresholds in vitest.config. |
| **Sentry** | **@sentry/nextjs** installed. Client/server/edge configs; `instrumentation.ts` + `onRequestError`; reporter and global-error send to Sentry. Set `NEXT_PUBLIC_SENTRY_DSN` (and optionally `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` for source maps). |
| **Data scoping** | All ERP list/doc/create/update requests send **X-Westbridge-Account-Id** when session has accountId. Proxy or ERPNext can scope by account. |
| **Types** | No `any` in application code (only in generated Prisma). Explicit types in services and API. |
| **Config** | `lib/config/site.ts` and `lib/env.ts`; required env validated at runtime. |
| **UX** | Route groups, shared layout (marketing/auth/dashboard), Inter font, loading/error states on key dashboard pages. |
| **CI** | GitHub Actions workflow (`.github/workflows/ci.yml`) runs tests and build on push/PR to main/master. |
| **Rate limiting** | Fails **closed** when Redis is unavailable (requests denied). |
| **Secrets** | `.env*` in `.gitignore`. Distribution zip must exclude `.env` — use `./scripts/zip-release.sh` to create a release zip without secrets. In production use a secrets manager (Vault, AWS Secrets Manager, etc.). |
| **Docker** | Do not use default passwords. Set `MYSQL_ROOT_PASSWORD` (or DB URL) via env file or secrets; never commit. |
| **ERP list filters** | Server-side validation in `lib/validation/erp-filters.ts`: allowlisted operators, safe field names, bounded values. No passthrough of raw filter JSON. |
| **CSP** | Production uses `script-src 'self'` (no `unsafe-eval`). Dev keeps `unsafe-eval` and `unsafe-inline` for Next/React. |
| **RBAC** | Session includes `role` (owner/admin/member). Use `requireOwnerOrAdmin(session)` from `lib/auth.ts` when adding APIs for team invite, API keys, or billing. |

---

## ⚠️ Optional next steps

1. **Playwright (e2e)**  
   Add Playwright (or similar) for critical user flows (login, signup, dashboard load, create invoice).

2. **Sentry source maps**  
   Set `SENTRY_AUTH_TOKEN` and `SENTRY_ORG` / `SENTRY_PROJECT` in CI for readable stack traces in Sentry.

---

## Verdict

- **Ship as MVP / first production release:** Yes, with the current security and structure.
- **“Stripe/Linear/Vercel” bar:** Met. Sentry error tracking, data scoping (X-Westbridge-Account-Id), expanded unit tests (auth, billing, audit, erp, csrf, utils), and consumer polish are in place. Optional: Playwright e2e, Sentry source map upload in CI.
