# Technical Debt Register

Last updated: 2026-02-14 · Owner: Engineering

This file tracks known technical debt and planned improvements. Items are not bugs —
the code works — but they represent shortcuts we made consciously and want to fix.

---

| ID    | Area                  | Description                                                                                                                                                                     | Severity | Effort | Target     |
|-------|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|--------|------------|
| TD-01 | Rate limiting         | ~~`lib/ratelimit.ts` uses fixed-window.~~ **Resolved:** All routes migrated to `checkTieredRateLimit` (sliding window) in `lib/api/rate-limit-tiers.ts`; `lib/ratelimit.ts` removed. | Medium   | 2d     | Q2 2026    |
| TD-02 | React Query migration | ~~Invoices/expenses use raw `fetch()` + `useEffect`.~~ **Resolved:** Both pages use `useErpList()`. | Low      | 1d     | Q2 2026    |
| TD-03 | L1 cache eviction     | `lib/cache.ts` L1 layer is an unbounded `Map`. No LRU eviction. Works at current scale but will leak memory under high tenant count. Replace with `lru-cache`. | Medium   | 0.5d   | Q2 2026    |
| TD-04 | Feature flag staleness | ~~Module-level cache never invalidated.~~ **Resolved:** `setFlag()` publishes `flag.updated` via realtime; SSE stream subscribes to global channel; `useFeatureFlag` listens and re-fetches on event. | Low      | 1d     | Q3 2026    |
| TD-05 | Pipeline migration    | Most API routes (`erp/list`, `erp/doc`, `auth/*`, `invite/*`) still use hand-rolled middleware calls instead of `createPipeline()`. Works but is inconsistent and harder to audit. | Low      | 3d     | Q3 2026    |
| TD-06 | Webhook persistence   | ~~Circuit-breaker in Redis only.~~ **Resolved:** Failure count and circuit state written to both Redis and `WebhookEndpoint`; `getCircuitState()` reads Redis then DB fallback. | Medium   | 1d     | Q2 2026    |
| TD-07 | Invite uniqueness     | ~~No unique on `(account_id, email)`.~~ **Resolved:** Added `@@unique([accountId, email])` and migration `20260307100000_invite_token_unique`. | Low      | 0.5d   | Q2 2026    |
| TD-08 | ERPNext retry         | ~~No retry on 502/503.~~ **Resolved:** `fetchErp` uses 3 attempts with 500ms exponential backoff on 502, 503, 429 and network errors. | Medium   | 0.5d   | Q2 2026    |
| TD-09 | ERP list pagination   | ~~Offset pagination doesn't scale past ~10k rows.~~ **Resolved:** API accepts `page` (default 0), returns `meta: { page, pageSize, hasMore }`; `useErpList` exposes `hasMore`; invoices/expenses have Previous/Next. | Low      | 0.5d   | Q2 2026    |

---

### Severity scale
- **Critical** — active data loss / security risk. Fix immediately.
- **High** — degrades reliability or correctness in production.
- **Medium** — technical risk that will compound. Fix in the current quarter.
- **Low** — quality/consistency issue. Fix when touching adjacent code.

### Adding items
Open a PR that adds a row here **before** opening an issue or writing any code.
Include the area, a clear description that links to the specific file/function, severity, and a rough effort estimate.
