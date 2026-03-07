# ADR-001: Next.js as the full-stack framework

## Status: Accepted
## Date: 2025-01-01

## Context
We needed a single framework to handle both the marketing site, the authentication flows, and the dashboard application. We evaluated: Next.js, Remix, SvelteKit, and a separate React SPA + Express API.

## Decision
Use Next.js 16 with the App Router as the single full-stack framework. API routes live at `/app/api/*`, pages at `/app/*`.

## Consequences
- **Positive**: Single deployment unit, shared types between frontend and backend, first-class TypeScript support, Vercel-optimised, excellent DX.
- **Positive**: App Router enables React Server Components for fast initial loads.
- **Negative**: Stateful WebSocket connections require a separate process (we use SSE instead where possible).
- **Negative**: `"use client"` / `"use server"` boundary requires discipline.
