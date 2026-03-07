# Mass production grade — implementation status

This doc tracks upgrades to the Westbridge codebase toward the standard described in the project brief (Microsoft/Stripe/Linear/Vercel bar). The app is tailored to the **Westbridge Inc.** logo (black/white wordmark + stylized W/D mark).

---

## ✅ Done

### Branding (Westbridge Inc. logo)
- **Logo asset** — `public/images/logo.png` (company logo: WESTBRIDGE + INC. wordmark).
- **Config** — `SITE.logoPath`, `SITE.faviconPath`, `SITE.wordmark`, `SITE.legal` in `lib/config/site.ts`.
- **Marketing** — Navbar and Footer use the logo image; favicon set in root layout metadata.
- **Auth** — Login left panel and signup nav show the logo (inverted on dark for visibility).
- **Dashboard** — Sidebar shows the logo (inverted) instead of a letter mark.

### Architecture
- **Constants** — `lib/constants.ts`: HTTP status codes, rate limits, cookie names, pagination defaults, locale (GYD default, VAT 14%, timezone America/Guyana), `DISPLAY_RATE_USD_TO_GYD` for pricing.
- **Request ID** — `getRequestId(request)` in `types/api.ts`; login route uses it in every `apiMeta()` and logs it on auth failure.
- **API shape** — All responses use `{ data, meta: { timestamp, request_id?, pagination? } }` or `{ error: { code, message, details? }, meta }`. Login route is a thin controller: rate limit → CSRF → parse → service → response.
- **Result pattern** — Services return `Result<T, string>`; no business logic in API routes or components for auth.
- **Caribbean locale** — `lib/locale/currency.ts` (formatCurrency, parseCurrency, GYD/USD/TTD/BBD/XCD/JMD), `lib/locale/date.ts` (formatDate DD/MM/YYYY, formatDateLong, formatDateTime with America/Guyana).

### Design system
- **Tokens** — `app/globals.css`: CTA teal `#14b8a6`, gold accent `#facc15`, marketing ground `#fafaf9` / white, dashboard true dark `#0a0a0a`, cards `#111111`, border `#1a1a1a`; `--color-input-bg` for dashboard inputs (`#161616`).
- **Typography** — Plus Jakarta Sans for headings (`.text-display`, `.text-h1`, `.text-h2`, `.text-h3`), Inter for body; both loaded in `app/layout.tsx`.
- **UI primitives** — `components/ui/Button.tsx` (primary/secondary/danger/ghost, sm/md/lg, loading), `components/ui/Input.tsx` (label, error, helperText, focus ring, dashboard surface), `components/ui/Card.tsx` (padding variants), `components/ui/Skeleton.tsx` (shimmer keyframe in globals).

### Marketing
- **Home** — Server `page.tsx` with metadata + Open Graph; client `home-content.tsx` with Framer Motion (stagger hero, whileInView sections, magnetic CTA hover/tap). Bold hero copy, trial copy from `TRIAL.days`.
- **Pricing** — GYD/USD toggle and annual billing with “2 months free” gold badge in `pricing-cards.tsx`; prices via `formatCurrency` and `DISPLAY_RATE_USD_TO_GYD`; Growth highlighted as “Most popular”.

### Dashboard
- **Theme** — `.dashboard-theme` sets ground `#0a0a0a`, elevated `#111`, input bg `#161616`, border `#1a1a1a`.
- **Sidebar** — 240px width, teal active state; layout main `ml-[240px]`.

### Config
- **Site** — `CURRENCY.defaultDisplay`, `CURRENCY.supported` for frontend GYD/USD.

---

## ✅ Also done (this pass)

- **API request_id** — All relevant routes use `getRequestId(request)` and include `request_id` in meta (login, signup, erp/list, erp/doc, health, csrf). Webhook uses `RATE_LIMIT.WEBHOOK_2CO_PER_MINUTE`.
- **Modules page** — Filterable grid by category with Framer Motion (stagger + AnimatePresence on filter).
- **Dashboard** — `DashboardTopbar`: breadcrumbs left, search (⌘K) center, New Invoice / New Contact + notifications right. `CommandPalette`: Cmd+K modal, search actions, keyboard nav.
- **Signup** — Step synced to URL (`?step=1`–`4`); password strength checklist (8+ chars, uppercase, number); submit button shows “Setting up your workspace…”; signup nav uses logo.
- **Toasts** — `ToastsProvider` in root layout; `useToasts()` with `addToast(message, variant, { action, persist })`; bottom-right stack.
- **ERP row-level security** — `erp/list` reads `westbridge_account_id` cookie and passes `accountId` to service/data layer; when multi-tenant ERP is configured, data layer can scope by account.

## 🔲 Optional next steps

1. **DataTable** — Reusable sortable table with bulk select, status badges, pagination “1–20 of 147”, empty/error states; use on invoices, CRM, etc.
2. **Skeletons** — Replace any remaining spinners on list pages with `<Skeleton>` from `components/ui/Skeleton.tsx`.
3. **About / meta** — Ensure all marketing pages have meta description and OG where missing.
4. **Logging** — Replace any remaining `console.log` with `logger`; use `lib/constants` for magic numbers/strings.

---

## File reference

| Area           | Files |
|----------------|-------|
| Constants      | `lib/constants.ts` |
| API meta       | `types/api.ts` (apiMeta, getRequestId) |
| Locale         | `lib/locale/currency.ts`, `lib/locale/date.ts` |
| Design tokens  | `app/globals.css` (@theme, .dashboard-theme, :root) |
| Fonts          | `app/layout.tsx` (Inter, Plus_Jakarta_Sans) |
| UI             | `components/ui/Button.tsx`, `Input.tsx`, `Card.tsx`, `Skeleton.tsx` |
| Marketing home | `app/(marketing)/page.tsx`, `app/(marketing)/home-content.tsx` |
| Pricing        | `app/(marketing)/pricing/page.tsx`, `app/(marketing)/pricing/pricing-cards.tsx` |
| Dashboard      | `app/dashboard/layout.tsx`, `app/dashboard/DashboardSidebar.tsx` |
| Login API      | `app/api/auth/login/route.ts` (request_id, RATE_LIMIT) |

Build: `npm run build`. Tests: `npm run test`.
