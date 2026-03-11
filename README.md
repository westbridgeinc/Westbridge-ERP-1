# Westbridge — Frontend

Next.js frontend for the Westbridge ERP platform. This is a pure client application that communicates with the [Westbridge Backend API](https://github.com/westbridgeinc/Westbridge-ERP-2) for all data and authentication.

Invoicing, inventory, HR, payroll, CRM, and AI-powered insights — designed for small-to-medium businesses.

## Architecture

```
app/(dashboard)/   → Dashboard pages (invoices, CRM, HR, inventory, etc.)
app/(auth)/        → Auth pages (login, signup, forgot-password, invite)
app/(marketing)/   → Marketing pages (home, pricing, modules, about)
components/        → UI components (dashboard, marketing, shared)
lib/api/           → Typed API client (talks to backend at NEXT_PUBLIC_API_URL)
lib/queries/       → React Query hooks for data fetching
lib/               → Utilities, constants, i18n, analytics
```

**Tech stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Radix UI, React Query, Recharts, Sentry, PostHog.

| Directory | Purpose |
|-----------|---------|
| `app/` | Pages and layouts (App Router with route groups) |
| `components/` | UI components (dashboard, marketing, shared) |
| `lib/api/` | Typed API client and server-side data fetching |
| `lib/queries/` | React Query hooks |
| `types/` | Shared types and Zod schemas |
| `e2e/` | Playwright end-to-end tests |
| `stories/` | Storybook component stories |
| `docs/` | Architecture decision records, runbooks, policies |

## Prerequisites

- **Node.js** 20+
- **Westbridge Backend API** running at `NEXT_PUBLIC_API_URL` (default: `http://localhost:4000`) — see [Westbridge-ERP-2](https://github.com/westbridgeinc/Westbridge-ERP-2)

## Getting started

```bash
npm install
cp .env.example .env              # set NEXT_PUBLIC_API_URL to your backend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test                           # unit tests (Vitest)
npm run test:coverage              # with coverage report
npm run test:e2e                   # E2E tests (Playwright, requires running app + backend)
npm run storybook                  # component stories
```

## Deploy

```bash
npm run build                      # production build
npm start                          # start server
```

See `SETUP.md` for detailed setup, `docs/PRODUCTION-READINESS.md` for production checklist, and `CONTRIBUTING.md` for development conventions.

## License

[MIT](LICENSE)
