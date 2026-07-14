import { z } from 'zod';
import { CARBON_SCOPES } from '../constants/domain.js';
import { datetimeLocalInputSchema, flexibleDateTimeSchema } from '../datetime.js';

const sha256Hash = z
  .string()
  .length(64)
  .regex(/^[a-f0-9]+$/i, 'Must be a 64-character hexadecimal SHA-256 digest');

/** Scope 1 — direct combustion / process / fugitive emissions. */
export const scope1ActivitySchema = z.object({
  scope: z.literal('scope_1'),
  activityType: z.enum([
    'stationary_combustion',
    'mobile_combustion',
    'process_emissions',
    'fugitive_emissions',
  ]),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(50),
  emissionFactorKgPerUnit: z.number().positive(),
  emissionFactorSource: z.string().min(1).max(200),
  gwpTimeHorizon: z.enum(['AR4', 'AR5', 'AR6']).default('AR6'),
});

/** Scope 2 — purchased electricity, steam, heating, cooling. */
export const scope2ActivitySchema = z.object({
  scope: z.literal('scope_2'),
  activityType: z.enum(['purchased_electricity', 'purchased_steam', 'purchased_heating_cooling']),
  quantityKwh: z.number().positive(),
  gridEmissionFactorKgPerKwh: z.number().positive(),
  calculationMethod: z.enum(['location_based', 'market_based']).default('location_based'),
  /** IPCC T&D loss factor applied to location-based Scope 2 (default 5%). */
  transmissionDistributionLossRate: z.number().min(0).max(0.5).default(0.05),
  renewableEnergyCertificatesMwh: z.number().min(0).default(0),
  emissionFactorSource: z.string().min(1).max(200),
});

/** Scope 3 — upstream/downstream value chain. */
export const scope3ActivitySchema = z.object({
  scope: z.literal('scope_3'),
  activityType: z.enum([
    'business_travel_air',
    'business_travel_road',
    'employee_commuting',
    'purchased_goods_services',
    'upstream_transport',
    'waste_generated',
  ]),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(50),
  emissionFactorKgPerUnit: z.number().positive(),
  /** Radiative forcing index for aviation (GHG Protocol / DEFRA, default 1.9). */
  radiativeForcingIndex: z.number().min(1).max(3).default(1.9),
  emissionFactorSource: z.string().min(1).max(200),
});

export const calculateCarbonRequestSchema = z.discriminatedUnion('scope', [
  scope1ActivitySchema,
  scope2ActivitySchema,
  scope3ActivitySchema,
]);

export type CalculateCarbonRequest = z.infer<typeof calculateCarbonRequestSchema>;
export type Scope1ActivityInput = z.infer<typeof scope1ActivitySchema>;
export type Scope2ActivityInput = z.infer<typeof scope2ActivitySchema>;
export type Scope3ActivityInput = z.infer<typeof scope3ActivitySchema>;

export const carbonCalculationBreakdownSchema = z.object({
  label: z.string(),
  value: z.number(),
  unit: z.string(),
});

export const carbonCalculationResponseSchema = z.object({
  scope: z.enum(CARBON_SCOPES),
  activityType: z.string(),
  co2eKg: z.number(),
  co2eTonnes: z.number(),
  formula: z.string(),
  method: z.string(),
  breakdown: z.array(carbonCalculationBreakdownSchema),
  emissionFactorSource: z.string(),
  calculatedAt: z.string().datetime(),
});

export type CarbonCalculationResponse = z.infer<typeof carbonCalculationResponseSchema>;

export const verifyDocumentRequestSchema = z.object({
  documentHash: sha256Hash,
  documentFileKey: z.string().max(500).optional(),
  resourceType: z.enum(['energy', 'water', 'carbon_evidence']).optional(),
});

export type VerifyDocumentRequest = z.infer<typeof verifyDocumentRequestSchema>;

export const documentVerificationResponseSchema = z.object({
  documentHash: z.string(),
  isValidFormat: z.boolean(),
  isUnique: z.boolean(),
  verificationStatus: z.enum(['verified', 'duplicate', 'invalid_format']),
  verifiedAt: z.string().datetime(),
  message: z.string(),
});

export type DocumentVerificationResponse = z.infer<typeof documentVerificationResponseSchema>;

export const carbonFootprintSummarySchema = z.object({
  organizationId: z.string().uuid(),
  periodStart: z.string().datetime().nullable(),
  periodEnd: z.string().datetime().nullable(),
  scope1Kg: z.number(),
  scope2Kg: z.number(),
  scope3Kg: z.number(),
  totalKg: z.number(),
  totalTonnes: z.number(),
  transactionCount: z.number(),
  calculatedAt: z.string().datetime(),
});

export type CarbonFootprintSummary = z.infer<typeof carbonFootprintSummarySchema>;

export const createCarbonTransactionWithCalculationSchema = z.object({
  departmentId: z.string().uuid(),
  activityType: z.string().min(1).max(100),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(50),
  emissionFactorId: z.string().uuid(),
  activityDate: flexibleDateTimeSchema,
  description: z.string().max(2000).optional(),
  evidenceFileKey: z.string().max(500).optional(),
  evidenceDocumentHash: sha256Hash.or(z.literal('')).optional().transform(v => v === '' ? undefined : v),
  transmissionDistributionLossRate: z.number().min(0).max(0.5).optional(),
  radiativeForcingIndex: z.number().min(1).max(3).optional(),
});

export const createCarbonTransactionFormSchema = createCarbonTransactionWithCalculationSchema
  .omit({ activityDate: true })
  .extend({
    activityDate: datetimeLocalInputSchema,
  });

export type CreateCarbonTransactionWithCalculationInput = z.infer<
  typeof createCarbonTransactionWithCalculationSchema
>;
export type CreateCarbonTransactionFormInput = z.infer<typeof createCarbonTransactionFormSchema>;

const metricLogBaseSchema = z.object({
  departmentId: z.string().uuid(),
  emissionFactorId: z.string().uuid(),
  activityDate: flexibleDateTimeSchema,
  description: z.string().max(2000).optional(),
  evidenceFileKey: z.string().max(500).optional(),
  evidenceDocumentHash: sha256Hash.or(z.literal('')).optional().transform(v => v === '' ? undefined : v),
});

/** Scope 1 — direct fuel combustion (diesel, petrol, natural gas, etc.). */
export const logScope1EnvironmentalMetricSchema = metricLogBaseSchema.extend({
  scope: z.literal('scope_1'),
  activityType: z.enum([
    'stationary_combustion',
    'mobile_combustion',
    'diesel_combustion',
    'natural_gas_combustion',
    'process_emissions',
    'fugitive_emissions',
  ]),
  /** Operational quantity — e.g. liters of diesel, m³ of natural gas. */
  quantity: z.number().positive(),
  unit: z.enum(['L', 'liters', 'liter', 'm3', 'kg', 'GJ', 'tonnes']),
  fuelType: z.enum(['diesel', 'petrol', 'natural_gas', 'lpg', 'coal', 'other']).optional(),
  gwpTimeHorizon: z.enum(['AR4', 'AR5', 'AR6']).default('AR6'),
});

/** Scope 2 — purchased electricity (kWh). */
export const logScope2EnvironmentalMetricSchema = metricLogBaseSchema.extend({
  scope: z.literal('scope_2'),
  activityType: z
    .enum(['purchased_electricity', 'purchased_steam', 'purchased_heating_cooling'])
    .default('purchased_electricity'),
  quantityKwh: z.number().positive('Electricity consumption must be greater than zero kWh.'),
  calculationMethod: z.enum(['location_based', 'market_based']).default('location_based'),
  transmissionDistributionLossRate: z.number().min(0).max(0.5).default(0.05),
  renewableEnergyCertificatesMwh: z.number().min(0).default(0),
});

/** Scope 3 — supply chain / value chain activities. */
export const logScope3EnvironmentalMetricSchema = metricLogBaseSchema.extend({
  scope: z.literal('scope_3'),
  activityType: z.enum([
    'business_travel_air',
    'business_travel_road',
    'employee_commuting',
    'purchased_goods_services',
    'upstream_transport',
    'waste_generated',
  ]),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(50),
  radiativeForcingIndex: z.number().min(1).max(3).default(1.9),
});

export const logEnvironmentalMetricSchema = z.discriminatedUnion('scope', [
  logScope1EnvironmentalMetricSchema,
  logScope2EnvironmentalMetricSchema,
  logScope3EnvironmentalMetricSchema,
]);

export type LogEnvironmentalMetricInput = z.infer<typeof logEnvironmentalMetricSchema>;
export type LogScope1EnvironmentalMetricInput = z.infer<typeof logScope1EnvironmentalMetricSchema>;
export type LogScope2EnvironmentalMetricInput = z.infer<typeof logScope2EnvironmentalMetricSchema>;
export type LogScope3EnvironmentalMetricInput = z.infer<typeof logScope3EnvironmentalMetricSchema>;

export const environmentalMetricLogResponseSchema = z.object({
  transaction: z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    scope: z.enum(CARBON_SCOPES),
    co2eKg: z.string(),
    status: z.string(),
  }),
  calculation: carbonCalculationResponseSchema,
  auditLogId: z.string().uuid(),
  integrityHash: z.string().length(64),
});

export type EnvironmentalMetricLogResponse = z.infer<typeof environmentalMetricLogResponseSchema>;
