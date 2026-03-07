# Westbridge — Local setup

One-time setup so you can run the app and use ERPNext-backed modules (Invoices, CRM, Expenses).

## Prerequisites

- **Node.js** 20+
- **Docker & Docker Compose** (for Postgres + ERPNext)
- **Git**

## Quick setup (recommended)

From the project root (`westbridge/`):

```bash
# 1. Run setup script (creates .env, installs deps, pushes DB schema)
chmod +x scripts/setup.sh
./scripts/setup.sh

# 2. Start Postgres + ERPNext
docker compose up -d

# 3. Wait for ERPNext to be ready (~2–3 min first time), then start the app
npm run dev
```

Open **http://localhost:3000**. Sign up and pricing work; for **Invoices / CRM / Expenses** you need an ERPNext user (see below).

---

## Step-by-step

### 1. Environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work with Docker below)
```

- **DATABASE_URL** — Default `postgresql://postgres:postgres@localhost:5432/westbridge` matches the Docker Postgres from `docker-compose`.
- **ERPNEXT_URL** — Default `http://localhost:8080` (ERPNext in Docker).
- **NEXT_PUBLIC_APP_URL** — Default `http://localhost:3000`.

### 2. Start Docker services

```bash
docker compose up -d
```

This starts:

- **Postgres** (port 5432) — Westbridge app DB (signup, accounts).
- **MariaDB** (3307), **Redis** (6380), **ERPNext** (8080), **ERPNext worker**.

### 3. Database (Westbridge app)

If you didn’t run `./scripts/setup.sh`:

```bash
npm install
npx prisma generate
npx prisma db push
```

### 4. Create ERPNext site (first time only)

ERPNext needs a site and user so you can log in from Westbridge and see real data in Invoices/CRM/Expenses.

1. Wait until ERPNext is up: open **http://localhost:8080** (you may see “Site not found” at first).
2. Create a site and install ERPNext (e.g. via bench in the container or the Frappe/ERPNext install wizard if exposed).
3. Create a user (e.g. Administrator or a new user) and note email/password.

**Using bench in the container (optional):**

```bash
# List containers
docker compose ps

# Shell into ERPNext container (name may vary, e.g. westbridge-erpnext-1)
docker compose exec erpnext bash

# Inside container: create site and install app (replace site-name and admin password)
bench new-site site-name.local --admin-password YOUR_ADMIN_PASSWORD --no-mariadb-socket
bench --site site-name.local install-app erpnext
bench use site-name.local
exit
```

Then in the browser use **http://localhost:8080** and log in with that user.

### 5. Run the Westbridge app

```bash
npm run dev
```

- **http://localhost:3000** — Marketing, pricing, signup, login.
- Log in with your **ERPNext** email/password → Dashboard.
- **Dashboard → Invoices, CRM, Expenses** load data from ERPNext when logged in.

---

## Production deployment

- **Database:** Set `DATABASE_URL` in your host’s environment. Run migrations: `npx prisma migrate deploy`. (If the DB was created earlier with `db push`, run `npx prisma migrate resolve --applied 20260303000000_init` once, then use `migrate deploy` for future migrations.)
- **Security:** The app sends security headers (X-Frame-Options, X-Content-Type-Options, HSTS in production). Serve over HTTPS; the app sets `Secure` on the session cookie when `NODE_ENV=production`.
- **Health:** `GET /api/health` returns 200 when DB and required env are OK, 503 otherwise. Env details are omitted in production.

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| “Could not reach database” | Start Postgres: `docker compose up -d postgres`, then `npx prisma db push`. |
| “Session expired” / 401 on Invoices or CRM | Log in again at /login with your ERPNext user. |
| ERPNext “Site not found” | Create a site (see “Create ERPNext site” above). |
| Port 5432 or 8080 in use | Change ports in `docker-compose.yml` or stop the other service using the port. |

---

## 2Checkout (payments)

Payments are processed via **2Checkout (Verifone)**. You must configure it for signup → payment → activation to work.

1. Get **TWOCO_MERCHANT_CODE**, **TWOCO_SECRET_WORD**, and payment links from 2Checkout.
2. Add them to `.env` (see `.env.example`): `TWOCO_LINK_STARTER`, `TWOCO_LINK_GROWTH` (or `TWOCO_LINK_PROFESSIONAL`), `TWOCO_LINK_BUSINESS` (or `TWOCO_LINK_ENTERPRISE`).
3. Set the IPN URL in 2Checkout: `https://<your-domain>/api/webhooks/2checkout`.

Full steps: **`docs/2CHECKOUT-SETUP.md`**.
