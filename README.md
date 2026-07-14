# EcoSphere

**EcoSphere** is an enterprise-grade, multi-tenant ESG (Environmental, Social, Governance) management platform built from scratch for the Odoo Hiring Hackathon. It combines rigorous relational data modeling, approval-gated side effects, ledger-based gamification, and a modern React dashboard.

## Architecture

See **[docs/STACK.md](docs/STACK.md)** for full non-negotiable stack compliance mapping.

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Recharts |
| Backend | NestJS, Passport JWT, Drizzle ORM |
| Database | PostgreSQL 16 (ACID, constraints, snapshots, ledgers) |
| Jobs / cache | Redis, BullMQ |
| Monorepo | pnpm workspaces |

## Core engineering patterns

1. **Multi-tenancy** — every tenant-scoped row carries `organization_id`; API enforces tenant guards on all org routes.
2. **Historical integrity** — emission factors, ESG weightages, and reward costs are snapshotted at write time.
3. **Approval-gated side effects** — XP, points, badges, and carbon ledger entries are awarded only after approval, with idempotent ledger constraints.
4. **Inventory semantics** — reward stock decrements use `SELECT ... FOR UPDATE` inside a transaction.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop (for PostgreSQL and Redis)

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env

# 3. Start infrastructure
docker compose up -d

# 4. Build shared packages
pnpm --filter @ecosphere/shared build
pnpm --filter @ecosphere/db build

# 5. Generate and run migrations
pnpm db:generate
pnpm db:migrate

# 6. Seed demo data
pnpm db:seed

# 7. Start API and web app
pnpm dev
```

- Web app: http://localhost:5173
- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/api/docs

## Demo credentials

Password for all demo users: `Password123!`

| Email | Role |
|---|---|
| superadmin@ecosphere.io | Super Admin |
| orgadmin@greentech.io | Organization Admin |
| esgmanager@greentech.io | ESG Manager |
| depthead@greentech.io | Department Head + Employee |
| auditor@greentech.io | Auditor |
| employee@greentech.io | Employee |

## Project structure

```text
ecosphere/
├── apps/
│   ├── api/          NestJS REST API
│   └── web/          React SPA
├── packages/
│   ├── shared/       Zod schemas, RBAC constants, shared types
│   └── db/           Drizzle schema, migrations, seed
└── docker-compose.yml
```

## API highlights

- `POST /auth/login` — JWT access token + httpOnly refresh cookie
- `GET /orgs/:orgId/reports/dashboard` — ESG command center metrics
- `POST /orgs/:orgId/social/csr` — submit CSR activity (approval required)
- `POST /orgs/:orgId/environmental/carbon-transactions` — carbon activity with factor snapshot
- `GET /orgs/:orgId/approvals/inbox` — role-scoped approval inbox
- `POST /orgs/:orgId/approvals/:id/decide` — idempotent approval side effects
- `GET /orgs/:orgId/gamification/me` — ledger-derived XP, points, badges

## Hackathon evaluation strengths

- Fully custom backend (no BaaS)
- Normalized PostgreSQL schema with CHECK constraints and unique idempotency indexes
- Explicit RBAC via `user_roles` (multi-role per person)
- Snapshot and ledger patterns implemented in production code paths
- Polished dark-mode enterprise UI with real data flows

## License

Proprietary — Odoo Hiring Hackathon submission.
