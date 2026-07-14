# EcoSphere Technology Stack Compliance

This document maps the **non-negotiable** hackathon stack requirements to concrete implementation artifacts in this repository.

## Frontend

| Requirement | Implementation | Location |
|---|---|---|
| React.js (Vite) | React 18 + Vite 6 | `apps/web/` |
| TypeScript strict | `strict: true`, `noUncheckedIndexedAccess: true` | `apps/web/tsconfig.json` |
| Tailwind CSS | Utility-first styling + component layer | `apps/web/tailwind.config.js`, `src/index.css` |
| React Router v6 | Nested org-scoped routes + guards | `apps/web/src/app/router.tsx` |
| TanStack Query v5 | Server-state caching, invalidation | `apps/web/src/app/providers.tsx`, feature `api/` hooks |
| React Hook Form | CSR, carbon, login forms | `apps/web/src/features/**` |
| Zod | Shared client/server validation | `packages/shared/src/schemas/` |
| Recharts | Carbon trend bar chart | `apps/web/src/features/reports/DashboardPage.tsx` |
| Apache ECharts | ESG domain radar chart | `apps/web/src/features/reports/EsgScoreChart.tsx` |

## Backend

| Requirement | Implementation | Location |
|---|---|---|
| Node.js + NestJS + TypeScript | NestJS 10 monolith | `apps/api/` |
| Repository-Service-Controller | Strict 3-layer separation | `apps/api/src/database/repositories/`, `modules/*/service`, `modules/*/controller` |
| TypeScript strict | `strict`, `noImplicitAny`, `noUncheckedIndexedAccess` | `apps/api/tsconfig.json` |
| JWT auth (self-hosted) | Passport JWT + refresh cookie rotation | `apps/api/src/modules/auth/` |
| OpenAPI | Swagger at `/api/docs` | `apps/api/src/main.ts` |

### Repository-Service-Controller flow

```text
HTTP Request
  → Controller (validation, guards, HTTP mapping)
    → Service (business rules, orchestration, transactions)
      → Repository (SQL/Drizzle data access only)
        → PostgreSQL
```

Repositories **never** contain business rules. Services **never** construct raw SQL.

## Database

| Requirement | Implementation | Location |
|---|---|---|
| PostgreSQL | Version 16 via Docker | `docker-compose.yml` |
| Foreign keys | Drizzle `.references()` on all relations | `packages/db/src/schema/index.ts` |
| Explicit indexes | Schema indexes + supplemental SQL | schema + `infra/postgres/performance-indexes.sql` |
| CHECK constraints | Weightages sum to 100, positive ledger amounts, non-negative stock | Drizzle `check()` in schema |
| ACID transactions | Approval side effects, reward redemption | `ApprovalsService`, `RewardsService` |
| Connection pool tuning | Configurable pool via env | `packages/db/src/index.ts`, `apps/api/src/database/postgres.config.ts` |
| Postgres performance config | `shared_buffers`, `work_mem`, logging | `infra/postgres/postgresql.conf` |

## Explicitly excluded (BaaS ban)

Firebase, Supabase, Appwrite, and PocketBase are **not** used anywhere in this codebase.

## Shared package

`packages/shared` provides Zod schemas, RBAC constants, and DTO types consumed by both API and web — ensuring runtime validation parity across tiers.
