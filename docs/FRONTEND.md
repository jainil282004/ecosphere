# Frontend Architecture — Feature-by-Feature (Step 4)

## Directory Pattern

```
apps/web/src/
├── app/                    # Routing, layouts, providers, guards
├── components/ui/          # Shared design system primitives
├── hooks/                  # Cross-feature hooks (auth, org context)
├── lib/                    # API client, query keys
└── features/
    ├── auth/               # Login, session
    ├── dashboard/          # ESG Command Center (Step 4)
    │   ├── DashboardPage.tsx
    │   ├── index.ts
    │   ├── constants.ts    # Scope color palette
    │   ├── types.ts
    │   ├── components/
    │   │   ├── DashboardMetricsRow.tsx
    │   │   ├── ScopeHistoricalChart.tsx   # Recharts stacked bars
    │   │   ├── ScopeTrendEChart.tsx       # ECharts multi-line
    │   │   ├── LeaderboardPanel.tsx
    │   │   └── EnvironmentalMetricForm.tsx
    │   ├── hooks/
    │   │   ├── useDashboardMetrics.ts
    │   │   ├── useScopeTrendData.ts
    │   │   ├── useLeaderboard.ts
    │   │   └── useLogEnvironmentalMetric.ts  # optimistic mutation
    │   └── utils/
    │       └── aggregateScopeTrend.ts
    ├── carbon/             # Full carbon accounting page
    ├── csr/
    ├── gamification/
    ├── governance/
    ├── social/
    └── reports/            # EsgScoreChart shared widget
```

Each feature owns its pages, components, hooks, and types. Shared UI lives in `components/ui`.

## Dashboard Highlights

| Concern | Implementation |
|---------|----------------|
| Form validation | React Hook Form + `createCarbonTransactionWithCalculationSchema` (Zod) |
| Mutation | `useLogEnvironmentalMetric` — optimistic row + cache invalidation |
| Scope trends | Recharts stacked bar + ECharts line comparison |
| Leaderboard | TanStack Query → `/gamification/leaderboard` |
| Accessibility | `aria-*`, `role="alert"`, `focus-visible` rings, semantic `<section>`/`<ol>` |
| Colors | `scope-1` amber, `scope-2` emerald, `scope-3` indigo |

## Running

```bash
pnpm dev
# Login → Dashboard at /orgs/:orgId/dashboard
```
