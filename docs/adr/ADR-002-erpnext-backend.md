# ADR-002: ERPNext as the ERP backend

## Status: Accepted
## Date: 2025-01-01

## Context
We needed a full-featured ERP system covering invoicing, inventory, HR, and accounting without building from scratch. Candidates: ERPNext, Odoo, custom Prisma-only solution.

## Decision
Use ERPNext (Frappe Framework) as the ERP data layer, accessed via its REST API. Westbridge acts as a multi-tenant proxy — each account's data is scoped to an `erpnextCompany`.

## Consequences
- **Positive**: Mature, open-source ERP covering 30+ modules out of the box.
- **Positive**: Active community, Frappe Framework REST API is well-documented.
- **Negative**: ERPNext has its own auth system — we bridge it via encrypted SID storage.
- **Negative**: Multi-tenancy is enforced at the query level (company filter injection), not at the database level.
- **Risk**: ERPNext REST API changes require updates to `lib/data/erpnext.client.ts`.
