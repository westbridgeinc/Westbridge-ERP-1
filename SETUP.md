# Westbridge Frontend — Local setup

This is the **frontend** application. It requires the [Westbridge Backend API](https://github.com/westbridgeinc/Westbridge-ERP-2) to be running for authentication, data, and ERP functionality.

## Prerequisites

- **Node.js** 20+
- **Westbridge Backend API** running (see [Westbridge-ERP-2](https://github.com/westbridgeinc/Westbridge-ERP-2) for setup)
- **Git**

## Quick setup

```bash
npm install
cp .env.example .env    # set NEXT_PUBLIC_API_URL (default: http://localhost:4000)
npm run dev
```

Open **http://localhost:3000**.

---

## Environment variables

| Variable                  | Default                 | Description                       |
| ------------------------- | ----------------------- | --------------------------------- |
| `NEXT_PUBLIC_API_URL`     | `http://localhost:4000` | Backend API base URL              |
| `NEXT_PUBLIC_APP_URL`     | `http://localhost:3000` | This app's public URL             |
| `NEXT_PUBLIC_SENTRY_DSN`  | —                       | Sentry DSN for error tracking     |
| `NEXT_PUBLIC_POSTHOG_KEY` | —                       | PostHog project API key           |
| `SENTRY_ORG`              | —                       | Sentry org slug (for source maps) |
| `SENTRY_PROJECT`          | —                       | Sentry project slug               |
| `SENTRY_AUTH_TOKEN`       | —                       | Sentry auth token (CI only)       |

## Full stack (frontend + backend + ERPNext)

To run the entire Westbridge platform locally:

1. **Start the backend** — Follow setup in [Westbridge-ERP-2](https://github.com/westbridgeinc/Westbridge-ERP-2). This starts the API server, PostgreSQL, Redis, and ERPNext.

2. **Start this frontend:**

   ```bash
   npm install
   cp .env.example .env
   npm run dev
   ```

3. Open **http://localhost:3000** — Sign up, log in, and use all ERP modules.

---

## Testing

```bash
npm test                # unit tests (Vitest)
npm run test:coverage   # with coverage report
npm run test:e2e        # E2E tests (Playwright — requires running app + backend)
npm run storybook       # component stories at http://localhost:6006
```

---

## Production deployment

```bash
npm run build           # production build
npm start               # start Next.js server
```

- Set `NEXT_PUBLIC_API_URL` to your production backend URL.
- Set `NEXT_PUBLIC_SENTRY_DSN` for error tracking.
- Serve over HTTPS — the app sets `Secure` on cookies when `NODE_ENV=production`.

---

## PowerTranz (payments)

Payment processing is handled by the **backend API** via PowerTranz (Caribbean-focused payment gateway). See [Westbridge-ERP-2](https://github.com/westbridge-inc/Westbridge-ERP-2) and `docs/POWERTRANZ-SETUP.md` for configuration.

---

## Troubleshooting

| Issue                              | What to do                                                 |
| ---------------------------------- | ---------------------------------------------------------- |
| "Failed to fetch" / network errors | Ensure the backend API is running at `NEXT_PUBLIC_API_URL` |
| "Session expired" / 401            | Log in again at /login                                     |
| ERPNext data not loading           | Check the backend's ERPNext connection — see ERP-2 setup   |
| Build errors                       | Run `npm run typecheck` and `npm run lint` to diagnose     |
