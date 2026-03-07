# Westbridge

Next.js app for Westbridge — ERP integration and business management.

## Architecture

- **Tech stack:** Next.js 16, TypeScript, Prisma (PostgreSQL), Redis, ERPNext (headless backend).
- **Key directories:**
  - `app/` — Routes (App Router), API handlers, pages.
  - `lib/` — Business logic, services, data layer, auth, validation.
  - `components/` — UI components (dashboard, marketing, ui).
  - `types/` — Shared types and Zod schemas.
  - `e2e/` — Playwright end-to-end tests.
  - `prisma/` — Schema and migrations.

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set variables (see `.env.example`). Do not commit secrets; set `CSRF_SECRET` and production credentials via environment variables.

3. **Database and services**

   Using Docker:

   ```bash
   docker compose up -d
   npx prisma db push
   ```

   Or point `DATABASE_URL` and `ERPNEXT_URL` to your own Postgres and ERPNext.

4. **Run development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Testing

- **Unit tests:** `npm test` (Vitest).
- **E2E tests:** Start the app, then `npm run test:e2e` (Playwright). Optional: `E2E_TEST_LOGIN_EMAIL` and `E2E_TEST_LOGIN_PASSWORD` for login E2E.
- **Coverage:** `npm run test:coverage` or `npm run test -- --coverage`.

## Deploy

1. Run production readiness checks: `npm run verify:production` (requires `NODE_ENV=production` and required env vars set).
2. Build: `npm run build`.
3. Start: `npm start`.

This project uses [Next.js](https://nextjs.org). See the [Next.js documentation](https://nextjs.org/docs) for more.
