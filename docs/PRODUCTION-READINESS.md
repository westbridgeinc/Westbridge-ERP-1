# Production readiness — Frontend

**Short answer:** The frontend is **production-capable** for launch. Architecture, security baseline, and UX are in place.

---

## In place

| Area | Status |
|------|--------|
| **Architecture** | Pure Next.js 16 frontend with typed API client (`lib/api/client.ts`). All data flows through the backend API at `NEXT_PUBLIC_API_URL`. |
| **Data fetching** | React Query for client-side, Server Components with cookie forwarding for SSR. Consistent error handling across both. |
| **Security** | CSP headers (strict in production, relaxed in dev). HSTS, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Session cookie with `Secure` flag in production. |
| **Validation** | Zod schemas for form inputs. Client-side validation before API calls. |
| **Errors** | Root and dashboard error boundaries. Global error fallback. Sentry integration (client/server/edge). |
| **Dashboard UX** | Breadcrumbs on all pages. PageHeader, MetricCard, StatusBadge, DataTable. Command palette (cmdk). |
| **Tests** | Vitest unit tests (85 tests, 20 test files). Playwright E2E (7 spec files). Coverage thresholds: 60% statements, 50% branches, 58% functions, 62% lines. |
| **Storybook** | 10 component stories with accessibility addon (`@storybook/addon-a11y`). |
| **Sentry** | `@sentry/nextjs` with client/server/edge configs. `instrumentation.ts` + `onRequestError`. |
| **Data scoping** | All requests include session cookie. Backend handles multi-tenant scoping via `X-Westbridge-Account-Id`. |
| **Types** | No `any` in application code. Strict TypeScript. |
| **i18n** | English, Spanish, French via `next-intl`. |
| **Dark mode** | `next-themes` integration. |
| **Analytics** | PostHog (privacy-respecting, honors Do Not Track). |
| **CI** | GitHub Actions — lint, typecheck, unit tests, build, CodeQL SAST, TruffleHog, npm audit. |

---

## Depends on backend

The following are handled by [Westbridge-ERP-2](https://github.com/westbridgeinc/Westbridge-ERP-2):

- Authentication and session management
- CSRF token generation and validation
- RBAC and permission enforcement
- Rate limiting
- Database (PostgreSQL via Prisma)
- ERPNext integration
- Encryption, audit logging, billing
- Background jobs (email, cleanup, webhooks)

---

## Optional next steps

1. **Sentry source maps** — Set `SENTRY_AUTH_TOKEN` and `SENTRY_ORG`/`SENTRY_PROJECT` in CI.
2. **Expand E2E coverage** — Add Playwright specs for invoice CRUD, CRM pipeline, settings.
3. **Performance budgets** — Add Lighthouse CI or web-vitals thresholds.

---

## Verdict

- **Ship as MVP:** Yes, with the backend running.
- **Production quality:** Architecture, security headers, error tracking, testing, and CI are in place.
