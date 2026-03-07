# Developer Onboarding

Welcome to the Westbridge engineering team. This guide gets you from zero to a running local environment in under 30 minutes.

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

## Day 1: Setup (< 30 minutes)

### 1. Clone and install

```bash
git clone git@github.com:westbridge/v1.git
cd v1
npm install
```

### 2. Environment

```bash
cp .env.example .env
# Fill in required values — at minimum:
#   ENCRYPTION_KEY=$(openssl rand -hex 32)
#   SESSION_SECRET=$(openssl rand -hex 32)
#   CSRF_SECRET=$(openssl rand -base64 32)
```

### 3. Start services

```bash
# One-command setup: starts Postgres, Redis, runs migrations, starts dev server
bash scripts/setup.sh
```

Or manually:
```bash
docker-compose up -d postgres redis
npx prisma migrate deploy
npm run dev
```

### 4. Verify

```bash
curl http://localhost:3000/api/health | jq .
# Expect: { "data": { "status": "healthy" } }
```

### 5. Run tests

```bash
npm run test          # unit tests
npm run test:e2e      # end-to-end (requires app running)
```

## Day 2: Architecture

Read these ADRs in order:
1. [ADR-001: Next.js](./adr/ADR-001-nextjs-fullstack.md)
2. [ADR-002: ERPNext](./adr/ADR-002-erpnext-backend.md)
3. [ADR-003: Session auth](./adr/ADR-003-session-auth.md)
4. [ADR-004: Result types](./adr/ADR-004-result-types.md)
5. [ADR-005: Prisma](./adr/ADR-005-prisma-orm.md)
6. [ADR-006: Redis](./adr/ADR-006-redis-sessions.md)

Key directories:
| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js pages and API routes |
| `lib/` | Backend services, utilities |
| `lib/services/` | Domain service layer |
| `lib/data/` | External API clients (ERPNext, 2Checkout) |
| `lib/api/` | API pipeline, versioning, OpenAPI |
| `components/` | React components |
| `packages/ui/` | Design tokens |
| `prisma/` | Schema and migrations |
| `docs/` | ADRs and runbooks |
| `load-tests/` | k6 scripts |

## Day 3: Your First PR

1. Pick a `good first issue` from the board
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your change following the patterns in existing files
4. Run `npm run lint && npx tsc --noEmit && npm test`
5. Open a PR — CI will run automatically

## Code Standards

- All service functions return `Result<T, string>` — see `lib/utils/result.ts`
- No `console.log` — use `logger.info()` / `logger.debug()` from `lib/logger.ts`
- No `any` types
- Every new API route needs: auth, rate limiting, CSRF (for mutations), input validation (Zod), Sentry try/catch
- Cache keys must include `accountId` (use `cacheKey()` from `lib/cache.ts`)
