# Carbon Footprint Calculation & Verification Pipeline (Step 3)

## Architecture

```
Controller (environmental.controller.ts)
    ↓
EnvironmentalService          — orchestration, approvals, notifications
    ↓
CarbonFootprintService      — GHG Protocol scope formulas
CarbonVerificationService   — SHA-256 document hash verification
    ↓
ActivityRepository / DomainRepository
```

## Zod Request/Response Schemas

All DTOs live in `packages/shared/src/schemas/carbon.ts`:

| Schema | Purpose |
|--------|---------|
| `calculateCarbonRequestSchema` | Discriminated union by `scope` (1/2/3) |
| `carbonCalculationResponseSchema` | Formula output with breakdown |
| `verifyDocumentRequestSchema` | SHA-256 hash verification input |
| `documentVerificationResponseSchema` | verified / duplicate / invalid_format |
| `carbonFootprintSummarySchema` | Org-wide scope totals |
| `createCarbonTransactionWithCalculationSchema` | Persisted transaction + optional RFI/T&D |

## Scope Formulas (`packages/shared/src/carbon/formulas.ts`)

### Scope 1 — Direct
```
CO2e_kg = quantity × emission_factor_kg_per_unit
```
Categories: stationary/mobile combustion, process, fugitive.

### Scope 2 — Indirect Energy
```
Location-based: CO2e_kg = kWh × grid_EF × (1 + T&D_loss_rate)
Market-based:   CO2e_kg = max(0, kWh - REC_kWh) × grid_EF × (1 + T&D_loss_rate)
```
Default T&D loss rate: 5% (IPCC).

### Scope 3 — Value Chain
```
Air travel: CO2e_kg = distance_km × EF_kg_per_km × RFI
Other:      CO2e_kg = quantity × emission_factor_kg_per_unit
```
Default RFI (radiative forcing index): 1.9 (DEFRA/IPCC).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/orgs/:orgId/environmental/carbon/calculate` | Dry-run calculation |
| `POST` | `/orgs/:orgId/environmental/carbon/verify` | Document hash verification |
| `GET`  | `/orgs/:orgId/environmental/carbon/footprint` | Org footprint summary |
| `POST` | `/orgs/:orgId/environmental/carbon-transactions` | Calculate + persist + approval |

## Global Error Handling

`GlobalExceptionFilter` (`apps/api/src/common/filters/global-exception.filter.ts`):

| Source | HTTP Status | Type |
|--------|-------------|------|
| `ZodError` | 400 | `validation` with field-level `errors` |
| PostgreSQL `23505` | 409 | `unique-violation` (document hash, email, slug) |
| PostgreSQL `23503` | 400 | `foreign-key-violation` |
| PostgreSQL `23514` | 400 | `check-violation` |
| PostgreSQL `23502` | 400 | `not-null-violation` |
| Unhandled | 500 | `internal` |

Registered globally in `main.ts`.

## Example: Scope 2 Calculation Request

```json
{
  "scope": "scope_2",
  "activityType": "purchased_electricity",
  "quantityKwh": 10000,
  "gridEmissionFactorKgPerKwh": 0.82,
  "calculationMethod": "location_based",
  "transmissionDistributionLossRate": 0.05,
  "renewableEnergyCertificatesMwh": 0,
  "emissionFactorSource": "CEA 2024"
}
```

Response includes `co2eKg`, `formula`, `method`, and line-item `breakdown`.
