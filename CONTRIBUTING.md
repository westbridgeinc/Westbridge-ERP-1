# Contributing to Westbridge

Thanks for working on this. These are the conventions the team has settled on
over the past few months. They're not perfect — see `docs/TECH-DEBT.md` for
places where we know we're inconsistent — but new code should follow them.

---

## 1. Local setup

```bash
# One-command setup (handles deps, Docker, migrations, dev server)
./scripts/setup.sh
```

Requirements: Node ≥ 20, Docker Desktop, `tsx` globally (`npm i -g tsx`).

The script copies `.env.example` → `.env` on first run. Fill in the values marked
`GENERATE_WITH_*` before starting the server. The app will not start without them.

---

## 2. Branch naming

```
feat/<short-description>       # new feature
fix/<short-description>        # bug fix
chore/<short-description>      # dependency bumps, config changes
docs/<short-description>       # documentation only
security/<short-description>   # security patches (consider marking PR as draft until reviewed)
```

Prefer kebab-case. Keep names short — 3-5 words is ideal.

---

## 3. Commit style

We use conventional commits loosely. Subject line format:

```
<type>(<scope>): <short imperative description>
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `security`  
Scope: the module or area touched (e.g. `auth`, `invoices`, `erp-client`, `ci`)

Examples:
```
feat(invoices): add status filter to DataTable
fix(session): debounce lastActiveAt updates to 60s
chore(deps): bump next from 15.0.2 to 15.1.0
security(csrf): add double-submit validation to invite/accept
```

No period at the end of the subject. Body is optional but appreciated for
non-obvious changes. Reference issues with `Closes #123`.

---

## 4. Code patterns to follow

### API routes
- Use `apiSuccess` / `apiError` from `@/types/api` — never return raw JSON shapes
- Add `securityHeaders()` to every response
- Rate-limit with `checkRateLimit` from `lib/ratelimit.ts` (or the newer tiered version for new routes)
- Validate session with `validateSession` — extract the token from cookies first, don't pass the Request object
- Catch everything at the top level and capture with Sentry

### Services / data layer
- Business logic goes in `lib/services/`, not in route handlers
- Data access goes in `lib/data/`, not in services or routes
- Use the `Result<T, E>` pattern (`ok()` / `err()` from `lib/utils/result`) — don't throw from services
- Always scope DB queries by `accountId` for multi-tenancy — use `withTenant()` if in doubt

### Frontend components
- New data-fetching: use `useErpList` / `useErpDoc` from `lib/queries/` (React Query)
- Old pages (accounting, invoices, expenses) still use raw `fetch()` — migrate when you touch them
- Form state: `useState` is fine; no need for form libraries yet
- Don't add new inline styles — use Tailwind classes

### Testing
- Unit tests alongside source files (`lib/foo.test.ts`)
- Use `test/factories.ts` for consistent test data
- Mock ERPNext with `mockErpNextHandlers` from `test/helpers.ts`

---

## 5. PR checklist

Before requesting a review, make sure:

- [ ] `npm run build` passes locally (no TypeScript errors)
- [ ] `npm test` passes
- [ ] No new `console.log` statements (use `logger.info/debug`)
- [ ] New env vars added to `.env.example` with a generation hint
- [ ] If you touched `prisma/schema.prisma`, a matching migration file exists in `prisma/migrations/`
- [ ] If you added a route, it's covered by a basic smoke test
- [ ] If you made a breaking API change, the old version still works until clients migrate

If your PR is security-related, add the `security` label and tag a second reviewer.

---

## 6. Things we know are inconsistent

Don't let these patterns spread, but don't refactor them in an unrelated PR either:

- `lib/ratelimit.ts` — deprecated fixed-window rate limiter. Still used by existing routes. Don't add new callers. See TD-01.
- `app/dashboard/accounting/page.tsx` — pre-refactor page. Works but doesn't follow current patterns.
- Most API routes don't use `createPipeline()` yet. They work; migrate when touching. See TD-05.

Full list: `docs/TECH-DEBT.md`.

---

## 7. Questions?

Open a GitHub Discussion or ping in Slack `#engineering`. We don't have
office hours but someone usually responds within a few hours.
