# Westbridge Platform — Run from package

This is a full copy of the Westbridge ERP platform (Next.js, shadcn/ui, Aceternity-style marketing).

## Quick start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env` (if present) and set `DATABASE_URL`, etc.

3. **Database**
   ```bash
   npm run db:push
   ```
   (Or run migrations if your project uses them.)

4. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

5. **Production build** (optional)
   ```bash
   npm run build
   npm start
   ```

## If `npm run build` fails

- Fix any TypeScript errors (e.g. `tsconfig.json` may need to exclude more files, or add `/// <reference types="..." />` for babel).
- Ensure Node version matches the project (see `package.json` engines or use the same major version as in development).

## Project layout

- `app/` — Next.js App Router (auth, dashboard, marketing)
- `components/` — UI (shadcn, dashboard, marketing, aceternity)
- `lib/` — Services, data, config
- `prisma/` — Schema and migrations

## Keep this package

You can move this folder anywhere (e.g. `~/Projects/westbridge`) and run the commands above from there.
