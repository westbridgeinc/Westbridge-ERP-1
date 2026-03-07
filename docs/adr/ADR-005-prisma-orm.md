# ADR-005: Prisma as ORM

## Status: Accepted
## Date: 2025-01-01

## Context
Options: raw SQL + pg driver, Drizzle ORM, Prisma, TypeORM.

## Decision
Use Prisma with the `@prisma/adapter-pg` adapter for PostgreSQL. Schema in `prisma/schema.prisma`. Migrations via `prisma migrate`.

## Consequences
- **Positive**: Type-safe queries, automatic migration generation, excellent Next.js integration.
- **Positive**: Prisma Studio for visual DB inspection during development.
- **Negative**: Prisma client generation step required in CI (`prisma generate`).
- **Negative**: Prisma's `$queryRaw` must use tagged templates — never `$queryRawUnsafe`.
